// src/components/admin/adminUtils.js
// Tiny shared helpers for the admin surface. Kept dependency-free.

export const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "audience_growth" | "true crime" → "Audience Growth" | "True Crime" */
export const titleCase = (str = "") =>
    String(str)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/** Compact, locale-aware timestamp for table cells: "04 Aug 2026, 14:32" */
export const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/** "2h ago" / "3d ago" — used in the overview recent-activity lists. */
export const relativeTime = (value) => {
    if (!value) return "";
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(value);
};
