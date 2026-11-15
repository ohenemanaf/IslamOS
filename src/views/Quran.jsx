import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, CloudDownload, Pause, Play, Search, Type } from 'lucide-react';
import { audioUrl, bareLetters, looseMatch, cachedSurahCount, downloadQuran, getSurah, getSurahList, showsBismillahHeading, SOURCES } from '../lib/content';
import { navigate, useStored } from '../lib/store';
import { usePreferences } from '../lib/settings';
import { Button, ErrorState, Group, PageHeader, Row, Segmented, Sheet, Spinner } from '../components/ui';

function useAsync(fn, deps) {
    const [state, setState] = useState({ data: null, error: null, loading: true });
    const run = useCallback(() => {
        let alive = true;
        setState((s) => ({ ...s, loading: true, error: null }));
        fn()
            .then((data) => alive && setState({ data, error: null, loading: false }))
            .catch(() => alive && setState({ data: null, error: navigator.onLine ? 'Could not load this. Please try again.' : "You're offline and this hasn't been saved yet.", loading: false }));
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    useEffect(run, [run]);
    return { ...state, retry: run };
}

const BISMILLAH_HEADING = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// ---------------- Surah list ----------------

function OfflineCard() {
    const [count, setCount] = useState(null);
    const [progress, setProgress] = useState(null);
    const abort = useRef(null);

    useEffect(() => {
        cachedSurahCount().then(setCount).catch(() => setCount(0));
        return () => abort.current?.abort();
    }, []);

    const start = async () => {
        abort.current = new AbortController();
        setProgress(0);
        try {
            await downloadQuran((done) => setProgress(done), abort.current.signal);
        } catch {
            /* network dropped; whatever finished is kept */
        }
        setProgress(null);
        setCount(await cachedSurahCount());
    };

    if (count === null) return null;
    if (count === 114 && progress === null) {
        return <p className="mb-4 px-1 text-[12px] text-secondary">The whole Quran is saved on this device and works offline.</p>;
    }
    return (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
            <CloudDownload size={20} className="shrink-0 text-tint" />
            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{progress === null ? 'Read without internet' : `Saving… ${progress} of 114`}</p>
                {progress === null ? (
                    <p className="text-[12px] text-secondary">{count} of 114 surahs saved. The full Quran uses about 1.5 MB of data and 4 MB of storage.</p>
                ) : (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fill">
                        <div className="h-full bg-tint transition-[width]" style={{ width: `${(progress / 114) * 100}%` }} />
                    </div>
                )}
            </div>
            {progress === null ? (
                <Button onClick={start}>Download</Button>
            ) : (
                <Button variant="plain" onClick={() => abort.current?.abort()}>Stop</Button>
            )}
        </div>
    );
}

function SurahList() {
    const { data: surahs, error, loading, retry } = useAsync(getSurahList, []);
    const [bookmarks] = useStored('bookmarks', []);
    const [lastRead] = useStored('last-read', null);
    const [tab, setTab] = useState('surahs');
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!surahs) return [];
        const q = query.trim().toLowerCase();
        if (!q) return surahs;
        if (/^\d+$/.test(q)) return surahs.filter((s) => String(s.number).startsWith(q));
        const bare = bareLetters(q);
        return surahs.filter(
            (s) => looseMatch(s.name, q) || s.meaning.toLowerCase().includes(q) || bareLetters(s.arabic).includes(bare)
        );
    }, [surahs, query]);

    return (
        <>
            <PageHeader title="Quran" />
            <OfflineCard />
            {lastRead && (
                <Group>
                    <Row title={`Continue ${lastRead.name}`} subtitle={`Ayah ${lastRead.ayah}`} onClick={() => navigate(`quran/${lastRead.surah}/${lastRead.ayah}`)} />
                </Group>
            )}
            <Segmented
                className="mb-3"
                value={tab}
                onChange={setTab}
                options={[
                    { value: 'surahs', label: 'Surahs' },
                    { value: 'bookmarks', label: `Bookmarks${bookmarks.length ? ` (${bookmarks.length})` : ''}` },
                ]}
            />

            {tab === 'surahs' && (
                <>
                    <label className="mb-3 flex items-center gap-2 rounded-[10px] bg-fill px-3">
                        <Search size={16} className="text-tertiary" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or number"
                            className="h-9 w-full bg-transparent text-[15px] outline-none placeholder:text-tertiary"
                        />
                    </label>
                    {loading && <Spinner />}
                    {error && <ErrorState message={error} onRetry={retry} />}
                    {surahs && (
                        <Group>
                            {filtered.map((s) => (
                                <Row
                                    key={s.number}
                                    title={`${s.number}. ${s.name}`}
                                    subtitle={`${s.meaning} · ${s.ayahs} ayahs · ${s.type}`}
                                    onClick={() => navigate(`quran/${s.number}`)}
                                    chevron={false}
                                >
                                    <span lang="ar" className="quran shrink-0 text-[20px] leading-none">{s.arabic.replace(/^سُورَةُ\s*/, '')}</span>
                                </Row>
                            ))}
                            {filtered.length === 0 && <p className="px-4 py-4 text-[13px] text-secondary">No surah matches "{query}".</p>}
                        </Group>
                    )}
                </>
            )}

            {tab === 'bookmarks' &&
                (bookmarks.length ? (
                    <Group>
                        {bookmarks.map((b) => (
                            <Row key={`${b.surah}:${b.ayah}`} title={`${b.name} ${b.surah}:${b.ayah}`} subtitle={b.preview} onClick={() => navigate(`quran/${b.surah}/${b.ayah}`)} />
                        ))}
                    </Group>
                ) : (
                    <p className="rounded-xl bg-surface px-4 py-8 text-center text-[13px] text-secondary">Tap the bookmark icon on any ayah to save it here.</p>
                ))}

            <p className="mt-6 px-1 text-[11px] leading-relaxed text-tertiary">
                {SOURCES.quran.label}. {SOURCES.audio.label}.
            </p>
        </>
    );
}

