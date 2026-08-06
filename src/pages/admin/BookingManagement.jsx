/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/admin/BookingManagement.jsx
// Guest bookings table. Mirrors ContactManagement with a category filter, the
// guest schema's field set, and a portfolio column: resumes stream through the
// authed download helper (blob), portfolio links open in a new tab.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Download, ExternalLink, Eye, FileText, Loader2, Phone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import AdminSelect from "../../components/admin/AdminSelect";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import RecordDrawer, { DrawerField } from "../../components/admin/RecordDrawer";
import SearchBar from "../../components/admin/SearchBar";
import StatusBadge from "../../components/admin/StatusBadge";
import { formatDate, prefersReduced, titleCase } from "../../components/admin/adminUtils";
import { useDebounce } from "../../hooks/useDebounce";
import {
    GUEST_STATUS,
    PODCAST_CATEGORIES,
    bookingApi,
    bookingErrorMessage,
    downloadBookingsExcel,
    downloadGuestResume,
} from "../../services/bookingApi";

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    ...GUEST_STATUS.map((s) => ({ value: s, label: titleCase(s) })),
];
const ROW_STATUS_OPTIONS = GUEST_STATUS.map((s) => ({ value: s, label: titleCase(s) }));
const CATEGORY_OPTIONS = [
    { value: "", label: "All categories" },
    ...PODCAST_CATEGORIES.map((c) => ({ value: c, label: c })),
];

/* Prefer the new categories[] but gracefully fall back to legacy single category. */
const catList = (g) => (g.categories?.length ? g.categories : g.category ? [g.category] : []);

