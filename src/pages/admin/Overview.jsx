// src/pages/admin/Overview.jsx
// Landing view. Stat cards + recharts status distributions, all DERIVED from
// the existing list endpoints (per-status limit:1 → read `total`) so nothing
// here depends on a stats/aggregation route that isn't in the backend.
//
// Requires: recharts  ->  npm i recharts
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight, Mic, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import {
    formatDate,
    prefersReduced,
    relativeTime,
    titleCase,
} from "../../components/admin/adminUtils";
import { GUEST_STATUS, bookingApi } from "../../services/bookingApi";
import { LEAD_STATUS, leadApi } from "../../services/leadApi";

// Hex values mirror StatusBadge's palette (recharts needs real color strings).
const COLOR = {
    new: "#ff5722",
    contacted: "#f59e0b",
    qualified: "#38bdf8",
    converted: "#34d399",
    rejected: "#fb7185",
    pending: "#f59e0b",
    confirmed: "#38bdf8",
    completed: "#34d399",
    cancelled: "#fb7185",
};
const AXIS = "#94a3b8"; // readable on both dark + light surfaces
const date = Date.now();

function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div className="border border-border-subtle bg-surface-raised px-3 py-2 text-xs shadow-lg">
            <p className="font-black text-content">{p.payload.name}</p>
            <p className="text-content-muted">
                <span className="font-bold text-content">{p.value}</span> record
                {p.value === 1 ? "" : "s"}
            </p>
        </div>
    );
}

