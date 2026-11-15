import { useState } from 'react';
import { Check, LocateFixed, Search } from 'lucide-react';
import { CITIES } from '../lib/cities';
import { METHODS } from '../lib/prayer';
import { useGps, useLocation, usePrayerSettings } from '../lib/settings';
import { Group, Row, Segmented, Sheet } from './ui';

export default function PrayerSettings({ open, onClose }) {
    const [location, setLocation] = useLocation();
    const [settings, setSettings] = usePrayerSettings();
    const gps = useGps();
    const [query, setQuery] = useState('');

    const q = query.trim().toLowerCase();
    const cities = q ? CITIES.filter((c) => `${c.name} ${c.country}`.toLowerCase().includes(q)) : CITIES;

    return (
        <Sheet open={open} title="Location & method" onClose={onClose}>
            <Group title="Location" footer={gps.error || 'Your location stays on this device. It is only used to calculate prayer times and the qibla.'}>
                <Row
                    icon={LocateFixed}
                    title={gps.busy ? 'Finding you…' : 'Use my current location'}
                    subtitle={location.source === 'gps' ? location.country : undefined}
                    onClick={gps.request}
                    chevron={false}
                    active={location.source === 'gps'}
                >
                    {location.source === 'gps' && <Check size={16} className="text-tint" />}
                </Row>
            </Group>

            <Group title="Or pick a city">
                <label className="flex items-center gap-2 border-b border-separator px-4">
                    <Search size={16} className="text-tertiary" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search cities"
                        className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-tertiary"
                    />
                </label>
                <div className="max-h-56 overflow-y-auto">
                    {cities.map((c) => (
                        <Row
                            key={c.id}
                            title={c.name}
                            subtitle={c.country}
                            onClick={() => setLocation({ ...c, source: 'city' })}
                            chevron={false}
                            active={location.id === c.id}
                        >
                            {location.id === c.id && <Check size={16} className="text-tint" />}
                        </Row>
                    ))}
                    {cities.length === 0 && <p className="px-4 py-3 text-[13px] text-secondary">No match. Use your current location instead.</p>}
                </div>
            </Group>

            <Group title="Asr calculation" footer="Hanafi places Asr later (shadow twice an object's length).">
                <div className="p-2">
                    <Segmented
                        value={settings.madhab}
                        onChange={(madhab) => setSettings({ ...settings, madhab })}
                        options={[
                            { value: 'shafi', label: "Shafi'i, Maliki, Hanbali" },
                            { value: 'hanafi', label: 'Hanafi' },
                        ]}
                    />
                </div>
            </Group>

            <Group title="Calculation method" footer="Use the method your local mosque follows. Muslim World League is common in West Africa and Europe.">
                {Object.entries(METHODS).map(([key, label]) => (
                    <Row key={key} title={label} onClick={() => setSettings({ ...settings, method: key })} chevron={false} active={settings.method === key}>
                        {settings.method === key && <Check size={16} className="text-tint" />}
                    </Row>
                ))}
            </Group>
        </Sheet>
    );
}