// ---------------- Reader ----------------

function ReaderSettings({ open, onClose }) {
    const [prefs, setPrefs] = usePreferences();
    return (
        <Sheet open={open} title="Reading" onClose={onClose}>
            <Group title="Arabic size">
                <div className="flex items-center gap-3 px-4 py-3">
                    <span className="quran text-[16px]">ا</span>
                    <input
                        type="range"
                        min={20}
                        max={40}
                        step={2}
                        value={prefs.arabicSize}
                        onChange={(e) => setPrefs({ ...prefs, arabicSize: Number(e.target.value) })}
                        className="flex-1 accent-[var(--tint)]"
                        aria-label="Arabic text size"
                    />
                    <span className="quran text-[28px]">ا</span>
                </div>
            </Group>
            <Group>
                <Row title="Show English translation" onClick={() => setPrefs({ ...prefs, translation: !prefs.translation })} chevron={false}>
                    <span className={`relative h-6 w-10 rounded-full transition-colors ${prefs.translation ? 'bg-tint' : 'bg-fill'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs.translation ? 'left-[18px]' : 'left-0.5'}`} />
                    </span>
                </Row>
            </Group>
        </Sheet>
    );
}

function Reader({ number, startAyah }) {
    const n = Number(number);
    const { data: list } = useAsync(getSurahList, []);
    const { data: ayahs, error, loading, retry } = useAsync(() => getSurah(n), [n]);
    const [prefs] = usePreferences();
    const [bookmarks, setBookmarks] = useStored('bookmarks', []);
    const [, setLastRead] = useStored('last-read', null);
    const [playing, setPlaying] = useState(null); // index of ayah being recited
    const [showSettings, setShowSettings] = useState(false);
    const audio = useRef(null);
    const meta = list?.find((s) => s.number === n);

    // Scroll to the requested ayah once loaded.
    useEffect(() => {
        if (!ayahs || !startAyah) return;
        document.getElementById(`ayah-${startAyah}`)?.scrollIntoView({ block: 'start' });
    }, [ayahs, startAyah]);

    // Remember the ayah at the top of the screen as the reading position.
    useEffect(() => {
        if (!ayahs || !meta) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (visible) setLastRead({ surah: n, ayah: Number(visible.target.dataset.ayah), name: meta.name });
            },
            { rootMargin: '0px 0px -70% 0px' }
        );
        document.querySelectorAll('[data-ayah]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [ayahs, meta, n, setLastRead]);

    // Stop audio when leaving the surah.
    useEffect(() => () => audio.current?.pause(), [n]);

    const play = (index) => {
        if (!ayahs || index >= ayahs.length) {
            setPlaying(null);
            return;
        }
        if (!audio.current) audio.current = new Audio();
        const el = audio.current;
        el.src = audioUrl(ayahs[index].number);
        el.onended = () => play(index + 1);
        el.onerror = () => setPlaying(null);
        el.play().catch(() => setPlaying(null));
        setPlaying(index);
        document.getElementById(`ayah-${ayahs[index].inSurah}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    const stop = () => {
        audio.current?.pause();
        setPlaying(null);
    };

    const isBookmarked = (a) => bookmarks.some((b) => b.surah === n && b.ayah === a);
    const toggleBookmark = (ayah) => {
        setBookmarks((list) =>
            isBookmarked(ayah.inSurah)
                ? list.filter((b) => !(b.surah === n && b.ayah === ayah.inSurah))
                : [{ surah: n, ayah: ayah.inSurah, name: meta?.name ?? `Surah ${n}`, preview: ayah.english.slice(0, 80) }, ...list]
        );
    };

    return (
        <>
            <div className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 bg-canvas/90 px-2 py-2 backdrop-blur-xl">
                <Button variant="plain" onClick={() => navigate('quran')} className="px-2">
                    <ChevronLeft size={18} /> Surahs
                </Button>
                <div className="min-w-0 flex-1 text-center">
                    <p className="truncate text-[15px] font-semibold">{meta ? `${n}. ${meta.name}` : `Surah ${n}`}</p>
                    {meta && <p className="truncate text-[11px] text-secondary">{meta.meaning} · {meta.ayahs} ayahs</p>}
                </div>
                <Button variant="gray" aria-label="Reading settings" onClick={() => setShowSettings(true)} icon>
                    <Type size={16} />
                </Button>
                <Button variant="tinted" aria-label={playing !== null ? 'Stop recitation' : 'Play recitation'} onClick={() => (playing !== null ? stop() : play(0))} icon>
                    {playing !== null ? <Pause size={16} /> : <Play size={16} />}
                </Button>
            </div>

            {loading && <Spinner />}
            {error && <ErrorState message={error} onRetry={retry} />}

            {ayahs && (
                <>
                    {showsBismillahHeading(n) && (
                        <p lang="ar" dir="rtl" className="quran mb-4 text-center text-[26px] text-label">
                            {BISMILLAH_HEADING}
                        </p>
                    )}
                    <div className="overflow-hidden rounded-xl bg-surface">
                        {ayahs.map((a, i) => (
                            <article
                                key={a.number}
                                id={`ayah-${a.inSurah}`}
                                data-ayah={a.inSurah}
                                className={`scroll-mt-16 border-b border-separator px-4 py-4 last:border-b-0 ${playing === i ? 'bg-tint-soft' : ''}`}
                            >
                                <div className="mb-2 flex items-center gap-1">
                                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-fill px-1.5 text-[12px] font-semibold tabular-nums text-secondary">
                                        {a.inSurah}
                                    </span>
                                    {a.sajda && <span className="ml-1 rounded-full bg-tint-soft px-2 py-0.5 text-[11px] font-medium text-tint">Sajdah</span>}
                                    <span className="flex-1" />
                                    <button
                                        aria-label={playing === i ? `Stop ayah ${a.inSurah}` : `Play ayah ${a.inSurah}`}
                                        onClick={() => (playing === i ? stop() : play(i))}
                                        className="grid h-8 w-8 place-items-center rounded-full text-secondary active:bg-fill"
                                    >
                                        {playing === i ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button
                                        aria-label={isBookmarked(a.inSurah) ? `Remove bookmark ${a.inSurah}` : `Bookmark ayah ${a.inSurah}`}
                                        onClick={() => toggleBookmark(a)}
                                        className={`grid h-8 w-8 place-items-center rounded-full active:bg-fill ${isBookmarked(a.inSurah) ? 'text-tint' : 'text-secondary'}`}
                                    >
                                        {isBookmarked(a.inSurah) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                    </button>
                                </div>
                                <p lang="ar" dir="rtl" className="quran text-right" style={{ fontSize: `${prefs.arabicSize}px` }}>
                                    {a.arabic} <span className="text-[0.7em] text-gold">﴿{a.inSurah.toLocaleString('ar-EG')}﴾</span>
                                </p>
                                {prefs.translation && <p className="mt-2 text-[14px] leading-relaxed text-secondary">{a.english}</p>}
                            </article>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-between">
                        {n > 1 ? (
                            <Button variant="gray" onClick={() => navigate(`quran/${n - 1}`)}>
                                <ChevronLeft size={16} /> Previous
                            </Button>
                        ) : <span />}
                        {n < 114 && (
                            <Button variant="gray" onClick={() => navigate(`quran/${n + 1}`)}>
                                Next <ChevronRight size={16} />
                            </Button>
                        )}
                    </div>
                </>
            )}
            <ReaderSettings open={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
}

export default function Quran({ surah, ayah }) {
    const n = Number(surah);
    if (Number.isInteger(n) && n >= 1 && n <= 114) return <Reader key={n} number={n} startAyah={Number(ayah) || null} />;
    return <SurahList />;
}
