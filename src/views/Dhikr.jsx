import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pause, Play, RotateCcw, Search } from 'lucide-react';
import { getAdhkar, getNames, bareLetters, looseMatch, SOURCES } from '../lib/content';
import { navigate, useStored } from '../lib/store';
import { Button, ErrorState, PageHeader, Segmented, Spinner } from '../components/ui';

const PHRASES = [
    { id: 'subhanallah', arabic: 'سُبْحَانَ ٱللَّٰهِ', text: 'SubhanAllah', meaning: 'Glory be to Allah', target: 33 },
    { id: 'alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', text: 'Alhamdulillah', meaning: 'All praise is for Allah', target: 33 },
    { id: 'allahuakbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', text: 'Allahu Akbar', meaning: 'Allah is the Greatest', target: 34 },
    { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', text: 'Astaghfirullah', meaning: 'I seek forgiveness from Allah', target: 100 },
    { id: 'tahlil', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', text: 'La ilaha illallah', meaning: 'There is no god but Allah', target: 100 },
];
// After-prayer tasbih: 33 + 33 + 34, moving on automatically.
const AFTER_PRAYER = ['subhanallah', 'alhamdulillah', 'allahuakbar'];
const todayKey = () => new Date().toDateString();
const buzz = (pattern) => navigator.vibrate?.(pattern);

function Tasbih() {
    const [state, setState] = useStored('tasbih', { phrase: 'subhanallah', count: 0, day: todayKey(), total: 0 });
    const day = state.day === todayKey() ? state : { ...state, day: todayKey(), total: 0 };
    const phrase = PHRASES.find((p) => p.id === day.phrase) ?? PHRASES[0];
    const done = day.count >= phrase.target;
    const R = 112;
    const circumference = 2 * Math.PI * R;

    const tap = () => {
        const count = day.count + 1;
        const reached = count === phrase.target;
        buzz(reached ? [40, 60, 40] : 8);
        const idx = AFTER_PRAYER.indexOf(phrase.id);
        if (reached && idx >= 0 && idx < AFTER_PRAYER.length - 1) {
            // Move to the next phrase of the after-prayer set.
            setState({ ...day, phrase: AFTER_PRAYER[idx + 1], count: 0, total: day.total + 1 });
        } else {
            setState({ ...day, count, total: day.total + 1 });
        }
    };

    // Space / Enter count too, for desktop.
    const tapRef = useRef(tap);
    tapRef.current = tap;
    useEffect(() => {
        const onKey = (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && e.target === document.body) {
                e.preventDefault();
                tapRef.current();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return (
        <>
            <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {PHRASES.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setState({ ...day, phrase: p.id, count: 0 })}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ${p.id === phrase.id ? 'bg-tint text-white' : 'bg-surface text-label'}`}
                    >
                        {p.text}
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center">
                <p lang="ar" dir="rtl" className="arabic text-[32px] leading-tight">{phrase.arabic}</p>
                <p className="mt-1 text-[13px] text-secondary">{phrase.meaning}</p>

                <button
                    onClick={tap}
                    aria-label={`Count ${phrase.text}. ${day.count} of ${phrase.target}`}
                    className="relative my-6 grid h-64 w-64 place-items-center rounded-full bg-surface shadow-sm transition-transform active:scale-[0.97]"
                >
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256" aria-hidden>
                        <circle cx="128" cy="128" r={R} fill="none" stroke="var(--fill)" strokeWidth="8" />
                        <circle
                            cx="128"
                            cy="128"
                            r={R}
                            fill="none"
                            stroke="var(--tint)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - Math.min(1, day.count / phrase.target))}
                            className="transition-[stroke-dashoffset] duration-200"
                        />
                    </svg>
                    <span className="flex flex-col items-center">
                        <span className="text-[56px] font-bold tabular-nums leading-none tracking-tight">{day.count}</span>
                        <span className="mt-2 text-[13px] text-secondary">{done ? 'Complete' : `of ${phrase.target}`}</span>
                    </span>
                </button>

                <div className="flex items-center gap-3">
                    <Button variant="gray" onClick={() => setState({ ...day, count: 0 })}>
                        <RotateCcw size={15} /> Reset
                    </Button>
                    <Button variant="gray" onClick={() => setState({ ...day, phrase: AFTER_PRAYER[0], count: 0 })}>
                        After-prayer set
                    </Button>
                </div>
                <p className="mt-4 text-[12px] text-secondary">{day.total} today · tap the circle{' '}<span className="hidden md:inline">or press Space</span></p>
            </div>
        </>
    );
}

function AdhkarItem({ item, count, onCount, playing, onPlay }) {
    const complete = count >= item.repeat;
    return (
        <article className={`border-b border-separator px-4 py-4 last:border-b-0 ${complete ? 'opacity-60' : ''}`}>
            <p lang="ar" dir="rtl" className="arabic text-right text-[21px]">{item.arabic}</p>
            {item.note && <p className="mt-2 text-[13px] italic leading-relaxed text-secondary">{item.note}</p>}
            <p className="mt-2 text-[14px] leading-relaxed">{item.english}</p>
            <div className="mt-3 flex items-center gap-2">
                <button
                    onClick={onCount}
                    disabled={complete}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold tabular-nums ${complete ? 'bg-tint-soft text-tint' : 'bg-tint text-white active:opacity-70'}`}
                >
                    {complete ? <><Check size={15} /> Done</> : `${count} / ${item.repeat}`}
                </button>
                {item.audio && (
                    <button onClick={onPlay} aria-label={playing ? 'Stop audio' : 'Play audio'} className="grid h-9 w-9 place-items-center rounded-full bg-fill text-secondary">
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                )}
            </div>
        </article>
    );
}

function Adhkar() {
    const [state, setState] = useState({ data: null, error: null });
    const [progress, setProgress] = useStored('adhkar-progress', { day: todayKey(), counts: {} });
    const [playing, setPlaying] = useState(null);
    const audio = useRef(null);
    const counts = progress.day === todayKey() ? progress.counts : {};

    const load = () => {
        setState({ data: null, error: null });
        getAdhkar()
            .then((data) => setState({ data, error: null }))
            .catch(() => setState({ data: null, error: navigator.onLine ? 'Could not load the adhkar.' : "You're offline and the adhkar haven't been saved yet." }));
    };
    useEffect(load, []);
    useEffect(() => () => audio.current?.pause(), []);

    const count = (item) => {
        const next = Math.min(item.repeat, (counts[item.id] || 0) + 1);
        buzz(next === item.repeat ? [30, 50, 30] : 8);
        setProgress({ day: todayKey(), counts: { ...counts, [item.id]: next } });
    };
    const play = (item) => {
        if (playing === item.id) {
            audio.current?.pause();
            setPlaying(null);
            return;
        }
        if (!audio.current) audio.current = new Audio();
        audio.current.src = item.audio;
        audio.current.onended = () => setPlaying(null);
        audio.current.play().then(() => setPlaying(item.id)).catch(() => setPlaying(null));
    };

    if (state.error) return <ErrorState message={state.error} onRetry={load} />;
    if (!state.data) return <Spinner />;
    const finished = state.data.filter((d) => (counts[d.id] || 0) >= d.repeat).length;

    return (
        <>
            <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-[13px] text-secondary">
                    <span className="font-semibold text-label">{finished}</span> of {state.data.length} done today
                </p>
                {finished > 0 && (
                    <Button variant="plain" onClick={() => setProgress({ day: todayKey(), counts: {} })} className="h-7 px-1 text-[13px]">
                        Start over
                    </Button>
                )}
            </div>
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-fill">
                <div className="h-full bg-tint transition-[width]" style={{ width: `${(finished / state.data.length) * 100}%` }} />
            </div>
            <div className="overflow-hidden rounded-xl bg-surface">
                {state.data.map((item) => (
                    <AdhkarItem key={item.id} item={item} count={counts[item.id] || 0} onCount={() => count(item)} playing={playing === item.id} onPlay={() => play(item)} />
                ))}
            </div>
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-tertiary">
                {SOURCES.adhkar.label}, chapter 27. Some adhkar change wording in the evening; the text notes where.
            </p>
        </>
    );
}

function Names() {
    const [state, setState] = useState({ data: null, error: null });
    const [query, setQuery] = useState('');
    const load = () => {
        setState({ data: null, error: null });
        getNames()
            .then((data) => setState({ data, error: null }))
            .catch(() => setState({ data: null, error: navigator.onLine ? 'Could not load the names.' : "You're offline and the names haven't been saved yet." }));
    };
    useEffect(load, []);

    const shown = useMemo(() => {
        if (!state.data) return [];
        const q = query.trim().toLowerCase();
        if (!q) return state.data;
        return state.data.filter(
            (n) => looseMatch(n.transliteration, q) || n.meaning.toLowerCase().includes(q) || bareLetters(n.arabic).includes(bareLetters(q)) || String(n.number) === q
        );
    }, [state.data, query]);

    if (state.error) return <ErrorState message={state.error} onRetry={load} />;
    if (!state.data) return <Spinner />;
    return (
        <>
            <label className="mb-3 flex items-center gap-2 rounded-[10px] bg-fill px-3">
                <Search size={16} className="text-tertiary" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names or meanings" className="h-9 w-full bg-transparent text-[15px] outline-none placeholder:text-tertiary" />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {shown.map((n) => (
                    <div key={n.number} className="flex flex-col items-center rounded-xl bg-surface px-2 py-4 text-center">
                        <span className="text-[11px] tabular-nums text-tertiary">{n.number}</span>
                        <span lang="ar" className="arabic text-[26px] leading-snug text-tint">{n.arabic}</span>
                        <span className="text-[14px] font-semibold">{n.transliteration}</span>
                        <span className="text-[12px] leading-snug text-secondary">{n.meaning}</span>
                    </div>
                ))}
            </div>
            {shown.length === 0 && <p className="py-6 text-center text-[13px] text-secondary">No name matches "{query}".</p>}
            <p className="mt-4 px-1 text-[11px] text-tertiary">{SOURCES.names.label}.</p>
        </>
    );
}

export default function Dhikr({ view }) {
    const tab = ['adhkar', 'names'].includes(view) ? view : 'tasbih';
    return (
        <>
            <PageHeader title="Dhikr" />
            <Segmented
                className="mb-4"
                value={tab}
                onChange={(v) => navigate(v === 'tasbih' ? 'dhikr' : `dhikr/${v}`)}
                options={[
                    { value: 'tasbih', label: 'Tasbih' },
                    { value: 'adhkar', label: 'Adhkar' },
                    { value: 'names', label: '99 Names' },
                ]}
            />
            {tab === 'tasbih' && <Tasbih />}
            {tab === 'adhkar' && <Adhkar />}
            {tab === 'names' && <Names />}
        </>
    );
}

