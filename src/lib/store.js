import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

// Small persisted state: every read/write is wrapped, because storage can be blocked
// (private mode, full disk) and the app must still work without it.
const PREFIX = 'noor:';
const listeners = new Set();

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        /* keep working in memory */
    }
    listeners.forEach((fn) => fn(key));
}

/** useState that persists to localStorage and stays in sync across components. */
export function useStored(key, fallback) {
    const [value, setValue] = useState(() => read(key, fallback));
    useEffect(() => {
        const onChange = (changed) => changed === key && setValue(read(key, fallback));
        listeners.add(onChange);
        return () => listeners.delete(onChange);
        // fallback is a constant default
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    const set = useCallback(
        (next) => {
            const resolved = typeof next === 'function' ? next(read(key, fallback)) : next;
            write(key, resolved);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [key]
    );
    return [value, set];
}

// A clock that ticks once per `ms`, shared by every component that asks for it.
export function useNow(ms = 1000) {
    const subscribe = useCallback(
        (cb) => {
            const id = setInterval(cb, ms);
            document.addEventListener('visibilitychange', cb);
            return () => {
                clearInterval(id);
                document.removeEventListener('visibilitychange', cb);
            };
        },
        [ms]
    );
    const snapshot = useCallback(() => Math.floor(Date.now() / ms), [ms]);
    const tick = useSyncExternalStore(subscribe, snapshot);
    return new Date(tick * ms);
}

/** Hash route: "#/quran/18" -> ["quran", "18"]. */
export function useHashRoute() {
    const get = () => (window.location.hash.replace(/^#\/?/, '') || 'today').split('/');
    const [route, setRoute] = useState(get);
    useEffect(() => {
        const on = () => {
            setRoute(get());
            window.scrollTo(0, 0);
        };
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);
    return route;
}

export const navigate = (path) => {
    window.location.hash = `/${path}`;
};
