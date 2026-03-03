import { useState, useCallback } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import * as authApi from '../api/auth.ts';

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem('auth-token'));
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('auth-user-id'));

  const register = useCallback(async () => {
    const { options, userId: newUserId } = await authApi.getRegisterOptions();
    const attestation = await startRegistration({ optionsJSON: options });
    const { token } = await authApi.verifyRegistration(newUserId, attestation);
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user-id', newUserId);
    setIsAuthed(true);
    setUserId(newUserId);
    return { token, userId: newUserId };
  }, []);

  const authenticate = useCallback(async (existingUserId: string) => {
    const { options } = await authApi.getAuthOptions(existingUserId);
    const assertion = await startAuthentication({ optionsJSON: options });
    const { token } = await authApi.verifyAuth(existingUserId, assertion);
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user-id', existingUserId);
    setIsAuthed(true);
    setUserId(existingUserId);
    return { token };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user-id');
    setIsAuthed(false);
    setUserId(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem('auth-token'), []);

  return { isAuthed, userId, register, authenticate, logout, getToken };
}
