// src/pages/auth/ResetPasswordPage.jsx
// Consumes the link the backend emails: /reset-password/:token. Posts to
// PATCH /api/auth/reset-password/:token with the new password (>= 8 chars,
// enforced both here and server-side). On success → sign in. A 400 means the
// token is invalid/expired → we surface a recover-again path.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldX } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi, authErrorMessage } from "../../services/authApi";

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SignalHorizon() {
    const ref = useRef(null);
    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.to(ref.current.children, {
                scaleY: () => 0.15 + Math.random() * 0.85,
                duration: 0.5,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                repeatRefresh: true,
                transformOrigin: "center",
                stagger: { each: 0.03, from: "random" },
            });
        },
        { scope: ref },
    );
    return (
        <div
            ref={ref}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 flex h-40 -translate-y-1/2 items-center gap-1 opacity-[0.13]"
        >
            {Array.from({ length: 72 }).map((_, i) => (
                <span key={i} className="h-full flex-1 origin-center bg-brand-orange" style={{ transform: "scaleY(0.25)" }} />
            ))}
        </div>
    );
}

function MagneticButton({ children, ...props }) {
    const ref = useRef(null);
    const onMove = (e) => {
        if (prefersReduced()) return;
        const r = ref.current.getBoundingClientRect();
        gsap.to(ref.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.3,
            y: (e.clientY - r.top - r.height / 2) * 0.4,
            duration: 0.4,
            ease: "power3.out",
        });
    };
    const onLeave = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
    return (
        <button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} {...props}>
            {children}
        </button>
    );
}

function PwInput({ show, onToggle, register }) {
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-transparent py-3 pr-11 text-lg font-bold text-content outline-none placeholder:font-medium placeholder:text-content-muted/40"
                {...register}
            />
            <button
                type="button"
                onClick={onToggle}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-content-muted transition-colors hover:text-content"
            >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
        </div>
    );
}

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const rootRef = useRef(null);
    const [expired, setExpired] = useState(false);
    const [show, setShow] = useState({ a: false, b: false });
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm();
    const pw = watch("password");

    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.from(rootRef.current.querySelectorAll("[data-reveal]"), {
                y: 24,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.09,
            });
        },
        { scope: rootRef, dependencies: [expired] },
    );

    const onSubmit = async ({ password }) => {
        try {
            await authApi.resetPassword(token, password);
            toast.success("Password reset — please sign in");
            navigate("/login", { replace: true });
        } catch (err) {
            if (err?.response?.status === 400) setExpired(true);
            else toast.error(authErrorMessage(err, "Could not reset password"));
        }
    };

    const fieldWrap = (hasError) =>
        `mt-1 border-b-2 transition-colors ${hasError ? "border-rose-500" : "border-border-subtle focus-within:border-brand-orange"}`;

    return (
        <div ref={rootRef} className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-content">
            <SignalHorizon />
            <main className="relative z-10 flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md">
                    {expired ? (
                        <div className="text-center">
                            <span data-reveal className="mx-auto grid h-16 w-16 place-items-center border border-border-subtle text-rose-400">
                                <ShieldX size={26} />
                            </span>
                            <h1 data-reveal className="mt-6 font-serif text-3xl font-black tracking-tight">
                                Link expired
                            </h1>
                            <p data-reveal className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-content-muted">
                                This reset link is invalid or has already been used. Request a fresh one to
                                continue.
                            </p>
                            <div data-reveal className="mt-8">
                                <Link
                                    to="/forgot-password"
                                    className="inline-flex items-center gap-2 bg-brand-orange px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover"
                                >
                                    Request new link
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p data-reveal className="text-[11px] font-black uppercase tracking-[0.35em] text-brand-orange">
                                Reset Access
                            </p>
                            <h1 data-reveal className="mt-3 font-serif text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl">
                                Set a new{" "}
                                <span className="font-serif font-medium italic text-brand-orange">key.</span>
                            </h1>
                            <p data-reveal className="mt-4 text-sm leading-relaxed text-content-muted">
                                Choose a strong password of at least 8 characters. You&apos;ll use it to sign
                                in next time.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-4" noValidate>
                                <div data-reveal>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted">
                                        New password
                                    </label>
                                    <div className={fieldWrap(errors.password)}>
                                        <PwInput
                                            show={show.a}
                                            onToggle={() => setShow((s) => ({ ...s, a: !s.a }))}
                                            register={register("password", {
                                                required: "Password is required",
                                                minLength: { value: 8, message: "Min 8 characters" },
                                            })}
                                        />
                                    </div>
                                    <p className={`mt-1.5 min-h-4 text-xs font-semibold text-rose-500 ${errors.password ? "" : "invisible"}`}>
                                        {errors.password?.message || "\u00A0"}
                                    </p>
                                </div>

                                <div data-reveal>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted">
                                        Confirm password
                                    </label>
                                    <div className={fieldWrap(errors.confirm)}>
                                        <PwInput
                                            show={show.b}
                                            onToggle={() => setShow((s) => ({ ...s, b: !s.b }))}
                                            register={register("confirm", {
                                                required: "Please confirm",
                                                validate: (v) => v === pw || "Passwords do not match",
                                            })}
                                        />
                                    </div>
                                    <p className={`mt-1.5 min-h-4 text-xs font-semibold text-rose-500 ${errors.confirm ? "" : "invisible"}`}>
                                        {errors.confirm?.message || "\u00A0"}
                                    </p>
                                </div>

                                <div data-reveal className="pt-2">
                                    <MagneticButton
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="group flex w-full items-center justify-center gap-2 bg-brand-orange px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                Reset password
                                                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </MagneticButton>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
