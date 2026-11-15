import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { SOURCES } from '../lib/content';
import { METHODS } from '../lib/prayer';
import { useLocation, usePrayerSettings, usePreferences } from '../lib/settings';
import { Group, Row, Segmented, Sheet } from './ui';
import PrayerSettings from './PrayerSettings';

export default function AppSettings({ open, onClose }) {
    const [prefs, setPrefs] = usePreferences();
    const [location] = useLocation();
    const [settings] = usePrayerSettings();
    const [showPrayer, setShowPrayer] = useState(false);

    return (
        <>
            <Sheet open={open && !showPrayer} title="Settings" onClose={onClose}>
                <Group title="Prayer times">
                    <Row icon={MapPin} title={location.name} subtitle={`${METHODS[settings.method]} · Asr ${settings.madhab === 'hanafi' ? 'Hanafi' : 'standard'}`} onClick={() => setShowPrayer(true)} />
                </Group>

                <Group title="Appearance">
                    <div className="flex flex-col gap-2 p-2">
                        <Segmented
                            value={prefs.theme}
                            onChange={(theme) => setPrefs({ ...prefs, theme })}
                            options={[
                                { value: 'system', label: 'Automatic' },
                                { value: 'light', label: 'Light' },
                                { value: 'dark', label: 'Dark' },
                            ]}
                        />
                        <Segmented
                            value={prefs.clock}
                            onChange={(clock) => setPrefs({ ...prefs, clock })}
                            options={[
                                { value: '24h', label: '24-hour' },
                                { value: '12h', label: '12-hour' },
                            ]}
                        />
                    </div>
                </Group>

                <Group title="Sources" footer="Prayer times and the qibla are calculated on your device. Everything else is saved after the first load, so it keeps working offline.">
                    {Object.values(SOURCES).map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-separator px-4 py-2.5 text-[13px] last:border-b-0 active:bg-fill">
                            <span className="flex-1">{s.label}</span>
                            <ExternalLink size={14} className="shrink-0 text-tertiary" />
                        </a>
                    ))}
                </Group>
                <p className="text-center text-[12px] text-tertiary">Noor · open source under the MIT license</p>
            </Sheet>
            <PrayerSettings open={open && showPrayer} onClose={() => setShowPrayer(false)} />
        </>
    );
}
