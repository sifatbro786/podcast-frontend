/* eslint-disable react-hooks/incompatible-library */
// src/components/client/home/GuestDirectorySection.jsx
// "Green Room" — the guest-booking console. Sibling to ContactSection's Intake
// Terminal: same framed-well vocabulary + live console header, distinct booking
// identity. Fields: name, email, WhatsApp, portfolio (link XOR resume upload),
// and a max-3 category chip bank. Centered, form-first, light/dark via tokens.
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import toast from "react-hot-toast";
import {
    ArrowUpRight,
    Check,
    FileText,
    Link2,
    Loader2,
    Paperclip,
    Radio,
    Upload,
    X,
} from "lucide-react";
import SplitWords from "../../common/SplitWords";
import { bookingApi, bookingErrorMessage, PODCAST_CATEGORIES } from "../../../services/bookingApi";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---- Shared field vocabulary (mirrors ContactSection's framed wells) ---- */
const LABEL = "mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-content";
const FIELD_BASE =
    "w-full rounded-lg border bg-surface/80 px-4 py-3.5 text-base font-medium text-content " +
    "outline-none transition-all duration-200 placeholder:font-medium " +
    "placeholder:text-content-muted/60 focus:bg-surface focus:ring-2";
const fieldCls = (err) =>
    `${FIELD_BASE} ${
        err
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-border-subtle focus:border-brand-orange focus:ring-brand-orange/20"
    }`;
const errSlot = (err) => (
    <p className={`mt-1.5 text-xs font-semibold text-red-500 ${err ? "" : "invisible"}`}>
        {err?.message || "\u00A0"}
    </p>
);

const RESUME_ACCEPT = ".pdf,.doc,.docx";
const RESUME_MAX = 5 * 1024 * 1024; // 5 MB — mirrors RESUME_MAX_BYTES
const humanSize = (bytes) =>
    bytes < 1024 * 1024
        ? `${Math.max(1, Math.round(bytes / 1024))} KB`
        : `${(bytes / 1048576).toFixed(1)} MB`;

/* ------------------------------------------------------------------ */
/*  Live console EQ — the brand tell in the header strip               */
/* ------------------------------------------------------------------ */
function GreenRoomEq() {
    const ref = useRef(null);
    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.to(ref.current.children, {
                scaleY: () => 0.3 + Math.random() * 0.7,
                duration: 0.4,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                repeatRefresh: true,
                transformOrigin: "center",
                stagger: 0.08,
            });
        },
        { scope: ref },
    );
    return (
        <div ref={ref} aria-hidden="true" className="flex h-3 items-center gap-0.5">
            {[0.6, 0.9, 0.4, 0.8, 0.5, 0.7].map((h, i) => (
                <span
                    key={i}
                    className="w-0.5 origin-center bg-brand-orange"
                    style={{ height: `${h * 100}%` }}
                />
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */
export default function GuestBookingSection() {
    const rootRef = useRef(null);
    const panelRef = useRef(null);
    const submitRef = useRef(null);
    const fileInputRef = useRef(null);
    const uid = useId();

    const [done, setDone] = useState(null);
    const [portfolioMode, setPortfolioMode] = useState("link"); // "link" | "upload"
    const [resumeFile, setResumeFile] = useState(null);
    const [dragging, setDragging] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            portfolioLink: "",
            categories: [],
        },
    });

    // Category bank is a controlled RHF field driven by the chip toggles.
    register("categories", {
        validate: (v) => (v && v.length >= 1) || "Pick at least one category",
    });
    const categories = watch("categories") || [];

    /* ---- Entrance choreography (scroll-triggered, mobile-safe, once) ---- */
    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);
            gsap.from(q("[data-word]"), {
                yPercent: 110,
                duration: 1.1,
                ease: "power4.out",
                stagger: 0.03,
                scrollTrigger: { trigger: rootRef.current, start: "top 80%", once: true },
            });
            gsap.from(q("[data-intro]"), {
                y: 24,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.08,
                scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
            });
            gsap.from(q("[data-reveal]"), {
                y: 26,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.06,
                scrollTrigger: { trigger: panelRef.current, start: "top 82%", once: true },
            });
        },
        { scope: rootRef },
    );

    /* ---- Arriving via the navbar (#guest-booking): pulse the panel so the
           form is unmistakably the thing that was requested. ---- */
    useEffect(() => {
        if (window.location.hash !== "#guest-booking" || prefersReduced()) return;
        const t = setTimeout(() => {
            if (!panelRef.current) return;
            gsap.fromTo(
                panelRef.current,
                { boxShadow: "0 0 0 0 rgba(255,87,34,0)" },
                {
                    boxShadow: "0 0 46px -6px rgba(255,87,34,0.55)",
                    duration: 0.6,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1,
                },
            );
        }, 700);
        return () => clearTimeout(t);
    }, []);

    /* ---- Magnetic submit (pointer devices only) ---- */
    const onBtnMove = (e) => {
        if (!canHover() || prefersReduced()) return;
        const r = submitRef.current.getBoundingClientRect();
        gsap.to(submitRef.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.25,
            y: (e.clientY - r.top - r.height / 2) * 0.35,
            duration: 0.4,
            ease: "power3.out",
        });
    };
    const onBtnLeave = () =>
        gsap.to(submitRef.current, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.4)" });

    /* ---- Category chip bank (pick one or many, no upper limit) ---- */
    const toggleCategory = (cat, el) => {
        const has = categories.includes(cat);
        const next = has ? categories.filter((c) => c !== cat) : [...categories, cat];
        setValue("categories", next, { shouldValidate: true });
        if (!has && !prefersReduced() && el) {
            gsap.fromTo(el, { scale: 0.88 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
        }
    };

    /* ---- Résumé file handling (drag/drop + browse), client-side guardrails ---- */
    const acceptFile = (file) => {
        if (!file) return;
        if (!/\.(pdf|docx?|doc)$/i.test(file.name)) {
            toast.error("Resume must be a PDF or Word file");
            return;
        }
        if (file.size > RESUME_MAX) {
            toast.error("Resume is too large (max 5 MB)");
            return;
        }
        setResumeFile(file);
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };
    const switchMode = (mode) => {
        setPortfolioMode(mode);
        if (mode === "link") setResumeFile(null);
        else setValue("portfolioLink", "");
    };

    /* ---- Submit ---- */
    const onSubmit = async (values) => {
        try {
            const payload = {
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                phoneNumber: values.phoneNumber.trim(),
                categories: values.categories,
                portfolioLink:
                    portfolioMode === "link" ? values.portfolioLink.trim() || undefined : undefined,
                resume: portfolioMode === "upload" ? resumeFile : null,
            };
            const res = await bookingApi.createBooking(payload);

            const show = () => {
                setDone(res.message || "Booking received! We'll reach out soon.");
                reset();
                setResumeFile(null);
                setPortfolioMode("link");
            };
            if (prefersReduced()) show();
            else
                gsap.to(panelRef.current, {
                    opacity: 0,
                    y: -14,
                    duration: 0.35,
                    ease: "power2.in",
                    onComplete: show,
                });
            toast.success("Request sent");
        } catch (err) {
            toast.error(bookingErrorMessage(err, "Could not send your request"));
            if (!prefersReduced()) {
                gsap.fromTo(
                    panelRef.current,
                    { x: 0 },
                    { x: 7, duration: 0.07, repeat: 5, yoyo: true, clearProps: "x" },
                );
            }
        }
    };

    return (
        <section
            ref={rootRef}
            aria-label="Apply to be a podcast guest"
            className="relative overflow-hidden bg-surface py-10 sm:py-24 md:pb-48"
        >
            {/* Faint grid focused behind the console */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--content) 1px, transparent 1px), linear-gradient(90deg, var(--content) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-4xl px-5 md:px-8">
                {/* ---- Header (content, up top) ---- */}
                <div className="text-center">
                    <p className="inline-flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                        <span className="text-[14px] text-brand-orange">✦</span> Guest Booking
                    </p>
                    <h2 className="mt-5 font-display text-4xl font-medium leading-[1.04] tracking-[-0.02em] text-content sm:text-5xl lg:text-6xl">
                        <SplitWords text="Be the guest to" />{" "}
                        <SplitWords
                            text="others podcast."
                            className="font-serif text-[1.06em] font-normal italic tracking-normal text-brand-orange"
                        />
                    </h2>
                    <p
                        data-intro
                        className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-content-muted"
                    >
                        We book you onto established shows in your category real hosts, real
                        listeners, conversations that convert.
                    </p>
                    <div
                        data-intro
                        className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-bold uppercase tracking-[0.18em] text-content-muted"
                    >
                        <span className="text-brand-orange">100+ partner shows</span>
                        <span aria-hidden="true" className="text-content-muted/40">
                            /
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Radio size={13} className="text-brand-orange" />
                            Real listeners
                        </span>
                        <span aria-hidden="true" className="text-content-muted/40">
                            /
                        </span>
                        <span>No bots</span>
                    </div>
                </div>

                {/* ---- The Green Room console (the form is the hero) ---- */}
                <div
                    ref={panelRef}
                    data-panel
                    className="mt-11 rounded-2xl border border-brand-orange/25 bg-surface-raised/90 shadow-[0_0_50px_-15px_rgba(255,87,34,0.18)] backdrop-blur-2xl sm:mt-14"
                >
                    {/* Console header strip */}
                    <div
                        id="guest-booking"
                        className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5 sm:px-6"
                    >
                        <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-content-muted">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                                <span className="relative h-2 w-2 rounded-full bg-brand-orange" />
                            </span>
                            Green Room · Booking open
                        </p>
                        <GreenRoomEq />
                    </div>

                    <div className="p-5 sm:p-9">
                        {done ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <span className="grid h-14 w-14 place-items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 shadow-[0_0_26px_rgba(16,185,129,0.28)]">
                                    <Check size={24} />
                                </span>
                                <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em] text-content sm:text-3xl">
                                    You&apos;re on the guest list.
                                </h3>
                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-content-muted">
                                    {done}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setDone(null)}
                                    className="mt-7 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-content transition-colors hover:text-brand-orange"
                                >
                                    Submit another
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                noValidate
                                className="space-y-6"
                            >
                                {/* Name + Email */}
                                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                                    <div data-reveal>
                                        <label className={LABEL} htmlFor={`${uid}-name`}>
                                            Full name
                                        </label>
                                        <input
                                            id={`${uid}-name`}
                                            type="text"
                                            autoComplete="name"
                                            placeholder="Your name"
                                            {...register("fullName", {
                                                required: "Name is required",
                                                maxLength: { value: 120, message: "Too long" },
                                            })}
                                            className={fieldCls(errors.fullName)}
                                        />
                                        {errSlot(errors.fullName)}
                                    </div>
                                    <div data-reveal>
                                        <label className={LABEL} htmlFor={`${uid}-email`}>
                                            Email
                                        </label>
                                        <input
                                            id={`${uid}-email`}
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@domain.com"
                                            {...register("email", {
                                                required: "Email is required",
                                                pattern: {
                                                    value: /^\S+@\S+\.\S+$/,
                                                    message: "Enter a valid email",
                                                },
                                            })}
                                            className={fieldCls(errors.email)}
                                        />
                                        {errSlot(errors.email)}
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div data-reveal>
                                    <label className={LABEL} htmlFor={`${uid}-wa`}>
                                        WhatsApp number
                                    </label>
                                    <input
                                        id={`${uid}-wa`}
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder="+880 1XXX-XXXXXX"
                                        {...register("phoneNumber", {
                                            required: "WhatsApp number is required",
                                            pattern: {
                                                value: /^\+?[0-9\s\-()]{7,20}$/,
                                                message: "Enter a valid phone number",
                                            },
                                        })}
                                        className={fieldCls(errors.phoneNumber)}
                                    />
                                    {errSlot(errors.phoneNumber)}
                                </div>

                                {/* Portfolio — link XOR resume upload */}
                                <div data-reveal>
                                    <div className="mb-2 flex items-baseline justify-between gap-3">
                                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-content">
                                            Portfolio
                                        </label>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-content-muted/50">
                                            Optional · pick one
                                        </span>
                                    </div>

                                    {/* Segmented mode switch */}
                                    <div
                                        role="group"
                                        aria-label="Portfolio input method"
                                        className="mb-3 inline-flex rounded-lg border border-border-subtle p-1"
                                    >
                                        {[
                                            { id: "link", label: "Link", Icon: Link2 },
                                            { id: "upload", label: "Upload", Icon: Upload },
                                        ].map(({ id, label, Icon }) => {
                                            const on = portfolioMode === id;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => switchMode(id)}
                                                    className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                                                        on
                                                            ? "bg-brand-orange text-white"
                                                            : "text-content-muted hover:text-content"
                                                    }`}
                                                >
                                                    <Icon size={13} />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {portfolioMode === "link" ? (
                                        <>
                                            <input
                                                type="url"
                                                inputMode="url"
                                                placeholder="https://your-portfolio.com"
                                                {...register("portfolioLink", {
                                                    pattern: {
                                                        value: /^https?:\/\/.+/i,
                                                        message: "Start with http:// or https://",
                                                    },
                                                })}
                                                className={fieldCls(errors.portfolioLink)}
                                            />
                                            {errSlot(errors.portfolioLink)}
                                        </>
                                    ) : (
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept={RESUME_ACCEPT}
                                                className="sr-only"
                                                onChange={(e) => acceptFile(e.target.files?.[0])}
                                            />
                                            {resumeFile ? (
                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-orange/40 bg-brand-orange/5 px-4 py-3">
                                                    <span className="flex min-w-0 items-center gap-2.5">
                                                        <FileText
                                                            size={18}
                                                            className="shrink-0 text-brand-orange"
                                                        />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-bold text-content">
                                                                {resumeFile.name}
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-content-muted">
                                                                {humanSize(resumeFile.size)}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setResumeFile(null);
                                                            if (fileInputRef.current)
                                                                fileInputRef.current.value = "";
                                                        }}
                                                        aria-label="Remove resume"
                                                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-content-muted transition-colors hover:bg-surface hover:text-red-500"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        setDragging(true);
                                                    }}
                                                    onDragLeave={() => setDragging(false)}
                                                    onDrop={onDrop}
                                                    className={`flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
                                                        dragging
                                                            ? "border-brand-orange bg-brand-orange/5"
                                                            : "border-border-subtle hover:border-brand-orange/60"
                                                    }`}
                                                >
                                                    <Paperclip
                                                        size={18}
                                                        className="text-brand-orange"
                                                    />
                                                    <span className="text-sm font-bold text-content">
                                                        Drop your resume or{" "}
                                                        <span className="text-brand-orange underline underline-offset-2">
                                                            browse
                                                        </span>
                                                    </span>
                                                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-content-muted/70">
                                                        PDF or Word · up to 5 MB
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Category bank — the signature (max 3) */}
                                <div data-reveal>
                                    <div className="mb-3 flex items-baseline justify-between gap-3">
                                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-content">
                                            Your categories
                                        </label>
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                                                categories.length
                                                    ? "text-brand-orange"
                                                    : "text-content-muted/50"
                                            }`}
                                        >
                                            {categories.length
                                                ? `${categories.length} selected`
                                                : "Pick at least one"}
                                        </span>
                                    </div>
                                    <div
                                        role="group"
                                        aria-label="Pick one or more categories"
                                        className="flex flex-wrap gap-2"
                                    >
                                        {PODCAST_CATEGORIES.map((cat) => {
                                            const on = categories.includes(cat);
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={(e) =>
                                                        toggleCategory(cat, e.currentTarget)
                                                    }
                                                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
                                                        on
                                                            ? "bg-brand-orange text-white"
                                                            : "border border-border-subtle text-content-muted hover:border-brand-orange/60 hover:text-content"
                                                    }`}
                                                >
                                                    {on && <Check size={12} strokeWidth={3} />}
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errSlot(errors.categories)}
                                </div>

                                {/* Submit */}
                                <div className="pt-1">
                                    <button
                                        ref={submitRef}
                                        type="submit"
                                        disabled={isSubmitting}
                                        onMouseMove={onBtnMove}
                                        onMouseLeave={onBtnLeave}
                                        className="group flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                Request my guest slot
                                                <ArrowUpRight
                                                    size={16}
                                                    className="hidden transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block"
                                                />
                                            </>
                                        )}
                                    </button>
                                    <p className="mt-3 text-center text-xs text-content-muted/70">
                                        No spam. We only reach out about your placement.
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
