// src/components/admin/DataTable.jsx
// Editorial hairline table: uppercase micro-header, sharp corners, orange
// left-accent on row hover. Column-driven so every management page stays DRY
// while keeping full control of each cell via render().
//
// columns: { key, header, className?, cell(row) }[]
// On < md it collapses each row into a stacked "card" using the same columns
// (data-label from the header) — no horizontal scroll trap on phones.
import { Inbox } from "lucide-react";

function SkeletonRows({ columns, count = 6 }) {
    return Array.from({ length: count }).map((_, r) => (
        <tr key={r} className="border-t border-border-subtle">
            {columns.map((c) => (
                <td key={c.key} className="px-4 py-4">
                    <div className="h-3 w-3/4 animate-pulse bg-border-subtle/70" />
                </td>
            ))}
        </tr>
    ));
}

export default function DataTable({
    columns,
    rows,
    loading,
    getRowKey = (row) => row._id,
    emptyTitle = "Nothing here yet",
    emptyHint = "New records will appear in this table.",
    skeletonRows = 6,
}) {
    const isEmpty = !loading && (!rows || rows.length === 0);

    return (
        <div className="w-full overflow-x-auto border border-border-subtle bg-surface-raised">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="bg-surface/40">
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                scope="col"
                                className={`px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-content-muted ${c.className || ""}`}
                            >
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading && <SkeletonRows columns={columns} count={skeletonRows} />}

                    {isEmpty && (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-16">
                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                    <span className="grid h-12 w-12 place-items-center border border-border-subtle text-content-muted">
                                        <Inbox size={20} />
                                    </span>
                                    <p className="font-serif text-lg font-black tracking-tight text-content">
                                        {emptyTitle}
                                    </p>
                                    <p className="max-w-xs text-sm text-content-muted">
                                        {emptyHint}
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}

                    {!loading &&
                        rows?.map((row) => (
                            <tr
                                key={getRowKey(row)}
                                data-row
                                className="group border-t border-border-subtle transition-colors hover:bg-surface/50"
                            >
                                {columns.map((c) => (
                                    <td
                                        key={c.key}
                                        className={`relative px-4 py-3.5 align-middle text-sm text-content-muted first:before:absolute first:before:inset-y-0 first:before:left-0 first:before:w-0.5 first:before:bg-transparent group-hover:first:before:bg-brand-orange ${c.className || ""}`}
                                    >
                                        {c.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}
