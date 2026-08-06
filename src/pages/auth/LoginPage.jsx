// src/pages/auth/LoginPage.jsx
// v2 — "Console Unlock". The brand-panel-left / form-right split is gone.
// One full-viewport stage: HUD corners, a live signal horizon behind the
// form, oversized underline-only inputs, and a clipped ghost wordmark.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Full-width signal horizon behind the form — quiet until the form wakes it. */
function SignalHorizon({ excited }) {
    const ref = useRef(null);
    const tween = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            tween.current = gsap.to(ref.current.children, {
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

    /* Typing/focus in the form raises the signal's energy */
    useEffect(() => {
        if (!tween.current) return;
        gsap.to(tween.current, { timeScale: excited ? 2.2 : 1, duration: 0.6 });
    }, [excited]);

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 flex h-40 -translate-y-1/2 items-center gap-1 opacity-[0.13]"
        >
            {Array.from({ length: 72 }).map((_, i) => (
                <span
                    key={i}
                    className="h-full flex-1 origin-center bg-brand-orange"
                    style={{ transform: "scaleY(0.25)" }}
                />
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
    const onLeave = () =>
        gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
    return (
        <button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} {...props}>
            {children}
        </button>
    );
}

/* Oversized underline-only field — no boxes anywhere on this page. */
function UnderlineField({ label, error, right, children }) {
    return (
        <div data-reveal>
            <div className="flex items-baseline justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                    {label}
                </label>
                {right}
            </div>
            <div
                className={`relative mt-1 border-b-2 transition-colors duration-300 ${
                    error
                        ? "border-red-500"
                        : "border-border-subtle focus-within:border-brand-orange"
                }`}
            >
                {children}
            </div>
            <p
                role="alert"
                className={`mt-1.5 min-h-4 text-xs font-semibold text-red-500 ${
                    error ? "" : "invisible"
                }`}
            >
                {error?.message || "\u00A0"}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/admin";

    const [showPw, setShowPw] = useState(false);
    const [excited, setExcited] = useState(false);
    const [shakeKey, setShakeKey] = useState(0);
    const rootRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);
            gsap.timeline({ defaults: { ease: "power3.out" } })
                .from(q("[data-hud]"), { opacity: 0, duration: 0.9, stagger: 0.08 })
                .from(
                    q("[data-reveal]"),
                    { y: 26, opacity: 0, duration: 0.7, stagger: 0.09 },
                    "-=0.5",
                )
                .from(
                    q("[data-ghost]"),
                    { yPercent: 40, opacity: 0, duration: 1.2, ease: "power4.out" },
                    "-=0.6",
                );
        },
        { scope: rootRef },
    );

    // Wrong credentials: the console shakes its head
    useGSAP(
        () => {
            if (shakeKey === 0 || prefersReduced()) return;
            gsap.fromTo(
                rootRef.current.querySelector("form"),
                { x: 0 },
                { x: 8, duration: 0.07, repeat: 5, yoyo: true, clearProps: "x" },
            );
        },
        { scope: rootRef, dependencies: [shakeKey] },
    );

    const onSubmit = async ({ email, password }) => {
        try {
            const admin = await login(email.trim(), password);
            toast.success(`Welcome back, ${admin.name.split(" ")[0]}`);
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err?.response?.data?.message || "Login failed");
            setShakeKey((k) => k + 1);
        }
    };

    const inputClass =
        "w-full bg-transparent py-3 text-lg font-bold text-content outline-none placeholder:font-medium placeholder:text-content-muted/40";

    return (
        <div
            ref={rootRef}
            className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-content"
        >
            <SignalHorizon excited={excited} />

            {/* ---- Center: the unlock ---- */}
            <main className="relative z-10 flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-112.5">
                    <p
                        data-reveal
                        className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-orange"
                    >
                        Admin Access
                    </p>
                    <h1
                        data-reveal
                        className="mt-3 text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl"
                    >
                        Unlock the{" "}
                        <span className="font-serif font-medium italic tracking-normal text-brand-orange">
                            console.
                        </span>
                    </h1>
                    <p data-reveal className="mt-4 text-sm leading-relaxed text-content-muted">
                        We don&apos;t fake charts. We climb them. Sign in to manage leads, bookings
                        and campaigns.
                    </p>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        onFocus={() => setExcited(true)}
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) setExcited(false);
                        }}
                        className="mt-10 space-y-4"
                        noValidate
                    >
                        <UnderlineField label="Email" error={errors.email}>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="you@agency.com"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^\S+@\S+\.\S+$/,
                                        message: "Enter a valid email",
                                    },
                                })}
                                className={inputClass}
                            />
                        </UnderlineField>

                        <UnderlineField
                            label="Password"
                            error={errors.password}
                            right={
                                <Link
                                    to="/forgot-password"
                                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange hover:underline"
                                >
                                    Forgot?
                                </Link>
                            }
                        >
                            <input
                                type={showPw ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: { value: 6, message: "Too short" },
                                })}
                                className={`${inputClass} pr-11`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((s) => !s)}
                                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-content-muted transition-colors hover:text-content"
                                aria-label={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </UnderlineField>

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
                                        Sign in
                                        <ArrowRight
                                            size={17}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </>
                                )}
                            </MagneticButton>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
