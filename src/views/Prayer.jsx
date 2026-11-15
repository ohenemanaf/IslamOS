import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, SlidersHorizontal } from 'lucide-react';
import { METHODS, PRAYERS, formatTime, hijriDate, qiblaBearing, timesFor } from '../lib/prayer';
import { useLocation, usePrayerSettings, usePreferences } from '../lib/settings';
import { navigate, useNow } from '../lib/store';
import { angleDelta, useCompass } from '../lib/compass';
import { Button, Group, PageHeader, Row, Segmented } from '../components/ui';
import PrayerSettings from '../components/PrayerSettings';

function Times({ location, settings, prefs }) {
    const now = useNow(60000);
    const [offset, setOffset] = useState(0);
    const tz = location.timeZone;
    const times = timesFor(location, settings, now, offset);
    const day = times.dhuhr;

    return (
        <>
            <div className="mb-3 flex items-center justify-between rounded-xl bg-surface px-1.5 py-1.5">
                <button aria-label="Previous day" onClick={() => setOffset((o) => o - 1)} className="grid h-9 w-9 place-items-center rounded-lg text-tint active:bg-fill">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={() => setOffset(0)} className="text-center">
                    <span className="block text-[15px] font-semibold">
                        {offset === 0 ? 'Today' : day.toLocaleDateString('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="block text-[12px] text-secondary">{hijriDate(day, tz)}</span>
                </button>
                <button aria-label="Next day" onClick={() => setOffset((o) => o + 1)} className="grid h-9 w-9 place-items-center rounded-lg text-tint active:bg-fill">
                    <ChevronRight size={20} />
                </button>
            </div>
            <Group footer={`${METHODS[settings.method]} · Asr ${settings.madhab === 'hanafi' ? 'Hanafi' : 'standard'} · times in ${tz.replace('_', ' ')}`}>
                {PRAYERS.map((p) => (
                    <Row key={p.key} title={p.label} value={formatTime(times[p.key], tz, prefs.clock === '12h')}>
                        <span lang="ar" className="arabic text-[15px] text-secondary">{p.arabic}</span>
                    </Row>
                ))}
            </Group>
        </>
    );
}

function Qibla({ location }) {
    const bearing = qiblaBearing(location);
    const { heading, status, requestPermission } = useCompass();
    const live = status === 'active' && heading !== null;
    // The dial turns so north stays north; the Kaaba marker sits at the qibla bearing on it.
    const dialRotation = live ? -heading : 0;
    const off = live ? angleDelta(heading, bearing) : null;
    const aligned = live && Math.abs(off) <= 5;

    return (
        <div className="flex flex-col items-center">
            <div className="relative my-4 h-72 w-72">
                {/* Fixed pointer: the top of the phone */}
                <div className={`absolute left-1/2 top-0 z-10 h-6 w-1 -translate-x-1/2 rounded-full ${aligned ? 'bg-tint' : 'bg-label'}`} />
                <div
                    className="absolute inset-3 rounded-full border border-separator bg-surface transition-transform duration-300 ease-out"
                    style={{ transform: `rotate(${dialRotation}deg)` }}
                >
                    {['N', 'E', 'S', 'W'].map((d, i) => (
                        <span
                            key={d}
                            className={`absolute left-1/2 top-1/2 text-[12px] font-semibold ${d === 'N' ? 'text-destructive' : 'text-secondary'}`}
                            style={{ transform: `rotate(${i * 90}deg) translateY(-118px) rotate(${-i * 90}deg) translate(-50%, -50%)` }}
                        >
                            {d}
                        </span>
                    ))}
                    {Array.from({ length: 72 }, (_, i) => (
                        <span
                            key={i}
                            className={`absolute left-1/2 top-1/2 w-px origin-top bg-separator ${i % 6 === 0 ? 'h-3' : 'h-1.5'}`}
                            style={{ transform: `rotate(${i * 5}deg) translateY(-132px)` }}
                        />
                    ))}
                    {/* Qibla needle */}
                    <div className="absolute inset-0" style={{ transform: `rotate(${bearing}deg)` }}>
                        <div className="absolute bottom-1/2 left-1/2 h-[42%] w-1 -translate-x-1/2 rounded-full bg-tint" />
                        <div className="absolute left-1/2 top-[6%] grid h-8 w-8 -translate-x-1/2 place-items-center rounded-lg bg-label text-[15px] text-surface" aria-hidden>
                            🕋
                        </div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tint" />
                </div>
            </div>

            <p className="text-[34px] font-bold tabular-nums tracking-tight">{bearing.toFixed(0)}°</p>
            <p className="text-[13px] text-secondary">from true north, at {location.name}</p>

            <div className="mt-4 w-full rounded-xl bg-surface px-4 py-3 text-center text-[14px]" aria-live="polite">
                {live && (aligned ? <span className="font-semibold text-tint">You are facing the qibla.</span> : <>Turn {off > 0 ? 'right' : 'left'} {Math.abs(off).toFixed(0)}°.</>)}
                {status === 'needs-permission' && (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-secondary">Allow motion access to use the live compass.</span>
                        <Button onClick={requestPermission}>Start compass</Button>
                    </div>
                )}
                {status === 'denied' && <span className="text-secondary">Motion access was denied. Face {bearing.toFixed(0)}° using another compass.</span>}
                {(status === 'unsupported' || status === 'idle') && (
                    <span className="text-secondary">
                        No compass on this device. On a phone, the dial turns as you move. Here, face {bearing.toFixed(0)}° clockwise from north.
                    </span>
                )}
            </div>
            {live && <p className="mt-2 text-center text-[12px] text-secondary">Hold the phone flat, away from metal and magnets. Move it in a figure-8 if it seems off.</p>}
        </div>
    );
}

export default function Prayer({ view }) {
    const [location] = useLocation();
    const [settings] = usePrayerSettings();
    const [prefs] = usePreferences();
    const [showSettings, setShowSettings] = useState(false);
    const tab = view === 'qibla' ? 'qibla' : 'times';

    return (
        <>
            <PageHeader
                title="Prayer"
                subtitle={
                    <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-1 font-medium text-tint">
                        <MapPin size={13} /> {location.name}
                    </button>
                }
                action={
                    <Button variant="gray" aria-label="Location and method" onClick={() => setShowSettings(true)} icon>
                        <SlidersHorizontal size={16} />
                    </Button>
                }
            />
            <Segmented
                className="mb-4"
                value={tab}
                onChange={(v) => navigate(v === 'qibla' ? 'prayer/qibla' : 'prayer')}
                options={[
                    { value: 'times', label: 'Times' },
                    { value: 'qibla', label: 'Qibla' },
                ]}
            />
            {tab === 'times' ? <Times location={location} settings={settings} prefs={prefs} /> : <Qibla location={location} />}
            <PrayerSettings open={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
}
