import { useEffect } from 'react';
import { BookOpen, Compass, House, Sparkles } from 'lucide-react';
import { useHashRoute } from './lib/store';
import { usePreferences } from './lib/settings';
import Today from './views/Today';
// Every view is bundled eagerly (no lazy chunks): an offline tab that outlives an update
// must never need a file the new service worker has already removed.
import Quran from './views/Quran';
import Prayer from './views/Prayer';
import Dhikr from './views/Dhikr';

const TABS = [
    { id: 'today', label: 'Today', icon: House },
    { id: 'quran', label: 'Quran', icon: BookOpen },
    { id: 'prayer', label: 'Prayer', icon: Compass },
    { id: 'dhikr', label: 'Dhikr', icon: Sparkles },
];

function useTheme() {
    const [prefs] = usePreferences();
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && media.matches);
            document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        };
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [prefs.theme]);
}

function NavLink({ tab, active, compact }) {
    const Icon = tab.icon;
    return (
        <a
            href={`#/${tab.id}`}
            aria-current={active ? 'page' : undefined}
            className={
                compact
                    ? `flex flex-1 flex-col items-center gap-0.5 pt-1.5 text-[10px] font-medium ${active ? 'text-tint' : 'text-tertiary'}`
                    : `flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px] font-medium ${active ? 'bg-tint-soft text-tint' : 'text-secondary hover:bg-fill'}`
            }
        >
            <Icon size={compact ? 22 : 18} strokeWidth={active ? 2.2 : 1.8} />
            {tab.label}
        </a>
    );
}

export default function App() {
    useTheme();
    const [section, ...rest] = useHashRoute();
    const current = TABS.some((t) => t.id === section) ? section : 'today';

    return (
        <div className="min-h-dvh md:flex">
            {/* Desktop sidebar */}
            <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-separator px-3 py-5 md:flex">
                <div className="mb-5 flex items-center gap-2 px-3">
                    <img src="/favicon.svg" alt="" className="h-7 w-7" />
                    <span className="text-[17px] font-bold tracking-tight">Noor</span>
                </div>
                {TABS.map((t) => <NavLink key={t.id} tab={t} active={t.id === current} />)}
            </aside>

            <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-[max(env(safe-area-inset-top),12px)] md:pb-10 md:pt-6">
                {current === 'today' && <Today />}
                {current === 'quran' && <Quran surah={rest[0]} ayah={rest[1]} />}
                {current === 'prayer' && <Prayer view={rest[0]} />}
                {current === 'dhikr' && <Dhikr view={rest[0]} />}
            </main>

            {/* Phone tab bar */}
            <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-separator bg-canvas/85 backdrop-blur-xl md:hidden">
                {TABS.map((t) => <NavLink key={t.id} tab={t} active={t.id === current} compact />)}
            </nav>
        </div>
    );
}