export default function BookingManagement() {
    const rootRef = useRef(null);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const debounced = useDebounce(search, 350);

    const [selected, setSelected] = useState(null); // drawer
    const [toDelete, setToDelete] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [resumeBusy, setResumeBusy] = useState(null);

    useEffect(() => setPage(1), [status, category, debounced]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (status) params.status = status;
            if (category) params.category = category;
            if (debounced.trim()) params.search = debounced.trim();
            const data = await bookingApi.getGuestBookings(params);
            setRows(data.guests ?? []);
            setMeta({ total: data.total ?? 0, page: data.page ?? 1, pages: data.pages ?? 1 });
        } catch (err) {
            toast.error(bookingErrorMessage(err, "Could not load bookings"));
        } finally {
            setLoading(false);
        }
    }, [page, status, category, debounced]);

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

    const changeStatus = async (guest, next) => {
        if (next === guest.status) return;
        const prev = guest.status;
        setRows((r) => r.map((x) => (x._id === guest._id ? { ...x, status: next } : x)));
        try {
            await bookingApi.updateBookingStatus(guest._id, next);
            toast.success(`Marked ${titleCase(next)}`);
        } catch (err) {
            setRows((r) => r.map((x) => (x._id === guest._id ? { ...x, status: prev } : x)));
            toast.error(bookingErrorMessage(err, "Status update failed"));
        }
    };

    const handleResume = async (guest) => {
        try {
            setResumeBusy(guest._id);
            await downloadGuestResume(guest);
        } catch (err) {
            toast.error(bookingErrorMessage(err, "Could not download resume"));
        } finally {
            setResumeBusy(null);
        }
    };

    const confirmDelete = async () => {
        try {
            await bookingApi.deleteBooking(toDelete._id);
            toast.success("Booking deleted");
            setToDelete(null);
            if (rows.length === 1 && page > 1) setPage((p) => p - 1);
            else load();
        } catch (err) {
            toast.error(bookingErrorMessage(err, "Delete failed"));
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            await downloadBookingsExcel();
            toast.success("Export started");
        } catch (err) {
            toast.error(bookingErrorMessage(err, "Export failed"));
        } finally {
            setExporting(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                key: "name",
                header: "Guest",
                cell: (g) => (
                    <div className="min-w-0">
                        <p className="font-semibold text-content">{g.fullName}</p>
                        {g.email && (
                            <a
                                href={`mailto:${g.email}`}
                                className="block truncate text-[11px] font-semibold text-content-muted transition-colors hover:text-brand-orange"
                            >
                                {g.email}
                            </a>
                        )}
                    </div>
                ),
            },
            {
                key: "phone",
                header: "WhatsApp",
                className: "hidden sm:table-cell",
                cell: (g) => (
                    <a
                        href={`tel:${g.phoneNumber}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-content-muted transition-colors hover:text-brand-orange"
                    >
                        <Phone size={12} />
                        {g.phoneNumber}
                    </a>
                ),
            },
            {
                key: "categories",
                header: "Categories",
                className: "hidden md:table-cell",
                cell: (g) => {
                    const list = catList(g);
                    if (!list.length) return <span className="text-content-muted/50">—</span>;
                    const shown = list.slice(0, 2);
                    const extra = list.length - shown.length;
                    return (
                        <div className="flex flex-wrap items-center gap-1">
                            {shown.map((c) => (
                                <span
                                    key={c}
                                    className="inline-block border border-border-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-content"
                                >
                                    {c}
                                </span>
                            ))}
                            {extra > 0 && (
                                <span className="text-[10px] font-bold text-content-muted">
                                    +{extra}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: "portfolio",
                header: "Portfolio",
                className: "hidden lg:table-cell",
                cell: (g) => {
                    const busy = resumeBusy === g._id;
                    if (!g.resume && !g.portfolioLink)
                        return <span className="text-content-muted/50">—</span>;
                    return (
                        <div className="flex items-center gap-1.5">
                            {g.resume && (
                                <button
                                    type="button"
                                    onClick={() => handleResume(g)}
                                    disabled={busy}
                                    title={g.resume.originalName}
                                    className="inline-flex items-center gap-1 border border-border-subtle px-2 py-1 text-[11px] font-bold text-content transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
                                >
                                    {busy ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <FileText size={12} />
                                    )}
                                    Resume
                                </button>
                            )}
                            {g.portfolioLink && (
                                <a
                                    href={g.portfolioLink}
                                    target="_blank"
                                    rel="noopener noreferrer external"
                                    title={g.portfolioLink}
                                    className="inline-flex items-center gap-1 border border-border-subtle px-2 py-1 text-[11px] font-bold text-content transition-colors hover:border-brand-orange hover:text-brand-orange"
                                >
                                    <ExternalLink size={12} />
                                    Link
                                </a>
                            )}
                        </div>
                    );
                },
            },
            {
                key: "status",
                header: "Status",
                cell: (g) => (
                    <AdminSelect
                        size="sm"
                        value={g.status}
                        options={ROW_STATUS_OPTIONS}
                        onChange={(v) => changeStatus(g, v)}
                        className="w-36"
                        align="right"
                    />
                ),
            },
            {
                key: "created",
                header: "Submitted",
                className: "hidden xl:table-cell",
                cell: (g) => (
                    <span className="whitespace-nowrap text-xs text-content-muted">
                        {formatDate(g.createdAt)}
                    </span>
                ),
            },
            {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (g) => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setSelected(g)}
                            aria-label="View booking"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted transition-colors hover:border-border-subtle hover:text-brand-orange"
                        >
                            <Eye size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setToDelete(g)}
                            aria-label="Delete booking"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted transition-colors hover:border-border-subtle hover:text-rose-400"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ),
            },
        ],
        // resumeBusy drives the per-row spinner; the rest close over stable refs.
        [resumeBusy],
    );

    return (
        <div ref={rootRef} className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                        {meta.total} record{meta.total === 1 ? "" : "s"}
                    </p>
                    <h2 className="mt-2 text-2xl font-medium tracking-tight text-content sm:text-3xl">
                        Guest{" "}
                        <span className="font-serif font-medium italic text-brand-orange">
                            bookings.
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

            <div className="flex flex-wrap items-center gap-4 border-y border-border-subtle py-4">
                <AdminSelect
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={setStatus}
                    className="w-full sm:w-44"
                />
                <AdminSelect
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={setCategory}
                    className="w-full sm:w-52"
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
                emptyTitle="No bookings match"
                emptyHint="Try clearing the filters or search term."
            />

            <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} />

            {/* Detail drawer — the full record: contact, every category, portfolio */}
            <RecordDrawer
                open={!!selected}
                eyebrow="Booking"
                title={selected?.fullName || ""}
                onClose={() => setSelected(null)}
            >
                {selected && (
                    <div>
                        <div className="mb-4">
                            <StatusBadge status={selected.status} />
                        </div>
                        <DrawerField label="Email">
                            {selected.email ? (
                                <a
                                    href={`mailto:${selected.email}`}
                                    className="text-brand-orange hover:underline"
                                >
                                    {selected.email}
                                </a>
                            ) : (
                                <span className="text-content-muted">—</span>
                            )}
                        </DrawerField>
                        <DrawerField label="WhatsApp">
                            <a
                                href={`tel:${selected.phoneNumber}`}
                                className="text-brand-orange hover:underline"
                            >
                                {selected.phoneNumber}
                            </a>
                        </DrawerField>
                        <DrawerField label="Categories">
                            {catList(selected).length ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {catList(selected).map((c) => (
                                        <span
                                            key={c}
                                            className="inline-block border border-border-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-content"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-content-muted">—</span>
                            )}
                        </DrawerField>
                        <DrawerField label="Portfolio Link">
                            {selected.portfolioLink ? (
                                <a
                                    href={selected.portfolioLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-brand-orange hover:underline"
                                >
                                    <ExternalLink size={13} />
                                    {selected.portfolioLink}
                                </a>
                            ) : (
                                <span className="text-content-muted">—</span>
                            )}
                        </DrawerField>
                        <DrawerField label="Resume">
                            {selected.resume ? (
                                <button
                                    type="button"
                                    onClick={() => handleResume(selected)}
                                    disabled={resumeBusy === selected._id}
                                    className="inline-flex items-center gap-1.5 border border-border-subtle px-3 py-1.5 text-xs font-bold text-content transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
                                >
                                    {resumeBusy === selected._id ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <FileText size={13} />
                                    )}
                                    {selected.resume.originalName || "Download resume"}
                                </button>
                            ) : (
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
                title="Delete this booking?"
                message={`${toDelete?.fullName || "This booking"} will be permanently removed, along with any uploaded resume. This cannot be undone.`}
                confirmLabel="Delete booking"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </div>
    );
}
