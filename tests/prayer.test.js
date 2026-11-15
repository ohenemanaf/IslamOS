import { describe, expect, test } from 'vitest';
import { formatCountdown, formatTime, hijriDate, localYmd, nextPrayer, qiblaBearing, timesFor } from '../src/lib/prayer.js';
import { CITIES } from '../src/lib/cities.js';

const city = (id) => CITIES.find((c) => c.id === id);
const minutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};
const at = (date, tz) => minutes(formatTime(date, tz));

// Reference values from api.aladhan.com (the source the old IslamOS app used) for 15 Nov 2026.
const NOV_15 = new Date(Date.UTC(2026, 10, 15, 12));

describe('prayer times match Aladhan within a minute', () => {
    test.each([
        ['accra', 'MuslimWorldLeague', { fajr: '04:37', sunrise: '05:49', dhuhr: '11:45', asr: '15:08', maghrib: '17:41', isha: '18:50' }],
        ['makkah', 'UmmAlQura', { fajr: '05:12', sunrise: '06:32', dhuhr: '12:05', asr: '15:16', maghrib: '17:39', isha: '19:09' }],
    ])('%s (%s)', (id, method, expected) => {
        const loc = city(id);
        const times = timesFor(loc, { method, madhab: 'shafi' }, NOV_15);
        for (const [key, hhmm] of Object.entries(expected)) {
            expect(Math.abs(at(times[key], loc.timeZone) - minutes(hhmm)), key).toBeLessThanOrEqual(1);
        }
    });

    test('Hanafi Asr is later than Shafi Asr', () => {
        const loc = city('accra');
        const shafi = timesFor(loc, { method: 'MuslimWorldLeague', madhab: 'shafi' }, NOV_15).asr;
        const hanafi = timesFor(loc, { method: 'MuslimWorldLeague', madhab: 'hanafi' }, NOV_15).asr;
        expect(hanafi.getTime()).toBeGreaterThan(shafi.getTime() + 30 * 60000);
    });
});

describe('nextPrayer', () => {
    const accra = city('accra');
    const settings = { method: 'MuslimWorldLeague', madhab: 'shafi' };

    test('mid-afternoon -> Asr, with Dhuhr as the current prayer', () => {
        const next = nextPrayer(accra, settings, new Date(Date.UTC(2026, 10, 15, 13, 0)));
        expect(next.key).toBe('asr');
        expect(next.previous).toBe('dhuhr');
    });

    test('skips sunrise: after Fajr the next prayer is Dhuhr', () => {
        expect(nextPrayer(accra, settings, new Date(Date.UTC(2026, 10, 15, 5, 0))).key).toBe('dhuhr');
    });

    test("after Isha it rolls over to tomorrow's Fajr", () => {
        const next = nextPrayer(accra, settings, new Date(Date.UTC(2026, 10, 15, 22, 0)));
        expect(next.key).toBe('fajr');
        expect(localYmd(next.time, accra.timeZone)).toEqual([2026, 11, 16]);
    });
});

test('a city in another time zone uses its own calendar date', () => {
    // 23:30 UTC on 15 Nov is already 16 Nov in Makkah (UTC+3).
    expect(localYmd(new Date(Date.UTC(2026, 10, 15, 23, 30)), 'Asia/Riyadh')).toEqual([2026, 11, 16]);
});

test('qibla bearings', () => {
    // Accra faces roughly east-north-east; London roughly south-east.
    expect(qiblaBearing(city('accra'))).toBeCloseTo(63.85, 1);
    expect(qiblaBearing(city('london'))).toBeCloseTo(118.99, 0);
});

test('countdown formatting', () => {
    expect(formatCountdown(84 * 60000)).toBe('1h 24m');
    expect(formatCountdown(12 * 60000 + 5000)).toBe('12m');
    expect(formatCountdown(45000)).toBe('45s');
    expect(formatCountdown(-5)).toBe('0s');
});

test('hijri date uses the Umm al-Qura calendar', () => {
    // Aladhan (Umm al-Qura) gives 5 Jumada al-Akhirah 1448 for 15 Nov 2026.
    expect(hijriDate(NOV_15, 'Africa/Accra')).toBe('5 Jumada II 1448 AH');
});

test('12-hour clock has no leading zero; 24-hour keeps it', () => {
    const fajr = timesFor(city('accra'), { method: 'MuslimWorldLeague', madhab: 'shafi' }, NOV_15).fajr;
    expect(formatTime(fajr, 'Africa/Accra', true)).toBe('4:37 AM');
    expect(formatTime(fajr, 'Africa/Accra', false)).toBe('04:37');
});
