import { useState } from 'react';
import { BookOpen, Compass, MapPin, Moon, Settings, Sun, Sparkles } from 'lucide-react';
import { PRAYERS, formatCountdown, formatTime, hijriDate, nextPrayer, timesFor } from '../lib/prayer';
import { useLocation, usePrayerSettings, usePreferences } from '../lib/settings';
import { navigate, useNow, useStored } from '../lib/store';
import { Group, Row } from '../components/ui';
import PrayerSettings from '../components/PrayerSettings';
import AppSettings from '../components/AppSettings';

export default function Today() {
    const now = useNow(1000);
    const [location] = useLocation();
    const [settings] = usePrayerSettings();
    const [prefs] = usePreferences();
    const [lastRead] = useStored('last-read', null);
    const [showSettings, setShowSettings] = useState(false);
    const [showApp, setShowApp] = useState(false);

    const tz = location.timeZone;
    const times = timesFor(location, settings, now);
    const next = nextPrayer(location, settings, now);
    const prevTime = next.key === 'fajr' && now > times.isha ? times.isha : times[next.previous];
    const span = next.time - prevTime;
    const progress = span > 0 ? Math.min(1, Math.max(0, (now - prevTime) / span)) : 0;
    const label = (key) => PRAYERS.find((p) => p.key === key).label;
    const fmt = (d) => formatTime(d, tz, prefs.clock === '12h');

    // Hisn al-Muslim: morning adhkar after Fajr, evening adhkar after Asr.
    const isEvening = now >= times.asr || now < times.fajr;

    const gregorian = now.toLocaleDateString('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <>
            <header className="relative mb-4 pt-2">
                <button aria-label="Settings" onClick={() => setShowApp(true)} className="absolute right-0 top-2 grid h-9 w-9 place-items-center rounded-full bg-fill text-secondary">
                    <Settings size={17} />
                </button>
                <p className="text-[13px] font-medium text-secondary">{gregorian}</p>
                <h1 className="text-[26px] font-bold tracking-tight">{hijriDate(now, tz)}</h1>
                <button onClick={() => setShowSettings(true)} className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-tint">
                    <MapPin size={13} /> {location.name}
                </button>
            </header>

            <section className="mb-5 rounded-2xl bg-surface p-4" aria-live="polite">
                <div className="flex items-baseline justify-between">
                    <p className="text-[13px] text-secondary">Next prayer</p>
                    <p className="text-[13px] tabular-nums text-secondary">{fmt(next.time)}</p>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    <h2 className="text-[30px] font-bold tracking-tight">{label(next.key)}</h2>
                    <p className="text-[22px] font-semibold tabular-nums text-tint">in {formatCountdown(next.time - now)}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fill" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Time until ${label(next.key)}`}>
                    <div className="h-full rounded-full bg-tint transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
                </div>
            </section>

            <Group title="Today">
                {PRAYERS.map((p) => {
                    const isNext = p.key === next.key && !(next.key === 'fajr' && now > times.isha);
                    return (
                        <Row key={p.key} title={p.label} active={isNext} value={fmt(times[p.key])}>
                            <span lang="ar" className="arabic text-[15px] text-secondary">{p.arabic}</span>
                        </Row>
                    );
                })}
            </Group>

            <Group title="Continue">
                {lastRead ? (
                    <Row
                        icon={BookOpen}
                        title={`${lastRead.name} · ayah ${lastRead.ayah}`}
                        subtitle="Pick up where you left off"
                        onClick={() => navigate(`quran/${lastRead.surah}/${lastRead.ayah}`)}
                    />
                ) : (
                    <Row icon={BookOpen} title="Start reading the Quran" subtitle="Your place is saved as you read" onClick={() => navigate('quran')} />
                )}
                <Row
                    icon={isEvening ? Moon : Sun}
                    title={isEvening ? 'Evening adhkar' : 'Morning adhkar'}
                    subtitle="Hisn al-Muslim"
                    onClick={() => navigate('dhikr/adhkar')}
                />
                <Row icon={Sparkles} title="Tasbih" subtitle="After-prayer dhikr counter" onClick={() => navigate('dhikr')} />
                <Row icon={Compass} title="Qibla direction" onClick={() => navigate('prayer/qibla')} />
            </Group>

            <PrayerSettings open={showSettings} onClose={() => setShowSettings(false)} />
            <AppSettings open={showApp} onClose={() => setShowApp(false)} />
        </>
    );
}
