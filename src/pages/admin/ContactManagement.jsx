/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/admin/ContactManagement.jsx
// Leads table. Server-driven pagination + status filter + name/email search
// (debounced). Inline status editing, a detail drawer for the long fields, and
// one-click .xlsx export. Delete is confirm-gated.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Download, Eye, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import AdminSelect from "../../components/admin/AdminSelect";
import DataTable from "../../components/admin/DataTable";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Pagination from "../../components/admin/Pagination";
import RecordDrawer, { DrawerField } from "../../components/admin/RecordDrawer";
import SearchBar from "../../components/admin/SearchBar";
import StatusBadge from "../../components/admin/StatusBadge";
import { formatDate, prefersReduced, titleCase } from "../../components/admin/adminUtils";
import { useDebounce } from "../../hooks/useDebounce";
import {
    LEAD_GOALS,
    LEAD_STATUS,
    downloadLeadsExcel,
    leadApi,
    leadErrorMessage,
} from "../../services/leadApi";

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    ...LEAD_STATUS.map((s) => ({ value: s, label: titleCase(s) })),
];
const ROW_STATUS_OPTIONS = LEAD_STATUS.map((s) => ({ value: s, label: titleCase(s) }));
const GOAL_LABEL = Object.fromEntries(LEAD_GOALS.map((g) => [g.value, g.label]));

