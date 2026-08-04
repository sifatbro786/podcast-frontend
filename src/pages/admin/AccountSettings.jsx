/* eslint-disable react-hooks/incompatible-library */
// src/pages/admin/AccountSettings.jsx
// Change-password form. Delegates to AuthContext.changePassword, which posts to
// PATCH /api/auth/change-password and rotates the JWT (the backend invalidates
// old tokens via passwordChangedAt). No manual token juggling needed here.
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function PwField({ label, error, register, show, onToggle, autoComplete }) {
    return (
        <div>
            <label className="text-[10px] font-black uppercase tracking-[0.24em] text-content-muted">
                {label}
            </label>
            <div className="relative mt-1 border-b-2 border-border-subtle transition-colors focus-within:border-brand-orange">
                <input
                    type={show ? "text" : "password"}
                    autoComplete={autoComplete}
                    className="w-full bg-transparent py-2.5 pr-11 text-base font-bold text-content outline-none"
                    {...register}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={show ? "Hide" : "Show"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-content-muted transition-colors hover:text-content"
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            <p
                className={`mt-1.5 min-h-4 text-xs font-semibold text-rose-400 ${error ? "" : "invisible"}`}
            >
                {error?.message || "\u00A0"}
            </p>
        </div>
    );
}

export default function AccountSettings() {
    const { user, changePassword } = useAuth();
    const [show, setShow] = useState({ cur: false, next: false, conf: false });
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();

    const newPassword = watch("newPassword");

    const onSubmit = async ({ currentPassword, newPassword }) => {
        try {
            await changePassword(currentPassword, newPassword);
            toast.success("Password changed");
            reset();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Could not change password");
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-content-muted">
                    Signed in as {user?.email}
                </p>
                <h2 className="mt-2 font-serif text-2xl font-black tracking-tight text-content sm:text-3xl">
                    Account{" "}
                    <span className="font-serif font-medium italic text-brand-orange">
                        settings.
                    </span>
                </h2>
            </div>

            <section className="border border-border-subtle bg-surface-raised">
                <div className="flex items-center gap-2 border-b border-border-subtle px-6 py-4">
                    <KeyRound size={15} className="text-brand-orange" />
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-content">
                        Change password
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6" noValidate>
                    <PwField
                        label="Current password"
                        autoComplete="current-password"
                        show={show.cur}
                        onToggle={() => setShow((s) => ({ ...s, cur: !s.cur }))}
                        error={errors.currentPassword}
                        register={register("currentPassword", { required: "Required" })}
                    />
                    <PwField
                        label="New password"
                        autoComplete="new-password"
                        show={show.next}
                        onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
                        error={errors.newPassword}
                        register={register("newPassword", {
                            required: "Required",
                            minLength: { value: 8, message: "Min 8 characters" },
                        })}
                    />
                    <PwField
                        label="Confirm new password"
                        autoComplete="new-password"
                        show={show.conf}
                        onToggle={() => setShow((s) => ({ ...s, conf: !s.conf }))}
                        error={errors.confirmPassword}
                        register={register("confirmPassword", {
                            required: "Required",
                            validate: (v) => v === newPassword || "Passwords do not match",
                        })}
                    />

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 bg-brand-orange px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                            Update password
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
