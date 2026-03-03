import type { Env } from './index.ts';
import { json, corsHeaders } from './index.ts';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  WebAuthnCredential as SimpleWebAuthnCredential,
} from '@simplewebauthn/server';

interface StoredUser {
  id: string;
  credentials: string[];
  createdAt: string;
}

interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  userId: string;
  transports?: string[];
}

// 30 days in seconds
const SESSION_TTL = 30 * 24 * 60 * 60;
// 5 minutes in seconds
const CHALLENGE_TTL = 5 * 60;

export async function getSessionUserId(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token) return null;
  const userId = await env.USERS.get(`session:${token}`);
  return userId;
}

export async function handleAuth(
  request: Request,
  env: Env,
  path: string,
  origin: string,
): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  const rpID = env.WEBAUTHN_RP_ID;
  const rpName = env.WEBAUTHN_RP_NAME;
  const rpOrigin = origin || `https://${rpID}`;

  try {
    if (path === '/auth/register/options') {
      return await registerOptions(request, env, rpID, rpName, origin);
    }
    if (path === '/auth/register/verify') {
      return await registerVerify(request, env, rpID, rpOrigin, origin);
    }
    if (path === '/auth/authenticate/options') {
      return await authenticateOptions(request, env, rpID, origin);
    }
    if (path === '/auth/authenticate/verify') {
      return await authenticateVerify(request, env, rpID, rpOrigin, origin);
    }
    return json({ error: 'Not found' }, 404, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return json({ error: message }, 500, origin);
  }
}

async function registerOptions(
  _request: Request,
  env: Env,
  rpID: string,
  rpName: string,
  origin: string,
): Promise<Response> {
  const userId = crypto.randomUUID();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: `drift-user-${userId}`,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge temporarily
  await env.USERS.put(
    `challenge:${userId}`,
    options.challenge,
    { expirationTtl: CHALLENGE_TTL },
  );

  return json({ options, userId }, 200, origin);
}

async function registerVerify(
  request: Request,
  env: Env,
  rpID: string,
  rpOrigin: string,
  origin: string,
): Promise<Response> {
  const body = await request.json() as { userId: string; attestation: any };
  const { userId, attestation } = body;

  if (!userId || !attestation) {
    return json({ error: 'Missing userId or attestation' }, 400, origin);
  }

  const expectedChallenge = await env.USERS.get(`challenge:${userId}`);
  if (!expectedChallenge) {
    return json({ error: 'Challenge expired or not found' }, 400, origin);
  }

  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return json({ error: 'Registration verification failed' }, 400, origin);
  }

  const { credential } = verification.registrationInfo;

  // credential.id is already a Base64URLString in v13
  const credentialId = credential.id;

  // Store credential (publicKey is Uint8Array, encode for storage)
  const storedCredential: StoredCredential = {
    credentialId,
    publicKey: base64urlEncode(credential.publicKey),
    counter: credential.counter,
    userId,
    transports: attestation.response?.transports,
  };
  await env.CREDENTIALS.put(credentialId, JSON.stringify(storedCredential));

  // Store user
  const user: StoredUser = {
    id: userId,
    credentials: [credentialId],
    createdAt: new Date().toISOString(),
  };
  await env.USERS.put(userId, JSON.stringify(user));

  // Clean up challenge
  await env.USERS.delete(`challenge:${userId}`);

  // Create session
  const token = crypto.randomUUID();
  await env.USERS.put(`session:${token}`, userId, { expirationTtl: SESSION_TTL });

  return json({ token }, 200, origin);
}

async function authenticateOptions(
  request: Request,
  env: Env,
  rpID: string,
  origin: string,
): Promise<Response> {
  const body = await request.json() as { userId: string };
  const { userId } = body;

  if (!userId) {
    return json({ error: 'Missing userId' }, 400, origin);
  }

  const userJson = await env.USERS.get(userId);
  if (!userJson) {
    return json({ error: 'User not found' }, 404, origin);
  }

  const user: StoredUser = JSON.parse(userJson);

  // Look up each credential to get transports
  const allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
  for (const credId of user.credentials) {
    const credJson = await env.CREDENTIALS.get(credId);
    if (credJson) {
      const cred: StoredCredential = JSON.parse(credJson);
      allowCredentials.push({
        id: credId,
        transports: cred.transports as AuthenticatorTransportFuture[] | undefined,
      });
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });

  // Store challenge
  await env.USERS.put(
    `challenge:${userId}`,
    options.challenge,
    { expirationTtl: CHALLENGE_TTL },
  );

  return json({ options }, 200, origin);
}

async function authenticateVerify(
  request: Request,
  env: Env,
  rpID: string,
  rpOrigin: string,
  origin: string,
): Promise<Response> {
  const body = await request.json() as { userId: string; assertion: any };
  const { userId, assertion } = body;

  if (!userId || !assertion) {
    return json({ error: 'Missing userId or assertion' }, 400, origin);
  }

  const expectedChallenge = await env.USERS.get(`challenge:${userId}`);
  if (!expectedChallenge) {
    return json({ error: 'Challenge expired or not found' }, 400, origin);
  }

  // Look up the credential used
  const credentialIdBase64 = assertion.id;
  const credJson = await env.CREDENTIALS.get(credentialIdBase64);
  if (!credJson) {
    return json({ error: 'Credential not found' }, 400, origin);
  }

  const storedCred: StoredCredential = JSON.parse(credJson);

  const verification = await verifyAuthenticationResponse({
    response: assertion,
    expectedChallenge,
    expectedOrigin: rpOrigin,
    expectedRPID: rpID,
    credential: {
      id: credentialIdBase64,
      publicKey: base64urlDecode(storedCred.publicKey),
      counter: storedCred.counter,
      transports: storedCred.transports as AuthenticatorTransportFuture[] | undefined,
    },
  });

  if (!verification.verified) {
    return json({ error: 'Authentication verification failed' }, 400, origin);
  }

  // Update counter
  storedCred.counter = verification.authenticationInfo.newCounter;
  await env.CREDENTIALS.put(credentialIdBase64, JSON.stringify(storedCred));

  // Clean up challenge
  await env.USERS.delete(`challenge:${userId}`);

  // Create session
  const token = crypto.randomUUID();
  await env.USERS.put(`session:${token}`, userId, { expirationTtl: SESSION_TTL });

  return json({ token }, 200, origin);
}

// Utility: encode Uint8Array to base64url string
function base64urlEncode(buffer: Uint8Array<ArrayBuffer>): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Utility: decode base64url string to Uint8Array
function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
