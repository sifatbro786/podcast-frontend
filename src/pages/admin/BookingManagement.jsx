/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/admin/BookingManagement.jsx
// Guest bookings table. Mirrors ContactManagement but with an added category
// filter and the guest schema's shorter field set (no detail drawer needed).
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Download, Loader2, Phone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import AdminSelect from "../../components/admin/AdminSelect";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import SearchBar from "../../components/admin/SearchBar";
import { formatDate, prefersReduced, titleCase } from "../../components/admin/adminUtils";
import { useDebounce } from "../../hooks/useDebounce";
import {
    GUEST_STATUS,
    PODCAST_CATEGORIES,
    bookingApi,
    bookingErrorMessage,
    downloadBookingsExcel,
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

    const [toDelete, setToDelete] = useState(null);
    const [exporting, setExporting] = useState(false);

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
                cell: (g) => <p className="font-black text-content">{g.fullName}</p>,
            },
            {
                key: "phone",
                header: "Phone",
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
                key: "category",
                header: "Category",
                className: "hidden md:table-cell",
                cell: (g) => <span className="text-xs font-bold text-content">{g.category}</span>,
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
                className: "hidden lg:table-cell",
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
                    <button
                        type="button"
                        onClick={() => setToDelete(g)}
                        aria-label="Delete booking"
                        className="grid h-8 w-8 place-items-center border border-transparent text-content-muted transition-colors hover:border-border-subtle hover:text-rose-400"
                    >
                        <Trash2 size={15} />
                    </button>
                ),
            },
        ],
        [],
    );

    return (
        <div ref={rootRef} className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-content-muted">
                        {meta.total} record{meta.total === 1 ? "" : "s"}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-black tracking-tight text-content sm:text-3xl">
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
                    className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
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
                    placeholder="Search name…"
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

            <ConfirmDialog
                open={!!toDelete}
                title="Delete this booking?"
                message={`${toDelete?.fullName || "This booking"} will be permanently removed. This cannot be undone.`}
                confirmLabel="Delete booking"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </div>
    );
}
