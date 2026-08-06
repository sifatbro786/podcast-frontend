// src/components/admin/Sidebar.jsx
// Fixed nav rail. EQ wordmark echoes the site's motif; links use declarative
// active states (NavLink → data attrs → Tailwind variants, no JS style
// mutation). The Admins link is gated to super_admin. On mobile this is
// rendered inside an off-canvas drawer by DashboardLayout.
import { Gauge, Globe, LogOut, Mic, Settings, ShieldCheck, Users, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
    { to: "/admin", end: true, label: "Overview", icon: Gauge },
    { to: "/admin/leads", label: "Leads", icon: Users },
    { to: "/admin/guests", label: "Bookings", icon: Mic },
    { to: "/admin/page-meta", label: "Page SEO", icon: Globe },
    { to: "/admin/users", label: "Admins", icon: ShieldCheck, superOnly: true },
    { to: "/admin/settings", label: "Settings", icon: Settings },
];

function EqWordmark() {
    return (
        <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="logo" className="w-14 h-14 object-cover" />
            <div className="leading-none">
                <p className="text-sm font-medium tracking-tight text-content">Podcast</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-content-muted">
                    Chart Growth
                </p>
            </div>
        </Link>
    );
}

export default function Sidebar({ onNavigate, onClose }) {
    const { user, logout } = useAuth();
    const isSuper = user?.role === "super_admin";
    const links = NAV.filter((n) => !n.superOnly || isSuper);

    return (
        <div className="flex h-full flex-col border-r border-border-subtle bg-surface-raised">
            {/* Brand + mobile close */}
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-0.5">
                <EqWordmark />
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="grid h-8 w-8 place-items-center border border-border-subtle text-content-muted lg:hidden"
                    >
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3">
                <p className="px-3 pb-2 pt-2 text-[9px] font-black uppercase tracking-[0.3em] text-content-muted/70">
                    Navigation
                </p>
                <ul className="space-y-0.5">
                    {links.map(({ to, end, label, icon: Icon }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                end={end}
                                onClick={onNavigate}
                                className="group flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-content-muted transition-colors hover:bg-surface hover:text-content aria-[current=page]:border-brand-orange aria-[current=page]:bg-surface aria-[current=page]:text-content"
                            >
                                <Icon
                                    size={17}
                                    className="shrink-0 text-content-muted transition-colors group-hover:text-brand-orange group-aria-[current=page]:text-brand-orange"
                                />
                                {label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User + logout */}
            <div className="border-t border-border-subtle p-3">
                <div className="flex items-center gap-3 px-2 py-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-border-subtle bg-surface text-sm font-medium text-brand-orange">
                        {(user?.name || "A").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-content">{user?.name}</p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-content-muted">
                            {user?.role === "super_admin" ? "Super Admin" : "Admin"}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="mt-2 flex w-full mx-auto justify-center items-center gap-2.5 border border-border-subtle px-3 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-content-muted transition-colors hover:border-rose-400/50 hover:text-rose-400"
                >
                    <LogOut size={15} />
                    Sign out
                </button>
            </div>
        </div>
    );
}