export default function ContactManagement() {
    const rootRef = useRef(null);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const debounced = useDebounce(search, 350);

    const [selected, setSelected] = useState(null); // drawer
    const [toDelete, setToDelete] = useState(null); // confirm
    const [exporting, setExporting] = useState(false);

    // Reset to page 1 whenever a filter changes
    useEffect(() => setPage(1), [status, debounced]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (status) params.status = status;
            if (debounced.trim()) params.search = debounced.trim();
            const data = await leadApi.getAllLeads(params);
            setRows(data.leads ?? []);
            setMeta({ total: data.total ?? 0, page: data.page ?? 1, pages: data.pages ?? 1 });
        } catch (err) {
            toast.error(leadErrorMessage(err, "Could not load leads"));
        } finally {
            setLoading(false);
        }
    }, [page, status, debounced]);

    useEffect(() => {
        load();
    }, [load]);

    useGSAP(
        () => {
            if (loading || prefersReduced()) return;
            gsap.from(rootRef.current.querySelectorAll("[data-row]"), {
                opacity: 0,
                y: 10,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.03,
            });
        },
        { scope: rootRef, dependencies: [loading, rows] },
    );

    const changeStatus = async (lead, next) => {
        if (next === lead.status) return;
        const prev = lead.status;
        setRows((r) => r.map((x) => (x._id === lead._id ? { ...x, status: next } : x)));
        try {
            await leadApi.updateLeadStatus(lead._id, next);
            toast.success(`Marked ${titleCase(next)}`);
        } catch (err) {
            setRows((r) => r.map((x) => (x._id === lead._id ? { ...x, status: prev } : x)));
            toast.error(leadErrorMessage(err, "Status update failed"));
        }
    };

    const confirmDelete = async () => {
        try {
            await leadApi.deleteLead(toDelete._id);
            toast.success("Lead deleted");
            setToDelete(null);
            // If we just emptied the page, step back one
            if (rows.length === 1 && page > 1) setPage((p) => p - 1);
            else load();
        } catch (err) {
            toast.error(leadErrorMessage(err, "Delete failed"));
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            await downloadLeadsExcel();
            toast.success("Export started");
        } catch (err) {
            toast.error(leadErrorMessage(err, "Export failed"));
        } finally {
            setExporting(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                key: "name",
                header: "Lead",
                cell: (l) => (
                    <div className="min-w-0">
                        <p className="truncate font-bold text-content">{l.fullName}</p>
                        <p className="truncate text-xs text-content-muted">{l.businessEmail}</p>
                    </div>
                ),
            },
            {
                key: "goal",
                header: "Goal",
                className: "hidden md:table-cell",
                cell: (l) => (
                    <span className="text-xs font-bold text-content">
                        {GOAL_LABEL[l.primaryGoal] || titleCase(l.primaryGoal)}
                    </span>
                ),
            },
            {
                key: "market",
                header: "Market",
                className: "hidden lg:table-cell",
                cell: (l) => (
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-content-muted">
                        {l.targetMarket}
                    </span>
                ),
            },
            {
                key: "status",
                header: "Status",
                cell: (l) => (
                    <AdminSelect
                        size="sm"
                        value={l.status}
                        options={ROW_STATUS_OPTIONS}
                        onChange={(v) => changeStatus(l, v)}
                        className="w-36"
                        align="right"
                    />
                ),
            },
            {
                key: "created",
                header: "Submitted",
                className: "hidden sm:table-cell",
                cell: (l) => (
                    <span className="whitespace-nowrap text-xs text-content-muted">
                        {formatDate(l.createdAt)}
                    </span>
                ),
            },
            {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (l) => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setSelected(l)}
                            aria-label="View lead"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted transition-colors hover:border-border-subtle hover:text-brand-orange"
                        >
                            <Eye size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setToDelete(l)}
                            aria-label="Delete lead"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted transition-colors hover:border-border-subtle hover:text-rose-400"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <div ref={rootRef} className="mx-auto max-w-7xl space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                        {meta.total} record{meta.total === 1 ? "" : "s"}
                    </p>
                    <h2 className="mt-2 text-2xl font-medium tracking-tight text-content sm:text-3xl">
                        Inbound{" "}
                        <span className="font-serif font-medium italic text-brand-orange">
                            leads.
                        </span>
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                >
                    {exporting ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Download size={15} />
                    )}
                    Export .xlsx
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 border-y border-border-subtle py-4">
                <AdminSelect
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={setStatus}
                    className="w-full sm:w-48"
                />
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search name or email…"
                    className="min-w-48 flex-1"
                />
            </div>

            <DataTable
                columns={columns}
                rows={rows}
                loading={loading}
                emptyTitle="No leads match"
                emptyHint="Try clearing the status filter or search term."
            />

            <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} />

            {/* Detail drawer */}
            <RecordDrawer
                open={!!selected}
                eyebrow="Lead"
                title={selected?.fullName || ""}
                onClose={() => setSelected(null)}
            >
                {selected && (
                    <div>
                        <div className="mb-4">
                            <StatusBadge status={selected.status} />
                        </div>
                        <DrawerField label="Business Email">
                            <a
                                href={`mailto:${selected.businessEmail}`}
                                className="text-brand-orange hover:underline"
                            >
                                {selected.businessEmail}
                            </a>
                        </DrawerField>
                        <DrawerField label="Primary Goal">
                            {GOAL_LABEL[selected.primaryGoal] || titleCase(selected.primaryGoal)}
                        </DrawerField>
                        <DrawerField label="Target Market">{selected.targetMarket}</DrawerField>
                        <DrawerField label="Podcast Link">
                            {selected.podcastLink ? (
                                <a
                                    href={selected.podcastLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-orange hover:underline"
                                >
                                    {selected.podcastLink}
                                </a>
                            ) : (
                                <span className="text-content-muted">—</span>
                            )}
                        </DrawerField>
                        <DrawerField label="Additional Details">
                            {selected.additionalDetails || (
                                <span className="text-content-muted">—</span>
                            )}
                        </DrawerField>
                        <DrawerField label="Submitted">
                            {formatDate(selected.createdAt)}
                        </DrawerField>
                    </div>
                )}
            </RecordDrawer>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete this lead?"
                message={`${toDelete?.fullName || "This lead"} will be permanently removed. This cannot be undone.`}
                confirmLabel="Delete lead"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </div>
    );
}
