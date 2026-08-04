// src/pages/auth/ForgotPasswordPage.jsx
// "Signal Lost" — recovery entry point, styled to match LoginPage's Console
// Unlock. Posts to /api/auth/forgot-password, which ALWAYS returns the same
// generic message (anti-enumeration), so on success we show one neutral
// confirmation regardless of whether the email existed.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
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

export default function ForgotPasswordPage() {
    const rootRef = useRef(null);
    const [sent, setSent] = useState(false);
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm();

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
        { scope: rootRef, dependencies: [sent] },
    );

    const onSubmit = async ({ email }) => {
        try {
            await authApi.forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            toast.error(authErrorMessage(err, "Could not send reset link"));
        }
    };

    const inputClass =
        "w-full bg-transparent py-3 text-lg font-bold text-content outline-none placeholder:font-medium placeholder:text-content-muted/40";

    return (
        <div
            ref={rootRef}
            className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-content"
        >
            <SignalHorizon />
            <main className="relative z-10 flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md">
                    {!sent ? (
                        <>
                            <p
                                data-reveal
                                className="text-[11px] font-black uppercase tracking-[0.35em] text-brand-orange"
                            >
                                Recovery
                            </p>
                            <h1
                                data-reveal
                                className="mt-3 font-serif text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl"
                            >
                                Lost the{" "}
                                <span className="font-serif font-medium italic text-brand-orange">
                                    signal?
                                </span>
                            </h1>
                            <p
                                data-reveal
                                className="mt-4 text-sm leading-relaxed text-content-muted"
                            >
                                Enter the email tied to your admin account. If it exists, we&apos;ll
                                send a reset link.
                            </p>

                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="mt-10 space-y-4"
                                noValidate
                            >
                                <div data-reveal>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted">
                                        Email
                                    </label>
                                    <div
                                        className={`mt-1 border-b-2 transition-colors ${
                                            errors.email
                                                ? "border-rose-500"
                                                : "border-border-subtle focus-within:border-brand-orange"
                                        }`}
                                    >
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@agency.com"
                                            className={inputClass}
                                            {...register("email", {
                                                required: "Email is required",
                                                pattern: {
                                                    value: /^\S+@\S+\.\S+$/,
                                                    message: "Enter a valid email",
                                                },
                                            })}
                                        />
                                    </div>
                                    <p
                                        className={`mt-1.5 min-h-4 text-xs font-semibold text-rose-500 ${errors.email ? "" : "invisible"}`}
                                    >
                                        {errors.email?.message || "\u00A0"}
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
                                                Send reset link
                                                <ArrowRight
                                                    size={17}
                                                    className="transition-transform group-hover:translate-x-1"
                                                />
                                            </>
                                        )}
                                    </MagneticButton>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <span
                                data-reveal
                                className="mx-auto grid h-16 w-16 place-items-center border border-border-subtle text-brand-orange"
                            >
                                <MailCheck size={26} />
                            </span>
                            <h1
                                data-reveal
                                className="mt-6 font-serif text-3xl font-black tracking-tight"
                            >
                                Check your inbox
                            </h1>
                            <p
                                data-reveal
                                className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-content-muted"
                            >
                                If an account exists for{" "}
                                <span className="font-bold text-content">{getValues("email")}</span>
                                , a reset link is on its way. It expires shortly, so use it soon.
                            </p>
                        </div>
                    )}

                    <div data-reveal className="mt-8">
                        <Link
                            to="/login"
                            className="group inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-content-muted transition-colors hover:text-brand-orange"
                        >
                            <ArrowLeft
                                size={14}
                                className="transition-transform group-hover:-translate-x-1"
                            />
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
