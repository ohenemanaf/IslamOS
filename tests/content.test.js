import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { audioUrl, bareLetters, parseAdhkar, parseSurah, showsBismillahHeading, splitBismillah } from '../src/lib/content.js';

// Real API responses saved as fixtures (trimmed): AlQuran Cloud surah 112, Hisn al-Muslim chapter 27.
const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

test('the Bismillah prefix is removed from ayah 1, except in Al-Fatiha', () => {
    expect(splitBismillah(2, 1, `${BISMILLAH} الٓمٓ`)).toBe('الٓمٓ');
    expect(splitBismillah(1, 1, `﻿${BISMILLAH}`)).toBe(BISMILLAH);
    expect(splitBismillah(2, 2, 'ذَٰلِكَ ٱلْكِتَٰبُ')).toBe('ذَٰلِكَ ٱلْكِتَٰبُ');
    expect(showsBismillahHeading(1)).toBe(false);
    expect(showsBismillahHeading(9)).toBe(false);
    expect(showsBismillahHeading(112)).toBe(true);
});

test('parses a real surah response into Arabic + English ayahs', () => {
    const ayahs = parseSurah(fixture('surah-112.json'), 112);
    expect(ayahs).toHaveLength(4);
    expect(ayahs[0].inSurah).toBe(1);
    expect(ayahs[0].arabic.startsWith('بِسْمِ')).toBe(false);
    expect(bareLetters(ayahs[0].arabic).startsWith('قل')).toBe(true);
    expect(ayahs[0].english).toMatch(/Allah/);
    expect(ayahs[3].number).toBe(6225); // global ayah number, used for audio
});

test('parses Hisn al-Muslim adhkar with repeat counts and https audio', () => {
    const adhkar = parseAdhkar(fixture('adhkar-27.json'));
    expect(adhkar).toHaveLength(3);
    // Compared on bare letters (see bareLetters) so the test doesn't depend on mark order.
    expect(bareLetters(adhkar[0].arabic)).toContain(bareLetters('الحي القيوم'));
    expect(adhkar[1].repeat).toBe(3);
    for (const d of adhkar) expect(d.audio).toMatch(/^https:\/\//);
});

test('audio URLs use the global ayah number', () => {
    expect(audioUrl(6225)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/6225.mp3');
});

test('loose transliteration search', async () => {
    const { looseMatch } = await import('../src/lib/content.js');
    expect(looseMatch('Ar Rahmaan', 'rahman')).toBe(true);
    expect(looseMatch('Al-Kahf', 'al kahf')).toBe(true);
    expect(looseMatch('Al-Kahf', 'kahf')).toBe(true);
    expect(looseMatch('Al-Kahf', 'maryam')).toBe(false);
});
