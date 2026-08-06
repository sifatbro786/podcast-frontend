// src/components/admin/StatusBadge.jsx
// Sharp-edged status pill (no rounding) with a leading colour tick — reads like
// a console indicator, not a generic chip. One config drives leads + guests.
import { titleCase } from "./adminUtils";

/* text/border/dot tokens per status. Kept as full class strings so Tailwind's
   JIT can see them (no dynamic string concat that the compiler can't scan). */
const STATUS_STYLES = {
    // Lead lifecycle
    new: "text-brand-orange border-brand-orange/40 bg-brand-orange/5",
    contacted: "text-amber-500 border-amber-500/40 bg-amber-500/5",
    qualified: "text-sky-400 border-sky-400/40 bg-sky-400/5",
    converted: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
    rejected: "text-rose-400 border-rose-400/40 bg-rose-400/5",
    // Guest booking lifecycle
    pending: "text-amber-500 border-amber-500/40 bg-amber-500/5",
    confirmed: "text-sky-400 border-sky-400/40 bg-sky-400/5",
    completed: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
    cancelled: "text-rose-400 border-rose-400/40 bg-rose-400/5",
};

const DOT = {
    new: "bg-brand-orange",
    contacted: "bg-amber-500",
    qualified: "bg-sky-400",
    converted: "bg-emerald-400",
    rejected: "bg-rose-400",
    pending: "bg-amber-500",
    confirmed: "bg-sky-400",
    completed: "bg-emerald-400",
    cancelled: "bg-rose-400",
};

export default function StatusBadge({ status, className = "" }) {
    const style = STATUS_STYLES[status] || "text-content-muted border-border-subtle";
    return (
        <span
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${style} ${className}`}
        >
            <span className={`h-1.5 w-1.5 shrink-0 ${DOT[status] || "bg-content-muted"}`} />
            {titleCase(status)}
        </span>
    );
}
