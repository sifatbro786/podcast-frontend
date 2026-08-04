/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/admin/PageMetaManagement.jsx
// SEO metadata CRUD. Endpoints are consumed via pageMetaApi (see the [VERIFY]
// note there — adjust if your route file differs). List is read through
// normalizePageMetaList() so the envelope key doesn't matter. Create/edit uses
// a modal form; active state toggles inline.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import { formatDate, prefersReduced } from "../../components/admin/adminUtils";
import {
    normalizePageMetaList,
    pageMetaApi,
    pageMetaErrorMessage,
} from "../../services/pageMetaApi";

/* --- Modal form (create / edit) --- */
function MetaFormModal({ open, initial, onClose, onSaved }) {
    const panelRef = useRef(null);
    const isEdit = !!initial?._id;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();

    useEffect(() => {
        if (open) {
            reset({
                pageName: initial?.pageName || "",
                pageSlug: initial?.pageSlug || "",
                metaTitle: initial?.metaTitle || "",
                metaDescription: initial?.metaDescription || "",
                metaKeywords: initial?.metaKeywords || "",
                canonicalUrl: initial?.canonicalUrl || "",
                isActive: initial?.isActive ?? true,
            });
            if (!prefersReduced() && panelRef.current) {
                gsap.fromTo(
                    panelRef.current,
                    { opacity: 0, y: 14 },
                    { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" },
                );
            }
        }
    }, [open, initial, reset]);

    if (!open) return null;

    const submit = async (values) => {
        try {
            const payload = { ...values, pageSlug: values.pageSlug?.trim() || undefined };
            if (isEdit) await pageMetaApi.update(initial._id, payload);
            else await pageMetaApi.create(payload);
            toast.success(isEdit ? "Metadata updated" : "Metadata created");
            onSaved();
        } catch (err) {
            toast.error(pageMetaErrorMessage(err, "Save failed"));
        }
    };

    const field =
        "w-full border-b-2 border-border-subtle bg-transparent py-2 text-sm font-bold text-content outline-none transition-colors focus:border-brand-orange placeholder:font-medium placeholder:text-content-muted/40";
    const labelCls = "text-[10px] font-black uppercase tracking-[0.24em] text-content-muted";
    const errCls = "mt-1 min-h-4 text-xs font-semibold text-rose-400";

    return (
        <div
            className="fixed inset-0 z-95 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={panelRef}
                className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border border-border-subtle bg-surface-raised shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            >
                <div className="sticky top-0 flex items-center justify-between border-b border-border-subtle bg-surface-raised px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-orange">
                            {isEdit ? "Edit" : "New"}
                        </p>
                        <h2 className="mt-0.5 font-serif text-lg font-black tracking-tight text-content">
                            Page metadata
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="grid h-9 w-9 place-items-center border border-border-subtle text-content-muted hover:border-brand-orange hover:text-brand-orange"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(submit)} className="space-y-5 px-6 py-6" noValidate>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Page Name</label>
                            <input
                                className={field}
                                placeholder="Homepage"
                                {...register("pageName", { required: "Required" })}
                            />
                            <p className={errCls}>{errors.pageName?.message || "\u00A0"}</p>
                        </div>
                        <div>
                            <label className={labelCls}>Page Slug</label>
                            <input
                                className={field}
                                placeholder="home (optional)"
                                {...register("pageSlug")}
                            />
                            <p className={errCls}>{"\u00A0"}</p>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Meta Title</label>
                        <input
                            className={field}
                            placeholder="Ethical Podcast Growth…"
                            {...register("metaTitle", { required: "Required" })}
                        />
                        <p className={errCls}>{errors.metaTitle?.message || "\u00A0"}</p>
                    </div>

                    <div>
                        <label className={labelCls}>Meta Description</label>
                        <textarea
                            rows={3}
                            className={`${field} resize-none`}
                            placeholder="Real charts, real listeners…"
                            {...register("metaDescription", { required: "Required" })}
                        />
                        <p className={errCls}>{errors.metaDescription?.message || "\u00A0"}</p>
                    </div>

                    <div>
                        <label className={labelCls}>Meta Keywords</label>
                        <input
                            className={field}
                            placeholder="podcast growth, chart visibility"
                            {...register("metaKeywords", { required: "Required" })}
                        />
                        <p className={errCls}>{errors.metaKeywords?.message || "\u00A0"}</p>
                    </div>

                    <div>
                        <label className={labelCls}>Canonical URL</label>
                        <input
                            className={field}
                            placeholder="https://podcastchartgrowth.com/"
                            {...register("canonicalUrl", { required: "Required" })}
                        />
                        <p className={errCls}>{errors.canonicalUrl?.message || "\u00A0"}</p>
                    </div>

                    <label className="flex items-center gap-3 border border-border-subtle px-4 py-3">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-orange"
                            {...register("isActive")}
                        />
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-content">
                            Active
                        </span>
                    </label>

                    <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-border-subtle px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-content hover:border-content"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 bg-brand-orange px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-brand-orange-hover disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                            {isEdit ? "Save changes" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PageMetaManagement() {
    const rootRef = useRef(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit
    const [toDelete, setToDelete] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await pageMetaApi.getAll();
            setRows(normalizePageMetaList(res));
        } catch (err) {
            toast.error(pageMetaErrorMessage(err, "Could not load metadata"));
        } finally {
            setLoading(false);
        }
    }, []);

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

    const toggleActive = async (row) => {
        const next = !row.isActive;
        setRows((r) => r.map((x) => (x._id === row._id ? { ...x, isActive: next } : x)));
        try {
            await pageMetaApi.update(row._id, { isActive: next });
        } catch (err) {
            setRows((r) => r.map((x) => (x._id === row._id ? { ...x, isActive: !next } : x)));
            toast.error(pageMetaErrorMessage(err, "Update failed"));
        }
    };

    const confirmDelete = async () => {
        try {
            await pageMetaApi.remove(toDelete._id);
            toast.success("Metadata deleted");
            setToDelete(null);
            load();
        } catch (err) {
            toast.error(pageMetaErrorMessage(err, "Delete failed"));
        }
    };

    const columns = useMemo(
        () => [
            {
                key: "page",
                header: "Page",
                cell: (m) => (
                    <div className="min-w-0">
                        <p className="truncate font-black text-content">{m.pageName}</p>
                        {m.pageSlug && (
                            <p className="truncate font-mono text-[11px] text-content-muted">
                                /{m.pageSlug}
                            </p>
                        )}
                    </div>
                ),
            },
            {
                key: "title",
                header: "Meta Title",
                className: "hidden md:table-cell",
                cell: (m) => (
                    <p className="line-clamp-1 max-w-xs text-xs text-content-muted">
                        {m.metaTitle}
                    </p>
                ),
            },
            {
                key: "active",
                header: "Active",
                cell: (m) => (
                    <button
                        type="button"
                        onClick={() => toggleActive(m)}
                        role="switch"
                        aria-checked={!!m.isActive}
                        className={`relative h-6 w-11 border transition-colors ${
                            m.isActive
                                ? "border-brand-orange bg-brand-orange/20"
                                : "border-border-subtle bg-surface"
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 h-4 w-4 transition-all ${
                                m.isActive
                                    ? "left-[calc(100%-1.125rem)] bg-brand-orange"
                                    : "left-0.5 bg-content-muted"
                            }`}
                        />
                    </button>
                ),
            },
            {
                key: "updated",
                header: "Updated",
                className: "hidden lg:table-cell",
                cell: (m) => (
                    <span className="whitespace-nowrap text-xs text-content-muted">
                        {formatDate(m.updatedAt || m.createdAt)}
                    </span>
                ),
            },
            {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (m) => (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => setEditing(m)}
                            aria-label="Edit"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted hover:border-border-subtle hover:text-brand-orange"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setToDelete(m)}
                            aria-label="Delete"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted hover:border-border-subtle hover:text-rose-400"
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
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-content-muted">
                        {rows.length} page{rows.length === 1 ? "" : "s"}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-black tracking-tight text-content sm:text-3xl">
                        Page{" "}
                        <span className="font-serif font-medium italic text-brand-orange">
                            metadata.
                        </span>
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover"
                >
                    <Plus size={15} />
                    New page
                </button>
            </div>

            <DataTable
                columns={columns}
                rows={rows}
                loading={loading}
                emptyTitle="No metadata yet"
                emptyHint="Create your first page's SEO record."
            />

            <MetaFormModal
                open={editing !== undefined}
                initial={editing}
                onClose={() => setEditing(undefined)}
                onSaved={() => {
                    setEditing(undefined);
                    load();
                }}
            />

            <ConfirmDialog
                open={!!toDelete}
                title="Delete this metadata?"
                message={`SEO metadata for "${toDelete?.pageName || "this page"}" will be permanently removed.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </div>
    );
}
