/* eslint-disable react-hooks/incompatible-library */
// src/components/client/home/ContactSection.jsx
// Form-first. The intake terminal IS the section — centered on the stage,
// framed like a console, with only a compact headline above it. Custom
// accessible listboxes (no native <select>), magnetic submit, shake on
// failure, GSAP crossfade to success. Posts via leadApi.submitLead.
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import toast from "react-hot-toast";
import { ArrowUpRight, Check, ChevronDown, Loader2, Lock } from "lucide-react";
import SplitWords from "../../common/SplitWords";
import { leadApi, leadErrorMessage, LEAD_GOALS, TARGET_MARKETS } from "../../../services/leadApi";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/*  Live console EQ — tiny brand tell in the terminal header           */
/* ------------------------------------------------------------------ */

function HeaderEq() {
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
            {[0.7, 0.4, 0.9, 0.5, 0.6].map((h, i) => (
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
/*  TerminalSelect — custom accessible listbox (no native <select>)    */
/* ------------------------------------------------------------------ */

function TerminalSelect({ label, placeholder, options, value, onChange, error }) {
    const uid = useId();
    const rootRef = useRef(null);
    const btnRef = useRef(null);
    const listRef = useRef(null);
    const [open, setOpen] = useState(false);

    const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
    const selectedIdx = opts.findIndex((o) => o.value === value);
    const [hi, setHi] = useState(-1);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (!rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("pointerdown", onDoc);
        return () => document.removeEventListener("pointerdown", onDoc);
    }, [open]);

    useEffect(() => {
        if (!open || !listRef.current || prefersReduced()) return;
        gsap.fromTo(
            listRef.current,
            { opacity: 0, y: -8 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" },
        );
        gsap.fromTo(
            listRef.current.children,
            { opacity: 0, x: -6 },
            { opacity: 1, x: 0, duration: 0.25, ease: "power3.out", stagger: 0.03 },
        );
    }, [open]);

    const openList = () => {
        setHi(selectedIdx >= 0 ? selectedIdx : 0);
        setOpen(true);
    };
    const pick = (idx) => {
        onChange(opts[idx].value);
        setOpen(false);
        btnRef.current.focus();
    };

    const onKeyDown = (e) => {
        if (!open) {
            if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
                e.preventDefault();
                openList();
            }
            return;
        }
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHi((h) => Math.min(h + 1, opts.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHi((h) => Math.max(h - 1, 0));
                break;
            case "Home":
                e.preventDefault();
                setHi(0);
                break;
            case "End":
                e.preventDefault();
                setHi(opts.length - 1);
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (hi >= 0) pick(hi);
                break;
            case "Escape":
                e.preventDefault();
                setOpen(false);
                btnRef.current.focus();
                break;
            case "Tab":
                setOpen(false);
                break;
            default:
        }
    };

    return (
        <div ref={rootRef} className={`relative ${open ? "z-40" : ""}`} onKeyDown={onKeyDown}>
            <label
                id={`${uid}-label`}
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted"
            >
                {label}
            </label>
            <button
                ref={btnRef}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby={`${uid}-label`}
                aria-controls={`${uid}-list`}
                aria-activedescendant={open && hi >= 0 ? `${uid}-opt-${hi}` : undefined}
                onClick={() => (open ? setOpen(false) : openList())}
                className={`mt-1 flex w-full items-center justify-between border-b-2 py-3 text-left transition-colors duration-300 ${
                    error
                        ? "border-red-500"
                        : open
                          ? "border-brand-orange"
                          : "border-border-subtle hover:border-brand-orange/60"
                }`}
            >
                <span
                    className={`text-lg font-bold ${
                        selectedIdx >= 0 ? "text-content" : "font-medium text-content-muted/40"
                    }`}
                >
                    {selectedIdx >= 0 ? opts[selectedIdx].label : placeholder}
                </span>
                <ChevronDown
                    size={17}
                    className={`shrink-0 text-content-muted transition-transform duration-300 ${
                        open ? "rotate-180 text-brand-orange" : ""
                    }`}
                />
            </button>

            {open && (
                <ul
                    ref={listRef}
                    id={`${uid}-list`}
                    role="listbox"
                    aria-labelledby={`${uid}-label`}
                    className="absolute inset-x-0 z-50 mt-1 border border-border-subtle bg-surface-raised shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)]"
                >
                    {opts.map((o, i) => {
                        const isSel = i === selectedIdx;
                        const isHi = i === hi;
                        return (
                            <li
                                key={o.value}
                                id={`${uid}-opt-${i}`}
                                role="option"
                                aria-selected={isSel}
                                onPointerEnter={() => setHi(i)}
                                onClick={() => pick(i)}
                                className={`flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${
                                    isHi
                                        ? "bg-brand-orange text-white"
                                        : isSel
                                          ? "text-brand-orange"
                                          : "text-content-muted"
                                }`}
                            >
                                {o.label}
                                {isSel && <Check size={14} strokeWidth={3} />}
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className={`mt-1.5 text-xs font-semibold text-red-500 ${error ? "" : "invisible"}`}>
                {error?.message || "\u00A0"}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export default function ContactSection() {
    const rootRef = useRef(null);
    const panelRef = useRef(null);
    const submitRef = useRef(null);
    const [done, setDone] = useState(null);

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
            podcastLink: "",
            primaryGoal: "",
            targetMarket: "",
            notes: "",
        },
    });

    register("primaryGoal", { required: "Pick your primary goal" });
    register("targetMarket", { required: "Pick a target market" });
    const goal = watch("primaryGoal");
    const market = watch("targetMarket");

    /* --- Entrance --- */
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
                y: 20,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.08,
                scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
            });
            gsap.from(panelRef.current, {
                y: 40,
                opacity: 0,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: { trigger: panelRef.current, start: "top 88%", once: true },
            });
            gsap.from(q("[data-field]"), {
                y: 22,
                opacity: 0,
                scale: 0.97,
                duration: 0.6,
                ease: "power3.out",
                stagger: 0.06,
                clearProps: "transform",
                scrollTrigger: { trigger: panelRef.current, start: "top 80%", once: true },
            });
        },
        { scope: rootRef },
    );

    /* --- Success panel entrance --- */
    useGSAP(
        () => {
            if (!done || prefersReduced()) return;
            const q = gsap.utils.selector(panelRef);
            gsap.timeline({ defaults: { ease: "power3.out" } })
                .fromTo(
                    panelRef.current,
                    { opacity: 0, y: 14 },
                    { opacity: 1, y: 0, duration: 0.5 },
                )
                .fromTo(
                    q("[data-success]"),
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
                    "-=0.25",
                );
        },
        { scope: panelRef, dependencies: [done] },
    );

    /* --- Magnetic submit --- */
    const onBtnMove = (e) => {
        if (prefersReduced()) return;
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

    const onSubmit = async (values) => {
        try {
            const res = await leadApi.submitLead({
                ...values,
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                podcastLink: values.podcastLink.trim(),
                notes: values.notes.trim(),
            });
            const show = () => {
                setDone(res.message || "Thanks! We'll be in touch shortly.");
                reset();
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
            toast.error(leadErrorMessage(err, "Could not send your request"));
            if (!prefersReduced()) {
                gsap.fromTo(
                    panelRef.current,
                    { x: 0 },
                    { x: 7, duration: 0.07, repeat: 5, yoyo: true, clearProps: "x" },
                );
            }
        }
    };

    const field =
        "w-full bg-transparent py-3 text-lg font-bold text-content outline-none placeholder:font-medium placeholder:text-content-muted/40";
    const line = (err) =>
        `mt-1 border-b-2 transition-colors duration-300 ${
            err ? "border-red-500" : "border-border-subtle focus-within:border-brand-orange"
        }`;
    const errSlot = (err) => (
        <p className={`mt-1.5 text-xs font-semibold text-red-500 ${err ? "" : "invisible"}`}>
            {err?.message || "\u00A0"}
        </p>
    );

    return (
        <section
            ref={rootRef}
            id="contact"
            aria-label="Request a free podcast review"
            className="relative overflow-hidden bg-surface py-10 sm:py-24"
        >
            {/* Faint grid, focused behind the centered terminal */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--content) 1px, transparent 1px), linear-gradient(90deg, var(--content) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage: "radial-gradient(ellipse at 50% 42%, black 32%, transparent 72%)",
                }}
            />

            <div className="relative mx-auto max-w-3xl px-5 md:px-8">
                {/* ---- Compact centered header ---- */}
                <div className="text-center">
                    <p
                        data-intro
                        className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted"
                    >
                        <span className="h-2 w-2 rounded-full bg-brand-orange" />
                        Start With A Review
                    </p>
                    <h2 className="mt-5 text-4xl font-black leading-[1.04] tracking-tight text-content sm:text-5xl lg:text-6xl">
                        <SplitWords text="Ready for" className="font-serif" />{" "}
                        <SplitWords
                            text="more momentum?"
                            className="font-serif font-medium italic tracking-normal text-brand-orange"
                        />
                    </h2>
                    <p
                        data-intro
                        className="mx-auto mt-5 max-w-md text-base leading-relaxed text-content-muted"
                    >
                        Share your link and goal we&apos;ll prepare the right starting move for your
                        show.
                    </p>
                </div>

                {/* ---- The intake terminal (the section's hero) ---- */}
                <div
                    ref={panelRef}
                    className="mt-12 border border-border-subtle bg-surface-raised/60 backdrop-blur-xl"
                >
                    {/* Console header strip */}
                    <div className="flex items-center justify-between border-b border-border-subtle px-6 py-3.5">
                        <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-content-muted">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                                <span className="relative h-2 w-2 rounded-full bg-brand-orange" />
                            </span>
                            Intake Terminal
                        </p>
                        <HeaderEq />
                    </div>

                    <div className="p-6 sm:p-9">
                        {done ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <span
                                    data-success
                                    className="grid h-14 w-14 place-items-center border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 shadow-[0_0_26px_rgba(16,185,129,0.28)]"
                                >
                                    <Check size={24} />
                                </span>
                                <h3
                                    data-success
                                    className="mt-6 text-2xl font-black tracking-tight text-content sm:text-3xl"
                                >
                                    Transmission received.
                                </h3>
                                <p
                                    data-success
                                    className="mt-2 max-w-sm text-sm leading-relaxed text-content-muted"
                                >
                                    {done}
                                </p>
                                <button
                                    data-success
                                    type="button"
                                    onClick={() => setDone(null)}
                                    className="mt-7 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-content transition-colors hover:text-brand-orange"
                                >
                                    Send another request
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
                                    <div data-field>
                                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                            Full name
                                        </label>
                                        <div className={line(errors.fullName)}>
                                            <input
                                                type="text"
                                                autoComplete="name"
                                                placeholder="Your name"
                                                {...register("fullName", {
                                                    required: "Name is required",
                                                    maxLength: { value: 120, message: "Too long" },
                                                })}
                                                className={field}
                                            />
                                        </div>
                                        {errSlot(errors.fullName)}
                                    </div>
                                    <div data-field>
                                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                            Business email
                                        </label>
                                        <div className={line(errors.email)}>
                                            <input
                                                type="email"
                                                autoComplete="email"
                                                placeholder="you@show.com"
                                                {...register("email", {
                                                    required: "Email is required",
                                                    pattern: {
                                                        value: /^\S+@\S+\.\S+$/,
                                                        message: "Enter a valid email",
                                                    },
                                                })}
                                                className={field}
                                            />
                                        </div>
                                        {errSlot(errors.email)}
                                    </div>
                                </div>

                                {/* Podcast link */}
                                <div data-field>
                                    <div className="flex items-baseline justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                            Podcast link
                                        </label>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-content-muted/50">
                                            Optional
                                        </span>
                                    </div>
                                    <div className={line(errors.podcastLink)}>
                                        <input
                                            type="url"
                                            placeholder="Apple Podcasts or Spotify URL"
                                            {...register("podcastLink", {
                                                pattern: {
                                                    value: /^https?:\/\/.+/,
                                                    message:
                                                        "Include the full URL, starting with https://",
                                                },
                                            })}
                                            className={field}
                                        />
                                    </div>
                                    {errSlot(errors.podcastLink)}
                                </div>

                                {/* Goal + Market */}
                                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                                    <div data-field>
                                        <TerminalSelect
                                            label="Primary goal"
                                            placeholder="What matters most?"
                                            options={LEAD_GOALS}
                                            value={goal}
                                            onChange={(v) =>
                                                setValue("primaryGoal", v, { shouldValidate: true })
                                            }
                                            error={errors.primaryGoal}
                                        />
                                    </div>
                                    <div data-field>
                                        <TerminalSelect
                                            label="Target market"
                                            placeholder="Where are your listeners?"
                                            options={TARGET_MARKETS}
                                            value={market}
                                            onChange={(v) =>
                                                setValue("targetMarket", v, {
                                                    shouldValidate: true,
                                                })
                                            }
                                            error={errors.targetMarket}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div data-field>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                        Anything we should know?
                                    </label>
                                    <div className={line(errors.notes)}>
                                        <textarea
                                            rows={2}
                                            placeholder="Niche, release schedule, past promotion…"
                                            {...register("notes", {
                                                maxLength: {
                                                    value: 2000,
                                                    message: "Keep it under 2000 characters",
                                                },
                                            })}
                                            className={`${field} resize-none`}
                                        />
                                    </div>
                                    {errSlot(errors.notes)}
                                </div>

                                <div data-field className="pt-1">
                                    <button
                                        ref={submitRef}
                                        type="submit"
                                        disabled={isSubmitting}
                                        onMouseMove={onBtnMove}
                                        onMouseLeave={onBtnLeave}
                                        className="group flex w-full items-center justify-center gap-2 bg-brand-orange px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                Prepare my free podcast review
                                                <ArrowUpRight
                                                    size={16}
                                                    className="hidden sm:block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                                />
                                            </>
                                        )}
                                    </button>
                                    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-content-muted/70">
                                        <Lock size={11} className="hidden sm:block" />
                                        Free test · No commitment · Details used only for your
                                        review
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
