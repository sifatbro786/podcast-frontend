/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/admin/UserManagement.jsx
// super_admin-only console for managing admin accounts. The route wrapper only
// enforces requireAdmin, so this component adds the super_admin gate itself and
// mirrors the backend's self-protection rules in the UI (can't demote / delete
// / deactivate your own account). The server is still the source of truth.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Loader2, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AdminSelect from "../../components/admin/AdminSelect";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import DataTable from "../../components/admin/DataTable";
import { formatDate, prefersReduced } from "../../components/admin/adminUtils";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_ROLES, authApi, authErrorMessage } from "../../services/authApi";

/* --- Create admin modal --- */
function CreateAdminModal({ open, onClose, onSaved }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();
    const [role, setRole] = useState("admin");

    useEffect(() => {
        if (open) {
            reset({ name: "", email: "", password: "" });
            setRole("admin");
        }
    }, [open, reset]);

    if (!open) return null;

    const submit = async (values) => {
        try {
            await authApi.createAdmin({ ...values, role });
            toast.success("Admin created");
            onSaved();
        } catch (err) {
            toast.error(authErrorMessage(err, "Could not create admin"));
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
            <div className="relative w-full max-w-md border border-border-subtle bg-surface-raised shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
                <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-orange">
                            New
                        </p>
                        <h2 className="mt-0.5 font-serif text-lg font-black tracking-tight text-content">
                            Admin account
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
                    <div>
                        <label className={labelCls}>Name</label>
                        <input
                            className={field}
                            placeholder="Jane Doe"
                            {...register("name", { required: "Required" })}
                        />
                        <p className={errCls}>{errors.name?.message || "\u00A0"}</p>
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input
                            className={field}
                            type="email"
                            placeholder="jane@agency.com"
                            {...register("email", {
                                required: "Required",
                                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
                            })}
                        />
                        <p className={errCls}>{errors.email?.message || "\u00A0"}</p>
                    </div>
                    <div>
                        <label className={labelCls}>Password</label>
                        <input
                            className={field}
                            type="password"
                            placeholder="min 8 characters"
                            {...register("password", {
                                required: "Required",
                                minLength: { value: 8, message: "Min 8 characters" },
                            })}
                        />
                        <p className={errCls}>{errors.password?.message || "\u00A0"}</p>
                    </div>
                    <div>
                        <label className={labelCls}>Role</label>
                        <AdminSelect
                            value={role}
                            options={ADMIN_ROLES}
                            onChange={setRole}
                            className="mt-2"
                        />
                    </div>
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
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserManagement() {
    const { user } = useAuth();
    const rootRef = useRef(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const isSuper = user?.role === "super_admin";

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await authApi.getAdmins();
            setRows(data.admins ?? []);
        } catch (err) {
            toast.error(authErrorMessage(err, "Could not load admins"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSuper) load();
        else setLoading(false);
    }, [isSuper, load]);

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

    const changeRole = async (admin, role) => {
        if (role === admin.role) return;
        const prev = admin.role;
        setRows((r) => r.map((x) => (x._id === admin._id ? { ...x, role } : x)));
        try {
            await authApi.updateAdminRole(admin._id, role);
            toast.success("Role updated");
        } catch (err) {
            setRows((r) => r.map((x) => (x._id === admin._id ? { ...x, role: prev } : x)));
            toast.error(authErrorMessage(err, "Role update failed"));
        }
    };

    const toggleStatus = async (admin) => {
        const next = !admin.isActive;
        setRows((r) => r.map((x) => (x._id === admin._id ? { ...x, isActive: next } : x)));
        try {
            await authApi.toggleAdminStatus(admin._id);
        } catch (err) {
            setRows((r) => r.map((x) => (x._id === admin._id ? { ...x, isActive: !next } : x)));
            toast.error(authErrorMessage(err, "Status update failed"));
        }
    };

    const confirmDelete = async () => {
        try {
            await authApi.deleteAdmin(toDelete._id);
            toast.success("Admin deleted");
            setToDelete(null);
            load();
        } catch (err) {
            toast.error(authErrorMessage(err, "Delete failed"));
        }
    };

    const columns = useMemo(
        () => [
            {
                key: "admin",
                header: "Admin",
                cell: (a) => {
                    const self = a._id === user?.id;
                    return (
                        <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center border border-border-subtle bg-surface font-serif text-sm font-black text-brand-orange">
                                {(a.name || "A").charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 truncate font-black text-content">
                                    {a.name}
                                    {self && (
                                        <span className="border border-border-subtle px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-content-muted">
                                            You
                                        </span>
                                    )}
                                </p>
                                <p className="truncate text-xs text-content-muted">{a.email}</p>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: "role",
                header: "Role",
                cell: (a) => {
                    const self = a._id === user?.id;
                    return (
                        <AdminSelect
                            size="sm"
                            value={a.role}
                            options={ADMIN_ROLES}
                            onChange={(v) => changeRole(a, v)}
                            className="w-40"
                            align="right"
                            disabled={self} // server also blocks self-demotion
                        />
                    );
                },
            },
            {
                key: "status",
                header: "Status",
                cell: (a) => {
                    const self = a._id === user?.id;
                    return (
                        <button
                            type="button"
                            onClick={() => toggleStatus(a)}
                            role="switch"
                            aria-checked={!!a.isActive}
                            disabled={self}
                            className={`relative h-6 w-11 border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                a.isActive
                                    ? "border-emerald-400 bg-emerald-400/20"
                                    : "border-border-subtle bg-surface"
                            }`}
                            aria-label={a.isActive ? "Deactivate" : "Activate"}
                        >
                            <span
                                className={`absolute top-0.5 h-4 w-4 transition-all ${
                                    a.isActive
                                        ? "left-[calc(100%-1.125rem)] bg-emerald-400"
                                        : "left-0.5 bg-content-muted"
                                }`}
                            />
                        </button>
                    );
                },
            },
            {
                key: "created",
                header: "Created",
                className: "hidden lg:table-cell",
                cell: (a) => (
                    <span className="whitespace-nowrap text-xs text-content-muted">
                        {formatDate(a.createdAt)}
                    </span>
                ),
            },
            {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (a) => {
                    const self = a._id === user?.id;
                    return (
                        <button
                            type="button"
                            onClick={() => setToDelete(a)}
                            disabled={self}
                            aria-label="Delete admin"
                            className="grid h-8 w-8 place-items-center border border-transparent text-content-muted transition-colors enabled:hover:border-border-subtle enabled:hover:text-rose-400 disabled:opacity-30"
                        >
                            <Trash2 size={15} />
                        </button>
                    );
                },
            },
        ],
        [user],
    );

    if (!isSuper) {
        return (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-4 border border-border-subtle bg-surface-raised px-6 py-16 text-center">
                <span className="grid h-14 w-14 place-items-center border border-border-subtle text-rose-400">
                    <ShieldAlert size={24} />
                </span>
                <h2 className="font-serif text-xl font-black tracking-tight text-content">
                    Restricted area
                </h2>
                <p className="max-w-sm text-sm text-content-muted">
                    Admin management is limited to super administrators. Contact a super admin if
                    you need access.
                </p>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-content-muted">
                        {rows.length} account{rows.length === 1 ? "" : "s"}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-black tracking-tight text-content sm:text-3xl">
                        Admin{" "}
                        <span className="font-serif font-medium italic text-brand-orange">
                            access.
                        </span>
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover"
                >
                    <Plus size={15} />
                    New admin
                </button>
            </div>

            <DataTable
                columns={columns}
                rows={rows}
                loading={loading}
                emptyTitle="No admins found"
                emptyHint="Create the first admin account."
            />

            <CreateAdminModal
                open={creating}
                onClose={() => setCreating(false)}
                onSaved={() => {
                    setCreating(false);
                    load();
                }}
            />

            <ConfirmDialog
                open={!!toDelete}
                title="Delete this admin?"
                message={`${toDelete?.name || "This admin"} will lose all access immediately. This cannot be undone.`}
                confirmLabel="Delete admin"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </div>
    );
}
