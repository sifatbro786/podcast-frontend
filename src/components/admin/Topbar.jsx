// src/components/admin/Topbar.jsx
// Sticky console header. Left: hamburger (mobile) + current-section title.
// Right: live UTC clock (REC ● motif), theme toggle, "view site". The clock is
// isolated so its per-second tick doesn't re-render the layout.
import { Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";

function UtcClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mm = String(now.getUTCMinutes()).padStart(2, "0");
    const ss = String(now.getUTCSeconds()).padStart(2, "0");
    return (
        <div className="hidden items-center gap-2 border border-border-subtle px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse bg-brand-orange" />
            <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-content tabular-nums">
                {hh}:{mm}:{ss}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-content-muted">
                UTC
            </span>
        </div>
    );
}

export default function Topbar({ title, onMenu }) {
    const { isDark, toggle } = useTheme();

    return (
        <header className="z-30 flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenu}
                    aria-label="Open menu"
                    className="grid h-9 w-9 shrink-0 place-items-center border border-border-subtle text-content lg:hidden"
                >
                    <Menu size={17} />
                </button>
                <div className="min-w-0">
                    <h1 className="truncate text-lg font-medium tracking-tight text-content">
                        {title}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <UtcClock />
                <button
                    type="button"
                    onClick={toggle}
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className="grid h-9 w-9 place-items-center border border-border-subtle text-content-muted transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
        </header>
    );
}
