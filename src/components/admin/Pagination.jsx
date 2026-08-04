// src/components/admin/Pagination.jsx
// Console-style pager: "PAGE 02 / 07" mono label + prev/next. Purely
// presentational — parent owns page state and refetches.
import { ChevronLeft, ChevronRight } from "lucide-react";

const pad2 = (n) => String(n).padStart(2, "0");

export default function Pagination({ page, pages, total, onPage, className = "" }) {
    if (!pages || pages <= 1) {
        return (
            <div
                className={`flex items-center justify-end px-1 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-content-muted ${className}`}
            >
                {total ?? 0} record{total === 1 ? "" : "s"}
            </div>
        );
    }

    const btn =
        "grid h-9 w-9 place-items-center border border-border-subtle text-content transition-colors enabled:hover:border-brand-orange enabled:hover:text-brand-orange disabled:opacity-35 disabled:cursor-not-allowed";

    return (
        <div className={`flex flex-wrap items-center justify-between gap-4 px-1 py-3 ${className}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-content-muted">
                <span className="text-content">{total ?? 0}</span> record
                {total === 1 ? "" : "s"}
                <span className="mx-2 text-border-subtle">/</span>
                page <span className="text-brand-orange">{pad2(page)}</span> of {pad2(pages)}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className={btn}
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onPage(page + 1)}
                    disabled={page >= pages}
                    aria-label="Next page"
                    className={btn}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
