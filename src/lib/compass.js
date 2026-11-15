import { useCallback, useEffect, useState } from 'react';

/**
 * Device compass heading (degrees clockwise from north), or null when unavailable.
 * iOS needs a tap to grant permission and reports webkitCompassHeading.
 * Android Chrome reports `deviceorientationabsolute`, whose alpha runs counter-clockwise.
 */
export function useCompass() {
    const [heading, setHeading] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | needs-permission | active | unsupported | denied

    const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    const needsPermission = supported && typeof DeviceOrientationEvent.requestPermission === 'function';

    useEffect(() => {
        if (!supported) {
            setStatus('unsupported');
            return;
        }
        if (needsPermission && status === 'idle') {
            setStatus('needs-permission');
            return;
        }
        if (status !== 'idle' && status !== 'active') return;

        let gotReading = false;
        const screenAngle = () => (window.screen?.orientation?.angle ?? window.orientation ?? 0);
        const onIos = (e) => {
            if (typeof e.webkitCompassHeading !== 'number') return;
            gotReading = true;
            setHeading((e.webkitCompassHeading + screenAngle()) % 360);
            setStatus('active');
        };
        const onAbsolute = (e) => {
            if (e.alpha === null) return;
            gotReading = true;
            setHeading((360 - e.alpha + screenAngle()) % 360);
            setStatus('active');
        };

        window.addEventListener('deviceorientation', onIos);
        window.addEventListener('deviceorientationabsolute', onAbsolute);
        // Desktops expose the API but never send readings.
        const timer = setTimeout(() => !gotReading && setStatus((s) => (s === 'active' ? s : 'unsupported')), 1500);
        return () => {
            window.removeEventListener('deviceorientation', onIos);
            window.removeEventListener('deviceorientationabsolute', onAbsolute);
            clearTimeout(timer);
        };
    }, [supported, needsPermission, status]);

    const requestPermission = useCallback(async () => {
        try {
            const result = await DeviceOrientationEvent.requestPermission();
            setStatus(result === 'granted' ? 'active' : 'denied');
        } catch {
            setStatus('denied');
        }
    }, []);

    return { heading, status, requestPermission };
}

/** Shortest signed angle from a to b, in (-180, 180]. */
export function angleDelta(a, b) {
    const d = (((b - a) % 360) + 540) % 360 - 180;
    return d === -180 ? 180 : d;
}
