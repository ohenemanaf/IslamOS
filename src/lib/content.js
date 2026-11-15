// Quran, adhkar and the 99 Names come from public APIs (credited in the app) and are kept in
// Cache Storage after the first load, so anything opened once also works offline.

const CACHE = 'noor-content-v1';
const QURAN_API = 'https://api.alquran.cloud/v1';

export const SOURCES = {
    quran: { label: 'Quran text & translation: AlQuran Cloud (Tanzil Uthmani text, Saheeh International)', url: 'https://alquran.cloud' },
    audio: { label: 'Recitation: Mishary Rashid Alafasy via Islamic Network CDN', url: 'https://islamic.network' },
    adhkar: { label: "Morning & evening adhkar: Hisn al-Muslim (Fortress of the Muslim)", url: 'https://www.hisnmuslim.com' },
    names: { label: 'The 99 Names: Aladhan', url: 'https://aladhan.com' },
};

const URLS = {
    surahList: `${QURAN_API}/surah`,
    surah: (n) => `${QURAN_API}/surah/${n}/editions/quran-uthmani,en.sahih`,
    names: 'https://api.aladhan.com/v1/asmaAlHusna',
    adhkar: 'https://www.hisnmuslim.com/api/en/27.json',
};

export const audioUrl = (globalAyahNumber) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;

const hasCaches = () => typeof caches !== 'undefined';

async function cachedJson(url, { refresh = false } = {}) {
    const cache = hasCaches() ? await caches.open(CACHE) : null;
    if (cache && !refresh) {
        const hit = await cache.match(url);
        if (hit) return hit.json();
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    if (cache) await cache.put(url, res.clone());
    return res.json();
}

export async function isCached(url) {
    if (!hasCaches()) return false;
    return Boolean(await (await caches.open(CACHE)).match(url));
}

// ---------- Quran ----------

// Compare Arabic by letters only: the same visible text can store its marks in different
// orders (e.g. shadda+fatha vs fatha+shadda), so exact string matching is unreliable.
const MARKS = /[ً-ٰٟۖ-ۭ]/g;
export const bareLetters = (s) => s.replace(MARKS, '').replace(/ٱ/g, 'ا');
/**
 * Loose Latin matching for transliterations: "rahman" finds "Ar Rahmaan", "al kahf" finds
 * "Al-Kahf". Lowercases, drops spaces/punctuation and collapses doubled letters.
 */
export const looseLatin = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(.)\1+/g, '$1');
export const looseMatch = (haystack, query) => looseLatin(haystack).includes(looseLatin(query));

const BISMILLAH_WORDS = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

/**
 * In this text edition, ayah 1 of every surah except Al-Fatiha (1) and At-Tawbah (9) begins
 * with the Bismillah. It isn't part of the ayah, so it's removed and shown once as a heading.
 */
export function splitBismillah(surahNumber, ayahNumber, text) {
    const clean = text.replace(/^﻿/, '');
    if (surahNumber === 1 || surahNumber === 9 || ayahNumber !== 1) return clean;
    const words = clean.split(/\s+/);
    const isBismillah = BISMILLAH_WORDS.every((w, i) => bareLetters(words[i] || '') === w);
    return isBismillah ? words.slice(4).join(' ') : clean;
}

export const showsBismillahHeading = (surahNumber) => surahNumber !== 1 && surahNumber !== 9;

export async function getSurahList() {
    const json = await cachedJson(URLS.surahList);
    return json.data.map((s) => ({
        number: s.number,
        arabic: s.name,
        name: s.englishName,
        meaning: s.englishNameTranslation,
        ayahs: s.numberOfAyahs,
        type: s.revelationType,
    }));
}

export function parseSurah(json, number) {
    const [arabic, english] = json.data;
    return arabic.ayahs.map((a, i) => ({
        number: a.number, // global number, used for audio
        inSurah: a.numberInSurah,
        juz: a.juz,
        page: a.page,
        sajda: Boolean(a.sajda),
        arabic: splitBismillah(number, a.numberInSurah, a.text),
        english: english.ayahs[i]?.text ?? '',
    }));
}

export async function getSurah(number) {
    return parseSurah(await cachedJson(URLS.surah(number)), number);
}

export const isSurahCached = (number) => isCached(URLS.surah(number));

/** Downloads every surah not yet cached. onProgress(done, total). Stops early if aborted. */
export async function downloadQuran(onProgress, signal) {
    const total = 114;
    let done = 0;
    for (let n = 1; n <= total; n++) {
        if (signal?.aborted) return done;
        if (!(await isSurahCached(n))) await cachedJson(URLS.surah(n));
        onProgress?.(++done, total);
    }
    return done;
}

export async function cachedSurahCount() {
    let count = 0;
    for (let n = 1; n <= 114; n++) if (await isSurahCached(n)) count++;
    return count;
}

// ---------- Dhikr ----------

export async function getNames() {
    const json = await cachedJson(URLS.names);
    return json.data.map((n) => ({
        number: n.number,
        arabic: n.name,
        transliteration: n.transliteration,
        meaning: n.en?.meaning ?? '',
    }));
}

// Hisn al-Muslim chapter 27: "Words of remembrance for morning and evening".
export function parseAdhkar(json) {
    const list = Object.values(json)[0];
    return list.map((d) => ({
        id: d.ID,
        arabic: d.ARABIC_TEXT.trim(),
        // Despite its name, this field holds the source's note (e.g. which ayah to recite).
        note: (d.LANGUAGE_ARABIC_TRANSLATED_TEXT || '').trim(),
        english: (d.TRANSLATED_TEXT || '').trim(),
        repeat: Math.max(1, Number(d.REPEAT) || 1),
        audio: d.AUDIO ? d.AUDIO.replace(/^http:/, 'https:') : null,
    }));
}

export async function getAdhkar() {
    return parseAdhkar(await cachedJson(URLS.adhkar));
}
