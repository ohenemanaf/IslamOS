// Prayer times are calculated on the device (adhan library), so they work offline.
import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';

export const PRAYERS = [
    { key: 'fajr', label: 'Fajr', arabic: 'الفجر' },
    { key: 'sunrise', label: 'Sunrise', arabic: 'الشروق', optional: true },
    { key: 'dhuhr', label: 'Dhuhr', arabic: 'الظهر' },
    { key: 'asr', label: 'Asr', arabic: 'العصر' },
    { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب' },
    { key: 'isha', label: 'Isha', arabic: 'العشاء' },
];

export const METHODS = {
    MuslimWorldLeague: 'Muslim World League',
    Egyptian: 'Egyptian General Authority',
    Karachi: 'University of Islamic Sciences, Karachi',
    UmmAlQura: 'Umm al-Qura, Makkah',
    NorthAmerica: 'ISNA (North America)',
    Dubai: 'Dubai',
    Qatar: 'Qatar',
    Kuwait: 'Kuwait',
    Singapore: 'Singapore',
    Turkey: 'Diyanet (Turkey)',
    MoonsightingCommittee: 'Moonsighting Committee',
};

export const DEFAULT_SETTINGS = { method: 'MuslimWorldLeague', madhab: 'shafi' };

// Calendar date (y, m, d) "today" in the location's time zone, so a city in another
// zone gets its own date, not the device's.
export function localYmd(now, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    return [get('year'), get('month'), get('day')];
}

function params({ method, madhab }) {
    const factory = CalculationMethod[method] || CalculationMethod.MuslimWorldLeague;
    const p = factory();
    p.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
    return p;
}

/** Times for the calendar day containing `now` at `location` ({ lat, lng, timeZone }). */
export function timesFor(location, settings = DEFAULT_SETTINGS, now = new Date(), dayOffset = 0) {
    const [y, m, d] = localYmd(now, location.timeZone);
    // adhan reads the date's local Y/M/D; noon avoids DST edges.
    const date = new Date(y, m - 1, d + dayOffset, 12);
    const pt = new PrayerTimes(new Coordinates(location.lat, location.lng), date, params(settings));
    return Object.fromEntries(PRAYERS.map(({ key }) => [key, pt[key]]));
}

/**
 * The next prayer after `now` (skipping sunrise), rolling over to tomorrow's Fajr after Isha.
 * Returns { key, time, previous } where previous is the prayer whose time is current.
 */
export function nextPrayer(location, settings = DEFAULT_SETTINGS, now = new Date()) {
    const today = timesFor(location, settings, now);
    const order = PRAYERS.filter((p) => !p.optional).map((p) => p.key);
    const upcoming = order.find((k) => today[k] > now);
    if (upcoming) {
        const idx = order.indexOf(upcoming);
        return { key: upcoming, time: today[upcoming], previous: idx > 0 ? order[idx - 1] : 'isha' };
    }
    const tomorrow = timesFor(location, settings, now, 1);
    return { key: 'fajr', time: tomorrow.fajr, previous: 'isha' };
}

/** Bearing to the Kaaba in degrees clockwise from true north. */
export const qiblaBearing = ({ lat, lng }) => Qibla(new Coordinates(lat, lng));

export function formatTime(date, timeZone, hour12 = false) {
    return date.toLocaleTimeString(hour12 ? 'en-US' : 'en-GB', { timeZone, hour: hour12 ? 'numeric' : '2-digit', minute: '2-digit', hour12 });
}

/** "1h 24m", "12m", "45s" */
export function formatCountdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m`;
    return `${s}s`;
}

/** Islamic (Umm al-Qura) date, e.g. "5 Jumada II 1448 AH". Pure Intl, works offline. */
export function hijriDate(now = new Date(), timeZone) {
    try {
        return new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', {
            timeZone, day: 'numeric', month: 'long', year: 'numeric',
        }).format(now);
    } catch {
        return '';
    }
}
