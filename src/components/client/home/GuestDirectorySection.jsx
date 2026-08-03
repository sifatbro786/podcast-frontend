/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable react-refresh/only-export-components */
// src/components/client/home/GuestBookingSection.jsx
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import toast from "react-hot-toast";
import { ArrowUpRight, Check, Loader2, Radio } from "lucide-react";
import SplitWords from "../../common/SplitWords";
import { bookingApi, bookingErrorMessage } from "../../../services/bookingApi";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Mirrors backend utils/constants.js PODCAST_CATEGORIES — keep in sync. */
export const PODCAST_CATEGORIES = [
    "News",
    "Comedy",
    "Society & Culture",
    "Business",
    "True Crime",
    "Sports",
    "Health & Fitness",
    "Religion & Spirituality",
    "Arts",
    "Education",
    "History",
    "TV & Film",
    "Science",
    "Technology",
    "Music",
    "Kids & Family",
    "Leisure",
    "Government",
];

/* ------------------------------------------------------------------ */
/*  Brand signature — quiet EQ column that lives beside the copy       */
/* ------------------------------------------------------------------ */

function EqPulse() {
    const ref = useRef(null);
    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.to(ref.current.children, {
                scaleY: () => 0.2 + Math.random() * 0.8,
                duration: 0.5,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                repeatRefresh: true,
                transformOrigin: "bottom",
                stagger: { each: 0.07, from: "center" },
            });
        },
        { scope: ref },
    );
    return (
        <div ref={ref} aria-hidden="true" className="flex h-10 items-end gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
                <span
                    key={i}
                    className="w-1 flex-1 origin-bottom bg-brand-orange/70"
                    style={{ transform: "scaleY(0.3)" }}
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
    const [done, setDone] = useState(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { fullName: "", phoneNumber: "", category: "" } });

    // Register category once as a controlled value driven by the chip grid
    register("category", { required: "Choose the category that fits you best" });
    const selected = watch("category");

    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);
            gsap.from(q("[data-word]"), {
                yPercent: 110,
                duration: 1.1,
                ease: "power4.out",
                stagger: 0.03,
                scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
            });
            gsap.from(q("[data-reveal]"), {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.08,
                scrollTrigger: { trigger: q("[data-panel]"), start: "top 85%", once: true },
            });
        },
        { scope: rootRef },
    );

    const pickCategory = (cat, e) => {
        setValue("category", cat, { shouldValidate: true });
        if (prefersReduced()) return;
        // Tactile pop on the tapped chip
        gsap.fromTo(
            e.currentTarget,
            { scale: 0.9 },
            { scale: 1, duration: 0.4, ease: "back.out(3)" },
        );
    };

    const onSubmit = async (values) => {
        try {
            const res = await bookingApi.createBooking({
                fullName: values.fullName.trim(),
                phoneNumber: values.phoneNumber.trim(),
                category: values.category,
            });
            setDone(res.message || "Booking received! We'll reach out soon.");
            reset();
            toast.success("Request sent");
        } catch (err) {
            toast.error(bookingErrorMessage(err, "Could not send your request"));
            if (!prefersReduced()) {
                gsap.fromTo(
                    rootRef.current.querySelector("[data-panel]"),
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

    return (
        <section
            ref={rootRef}
            id="guest-booking"
            aria-label="Apply to be a podcast guest"
            className="bg-surface py-10 sm:py-24 md:pb-52"
        >
            <div className="mx-auto max-w-7xl px-5 md:px-8">
                {/* ---- Header ---- */}
                <div className="max-w-3xl">
                    <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                        <span className="h-2 w-2 rounded-full bg-brand-orange" />
                        Guest Booking
                    </p>
                    <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-content sm:text-5xl lg:text-6xl">
                        <SplitWords text="Be the guest" className="font-serif" />{" "}
                        <SplitWords
                            text="worth tuning in for."
                            className="font-serif font-medium italic tracking-normal text-brand-orange"
                        />
                    </h2>
                </div>

                {/* ---- Split: value column + form panel (the star) ---- */}
                <div className="sm:mt-14 grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
                    {/* Left — why, kept short on purpose */}
                    <div className="lg:pt-4">
                        <EqPulse />
                        <p className="mt-6 text-lg font-bold leading-relaxed text-content sm:text-xl">
                            We book you onto established shows in your category real hosts, real
                            listeners, conversations that convert.
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-content-muted">
                            Tell us who you are and where you fit. We shortlist shows your audience
                            already trusts and handle the outreach end to end.
                        </p>

                        <div className="mt-8 flex items-baseline gap-2.5 border-t border-border-subtle pt-6">
                            <span className="text-3xl font-black text-brand-orange">100+</span>
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-content-muted">
                                Partner shows active
                            </span>
                        </div>
                        <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-content-muted">
                            <Radio size={13} className="text-brand-orange" />
                            Real charts · Real listeners · No bots
                        </p>
                    </div>

                    {/* Right — the form panel */}
                    <div
                        data-panel
                        className="border border-border-subtle bg-surface-raised/60 p-6 backdrop-blur-xl sm:p-9"
                    >
                        {done ? (
                            <div className="flex flex-col items-start py-6">
                                <span className="grid h-12 w-12 place-items-center border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
                                    <Check size={22} />
                                </span>
                                <h3 className="mt-5 text-2xl font-black tracking-tight text-content">
                                    You&apos;re on the list.
                                </h3>
                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-content-muted">
                                    {done}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setDone(null)}
                                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-content transition-colors hover:text-brand-orange"
                                >
                                    Submit another
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                noValidate
                                className="space-y-7"
                            >
                                {/* Name */}
                                <div data-reveal>
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
                                    <p
                                        className={`mt-1.5 text-xs font-semibold text-red-500 ${
                                            errors.fullName ? "" : "invisible"
                                        }`}
                                    >
                                        {errors.fullName?.message || "\u00A0"}
                                    </p>
                                </div>

                                {/* Phone */}
                                <div data-reveal>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                        Phone / WhatsApp
                                    </label>
                                    <div className={line(errors.phoneNumber)}>
                                        <input
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder="+880 1XXX-XXXXXX"
                                            {...register("phoneNumber", {
                                                required: "Phone number is required",
                                                pattern: {
                                                    value: /^\+?[0-9\s\-()]{7,20}$/,
                                                    message: "Enter a valid phone number",
                                                },
                                            })}
                                            className={field}
                                        />
                                    </div>
                                    <p
                                        className={`mt-1.5 text-xs font-semibold text-red-500 ${
                                            errors.phoneNumber ? "" : "invisible"
                                        }`}
                                    >
                                        {errors.phoneNumber?.message || "\u00A0"}
                                    </p>
                                </div>

                                {/* Category — the tactile centerpiece */}
                                <div data-reveal>
                                    <div className="flex items-baseline justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                            Your category
                                        </label>
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                                                selected
                                                    ? "text-brand-orange"
                                                    : "text-content-muted/50"
                                            }`}
                                        >
                                            {selected || "Pick one"}
                                        </span>
                                    </div>
                                    <div
                                        role="radiogroup"
                                        aria-label="Your show category"
                                        className="mt-3 flex flex-wrap gap-2"
                                    >
                                        {PODCAST_CATEGORIES.map((cat) => {
                                            const isOn = selected === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={isOn}
                                                    onClick={(e) => pickCategory(cat, e)}
                                                    className={`px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
                                                        isOn
                                                            ? "bg-brand-orange text-white"
                                                            : "border border-border-subtle text-content-muted hover:border-brand-orange hover:text-brand-orange"
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p
                                        className={`mt-2 text-xs font-semibold text-red-500 ${
                                            errors.category ? "" : "invisible"
                                        }`}
                                    >
                                        {errors.category?.message || "\u00A0"}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group flex w-full items-center justify-center gap-2 bg-brand-orange px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            Apply as a Guest
                                            <ArrowUpRight
                                                size={16}
                                                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                            />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-content-muted/70">
                                    No spam. We only reach out about your placement.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