export default function Overview() {
    const rootRef = useRef(null);
    const [stats, setStats] = useState({
        leads: null,
        newLeads: null,
        guests: null,
        pendingGuests: null,
    });
    const [leadChart, setLeadChart] = useState([]);
    const [guestChart, setGuestChart] = useState([]);
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentGuests, setRecentGuests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [leadCounts, guestCounts, rl, rg] = await Promise.all([
                    Promise.all(
                        LEAD_STATUS.map((s) =>
                            leadApi
                                .getAllLeads({ status: s, limit: 1 })
                                .then((r) => ({ status: s, count: r.total ?? 0 })),
                        ),
                    ),
                    Promise.all(
                        GUEST_STATUS.map((s) =>
                            bookingApi
                                .getGuestBookings({ status: s, limit: 1 })
                                .then((r) => ({ status: s, count: r.total ?? 0 })),
                        ),
                    ),
                    leadApi.getAllLeads({ limit: 5 }),
                    bookingApi.getGuestBookings({ limit: 5 }),
                ]);
                if (!active) return;

                const leadMap = Object.fromEntries(leadCounts.map((c) => [c.status, c.count]));
                const guestMap = Object.fromEntries(guestCounts.map((c) => [c.status, c.count]));

                setStats({
                    leads: leadCounts.reduce((a, c) => a + c.count, 0),
                    newLeads: leadMap.new ?? 0,
                    guests: guestCounts.reduce((a, c) => a + c.count, 0),
                    pendingGuests: guestMap.pending ?? 0,
                });
                setLeadChart(
                    leadCounts.map((c) => ({
                        name: titleCase(c.status),
                        value: c.count,
                        key: c.status,
                    })),
                );
                setGuestChart(
                    guestCounts
                        .filter((c) => c.count > 0)
                        .map((c) => ({ name: titleCase(c.status), value: c.count, key: c.status })),
                );
                setRecentLeads(rl.leads ?? []);
                setRecentGuests(rg.guests ?? []);
            } catch {
                if (active) setStats({ leads: 0, newLeads: 0, guests: 0, pendingGuests: 0 });
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.from(rootRef.current.querySelectorAll("[data-reveal]"), {
                y: 16,
                opacity: 0,
                duration: 0.55,
                ease: "power3.out",
                stagger: 0.06,
            });
        },
        { scope: rootRef, dependencies: [loading] },
    );

    const guestTotal = guestChart.reduce((a, c) => a + c.value, 0);

    return (
        <div ref={rootRef} className="mx-auto max-w-7xl space-y-8">
            {/* Intro */}
            <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-content-muted">
                        <span className="h-1.5 w-1.5 animate-pulse bg-brand-orange" />
                        Live Signal
                    </p>
                    <h2 className="mt-3 font-serif text-3xl font-black tracking-tight text-content sm:text-4xl">
                        Everything at a{" "}
                        <span className="font-serif font-medium italic text-brand-orange">
                            glance.
                        </span>
                    </h2>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-content-muted">
                    {formatDate(date)}
                </p>
            </div>

            {/* Stats */}
            <div data-reveal className="grid grid-cols-2 gap-px bg-border-subtle lg:grid-cols-4">
                <StatCard label="Total Leads" value={stats.leads} loading={loading} accent />
                <StatCard
                    label="New Leads"
                    value={stats.newLeads}
                    loading={loading}
                    hint="awaiting contact"
                />
                <StatCard label="Total Bookings" value={stats.guests} loading={loading} accent />
                <StatCard
                    label="Pending Bookings"
                    value={stats.pendingGuests}
                    loading={loading}
                    hint="needs review"
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Leads by status — horizontal bars */}
                <section className="border border-border-subtle bg-surface-raised">
                    <div className="border-b border-border-subtle px-5 py-3.5">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-content">
                            Leads by status
                        </p>
                    </div>
                    <div className="px-3 py-5">
                        {loading ? (
                            <div className="h-64 animate-pulse bg-border-subtle/40" />
                        ) : (
                            <ResponsiveContainer width="100%" height={256}>
                                <BarChart
                                    layout="vertical"
                                    data={leadChart}
                                    margin={{ left: 8, right: 24 }}
                                >
                                    <XAxis
                                        type="number"
                                        allowDecimals={false}
                                        tick={{ fill: AXIS, fontSize: 11 }}
                                        axisLine={{ stroke: AXIS, strokeOpacity: 0.25 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={82}
                                        tick={{ fill: AXIS, fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip />}
                                        cursor={{ fill: "#94a3b8", fillOpacity: 0.08 }}
                                    />
                                    <Bar dataKey="value" radius={[0, 0, 0, 0]} barSize={22}>
                                        {leadChart.map((d) => (
                                            <Cell key={d.key} fill={COLOR[d.key]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                {/* Bookings by status — donut */}
                <section className="border border-border-subtle bg-surface-raised">
                    <div className="border-b border-border-subtle px-5 py-3.5">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-content">
                            Bookings by status
                        </p>
                    </div>
                    <div className="px-3 py-5">
                        {loading ? (
                            <div className="h-64 animate-pulse bg-border-subtle/40" />
                        ) : guestTotal === 0 ? (
                            <div className="grid h-64 place-items-center text-sm text-content-muted">
                                No bookings yet.
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                <div className="relative h-56 w-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip content={<ChartTooltip />} />
                                            <Pie
                                                data={guestChart}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={62}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                stroke="none"
                                            >
                                                {guestChart.map((d) => (
                                                    <Cell key={d.key} fill={COLOR[d.key]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-serif text-3xl font-black tabular-nums text-content">
                                            {guestTotal}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-content-muted">
                                            total
                                        </span>
                                    </div>
                                </div>
                                <ul className="space-y-1.5">
                                    {guestChart.map((d) => (
                                        <li key={d.key} className="flex items-center gap-2 text-xs">
                                            <span
                                                className="h-2.5 w-2.5"
                                                style={{ background: COLOR[d.key] }}
                                            />
                                            <span className="font-bold text-content">{d.name}</span>
                                            <span className="text-content-muted">· {d.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Recent activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <RecentPanel
                    title="Recent Leads"
                    icon={Users}
                    to="/admin/leads"
                    loading={loading}
                    rows={recentLeads}
                    render={(l) => (
                        <>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-content">
                                    {l.fullName}
                                </p>
                                <p className="truncate text-xs text-content-muted">
                                    {titleCase(l.primaryGoal)} · {relativeTime(l.createdAt)}
                                </p>
                            </div>
                            <StatusBadge status={l.status} />
                        </>
                    )}
                />
                <RecentPanel
                    title="Recent Bookings"
                    icon={Mic}
                    to="/admin/guests"
                    loading={loading}
                    rows={recentGuests}
                    render={(g) => (
                        <>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-content">
                                    {g.fullName}
                                </p>
                                <p className="truncate text-xs text-content-muted">
                                    {g.category} · {relativeTime(g.createdAt)}
                                </p>
                            </div>
                            <StatusBadge status={g.status} />
                        </>
                    )}
                />
            </div>
        </div>
    );
}

function RecentPanel({ title, icon: Icon, to, loading, rows, render }) {
    return (
        <section className="border border-border-subtle bg-surface-raised">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-content">
                    <Icon size={14} className="text-brand-orange" />
                    {title}
                </p>
                <Link
                    to={to}
                    className="group flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-content-muted transition-colors hover:text-brand-orange"
                >
                    View all
                    <ArrowUpRight
                        size={12}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                </Link>
            </div>
            <ul className="divide-y divide-border-subtle">
                {loading &&
                    Array.from({ length: 5 }).map((_, i) => (
                        <li key={i} className="px-5 py-4">
                            <div className="h-3 w-1/2 animate-pulse bg-border-subtle/70" />
                        </li>
                    ))}
                {!loading && rows.length === 0 && (
                    <li className="px-5 py-8 text-center text-sm text-content-muted">
                        No records yet.
                    </li>
                )}
                {!loading &&
                    rows.map((row) => (
                        <li
                            key={row._id}
                            className="flex items-center justify-between gap-3 px-5 py-3.5"
                        >
                            {render(row)}
                        </li>
                    ))}
            </ul>
        </section>
    );
}
