import { useCallback, useState } from 'react';
import { useStored } from './store';
import { DEFAULT_SETTINGS } from './prayer';
import { DEFAULT_LOCATION } from './cities';

export const useLocation = () => useStored('location', DEFAULT_LOCATION);
export const usePrayerSettings = () => useStored('prayer-settings', DEFAULT_SETTINGS);
export const usePreferences = () => useStored('prefs', { theme: 'system', clock: '24h', translation: true, arabicSize: 26 });

const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Asks for GPS once; on success stores it as the location. */
export function useGps() {
    const [, setLocation] = useLocation();
    const [state, setState] = useState({ busy: false, error: '' });

    const request = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setState({ busy: false, error: 'This device does not support location.' });
            return;
        }
        setState({ busy: true, error: '' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    id: 'gps',
                    name: 'Current location',
                    country: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    timeZone: deviceTimeZone(),
                    source: 'gps',
                });
                setState({ busy: false, error: '' });
            },
            (err) =>
                setState({
                    busy: false,
                    error: err.code === 1 ? 'Location permission was denied. Pick a city instead.' : 'Could not get your location. Pick a city instead.',
                }),
            { timeout: 15000, maximumAge: 10 * 60 * 1000 }
        );
    }, [setLocation]);

    return { ...state, request };
}
