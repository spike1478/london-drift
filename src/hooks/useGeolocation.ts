import { useState, useEffect } from 'react';

interface GeolocationState {
  position: { lat: number; lon: number } | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ position: null, loading: true, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, loading: false, error: 'Geolocation not supported' });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setState({ position: { lat: pos.coords.latitude, lon: pos.coords.longitude }, loading: false, error: null }),
      (err) => setState({ position: null, loading: false, error: err.message }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
