// src/components/common/Footer.jsx
// v3 — "End of Transmission".
// Changes vs v2:
//   • Wordmark is now the full company name, space-aware (spaces are real spans
//     so justify-between still spreads glyphs edge-to-edge without collapsing).
//   • Primary CTA copy updated.
//   • Reveals converted from .from() to .fromTo({ immediateRender:false }) so a
//     ScrollTrigger that never fires (iOS Safari / short scroll runway) leaves
//     elements in their natural, visible state instead of stuck at opacity 0.
//   • Wordmark letters respond to touch as well as hover.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { SiApplepodcasts, SiSpotify } from "react-icons/si";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

const NAV = [
    { label: "Services", href: "/#services" },
    { label: "Process", href: "/#process" },
    { label: "Guest Booking", href: "/#guest-booking" },
    { label: "Why Mission", href: "/#why-us" },
    { label: "Contact", href: "/#contact" },
];

const WORDMARK = "PODCAST CHART GROWTH";

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/*  Console bar widgets                                                */
/* ------------------------------------------------------------------ */

function UtcClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        let interval;
        const timeout = setTimeout(
            () => {
                setNow(new Date());
                interval = setInterval(() => setNow(new Date()), 1000);
            },
            1000 - (Date.now() % 1000),
        );
        return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, []);

    const pad = (n) => String(n).padStart(2, "0");
    const time = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;

    return (
        <time
            dateTime={now.toISOString()}
            className="text-[11px] font-black tabular-nums tracking-[0.15em] text-content"
        >
            {time} UTC
        </time>
    );
}

function BackToTop() {
    const ref = useRef(null);

    const onMove = (e) => {
        if (prefersReduced()) return;
        const r = ref.current.getBoundingClientRect();
        gsap.to(ref.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.3,
            y: (e.clientY - r.top - r.height / 2) * 0.35,
            duration: 0.4,
            ease: "power3.out",
        });
    };
    const onLeave = () =>
        gsap.to(ref.current, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.4)" });

    const scrollTop = () => {
        if (prefersReduced()) return window.scrollTo(0, 0);
        gsap.to(window, { scrollTo: 0, duration: 1.1, ease: "power3.inOut" });
    };

    return (
        <button
            ref={ref}
            type="button"
            onClick={scrollTop}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            aria-label="Back to top"
            className="group flex items-center gap-2 border border-border-subtle px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-content transition-colors hover:border-brand-orange hover:bg-brand-orange hover:text-white"
        >
            Top
            <ArrowUp size={13} className="transition-transform group-hover:-translate-y-0.5" />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

export default function Footer() {
    const rootRef = useRef(null);
    const year = new Date().getFullYear();

    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);

            // Mobile browsers fire resize every time the URL bar collapses/expands,
            // which re-runs refresh() mid-scroll and can strand a `once` trigger.
            ScrollTrigger.config({ ignoreMobileResize: true });

            // If the element is already on screen at mount (short page, deep link,
            // restored scroll position), play immediately instead of hanging a
            // trigger that may fire late or not at all.
            const isOnScreen = (el, ratio = 0.95) => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return r.top < window.innerHeight * ratio && r.bottom > 0;
            };

            /* ---- Content blocks ---- */
            const revealTargets = q("[data-reveal]");
            const footerVisible = isOnScreen(rootRef.current, 0.85);

            gsap.fromTo(
                revealTargets,
                { y: 30, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: 0.08,
                    overwrite: "auto",
                    // Never pre-render the "from" state — if the trigger never
                    // fires, the markup stays visible.
                    immediateRender: false,
                    ...(footerVisible
                        ? {}
                        : {
                              scrollTrigger: {
                                  trigger: rootRef.current,
                                  // "top bottom-=40" fires the moment the footer
                                  // edge clears the viewport bottom — reliable on
                                  // short mobile viewports where "top 85%" can be
                                  // skipped past in a single flick.
                                  start: "top bottom-=40",
                                  once: true,
                                  invalidateOnRefresh: true,
                              },
                          }),
                },
            );

            /* ---- Wordmark letters rise like EQ bars settling ---- */
            const wordmark = q("[data-wordmark]")[0];
            const letters = q("[data-letter]");
            const wordmarkVisible = isOnScreen(wordmark);

            gsap.fromTo(
                letters,
                { yPercent: 100 },
                {
                    yPercent: 0,
                    duration: 1.1,
                    ease: "power4.out",
                    stagger: 0.045,
                    overwrite: "auto",
                    immediateRender: false,
                    ...(wordmarkVisible
                        ? {}
                        : {
                              scrollTrigger: {
                                  trigger: wordmark,
                                  // The wordmark sits near the document end; a
                                  // "top 96%" start can be unreachable when the
                                  // footer is taller than the mobile viewport.
                                  start: "top bottom",
                                  once: true,
                                  invalidateOnRefresh: true,
                              },
                          }),
                },
            );

            /* ---- Recalculate once webfonts / images settle ---- */
            const refresh = () => ScrollTrigger.refresh();
            window.addEventListener("load", refresh);
            if (document.fonts?.ready) document.fonts.ready.then(refresh).catch(() => {});

            return () => window.removeEventListener("load", refresh);
        },
        { scope: rootRef },
    );

    // Each wordmark letter bounces like a struck EQ bar.
    // Bound to both pointer-enter and touchstart; the data-flag stops a touch
    // device that also synthesises mouseenter from firing the timeline twice.
    const bounceLetter = (e) => {
        if (prefersReduced()) return;
        const el = e.currentTarget;
        if (el.dataset.bouncing === "1") return;
        el.dataset.bouncing = "1";

        gsap.killTweensOf(el);
        gsap.timeline({
            onComplete: () => {
                el.dataset.bouncing = "";
            },
        })
            .set(el, { yPercent: 0 })
            .to(el, { yPercent: -16, color: "#ff5722", duration: 0.18, ease: "power2.out" })
            .to(el, { yPercent: 0, duration: 0.7, ease: "elastic.out(1, 0.35)" })
            .to(el, { color: "", duration: 0.5 }, "-=0.5");
    };

    return (
        <footer ref={rootRef} className="border-t border-border-subtle bg-surface-raised">
            {/* ---- Thin ops/console bar ---- */}
            <div className="border-b border-border-subtle">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
                    <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-content-muted">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Campaign · Live
                    </p>
                    <div className="flex items-center gap-4">
                        <UtcClock />
                        <BackToTop />
                    </div>
                </div>
            </div>

            {/* ---- The footer's real job: last-chance conversion ---- */}
            <div className="mx-auto max-w-7xl px-5 pt-5 md:px-8">
                <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
                    <h2 className=" font-display font-medium leading-[1.05] tracking-[-0.02em] text-white lg:mt-9 in-[.light]:text-slate-900">
                        <span data-line className=" text-[clamp(2rem,5.4vw,3.75rem)]">
                            Ready to be{" "}
                        </span>
                        <span className="font-serif text-[2.5em] sm:text-[3.6em] font-normal tracking-normal text-brand-orange italic">
                            discovered?
                        </span>
                    </h2>
                    <a
                        data-reveal
                        href="/#contact"
                        className="group inline-flex w-fit items-center gap-3 border border-border-subtle px-6 sm:px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-content transition-colors duration-300 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                    >
                        Start free podcast audit
                        <ArrowUpRight
                            size={18}
                            className="hidden sm:block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                    </a>
                </div>

                {/* ---- Contact: the email IS the link, oversized ---- */}
                <div data-reveal className="sm:mt-14 sm:border-t border-border-subtle pt-8">
                    <a
                        href="mailto:Mission2016start@gmail.com"
                        className="group relative inline-block break-all text-xl font-medium tracking-tight text-content transition-colors hover:text-brand-orange sm:text-2xl lg:text-3xl"
                    >
                        Mission2016start@gmail.com
                        <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand-orange transition-all duration-500 ease-out group-hover:w-full" />
                    </a>
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-content-muted">
                        <a
                            href="https://wa.me/8801710368102"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors hover:text-brand-orange"
                        >
                            WhatsApp +880 1710-368102
                        </a>
                        <span aria-hidden="true" className="hidden sm:block text-brand-orange">
                            ✦
                        </span>
                        <span>Global Operational Support</span>
                        <span aria-hidden="true" className="hidden sm:block text-brand-orange">
                            ✦
                        </span>
                        <span className="flex items-center gap-3">
                            <SiApplepodcasts
                                size={15}
                                className="transition-colors hover:text-[#B150E2]"
                                title="Apple Podcasts chart visibility"
                            />
                            <SiSpotify
                                size={15}
                                className="transition-colors hover:text-[#1DB954]"
                                title="Spotify chart visibility"
                            />
                            Apple &amp; Spotify chart visibility
                        </span>
                    </div>
                </div>

                {/* ---- Links: two quiet inline rows, not columns ---- */}
                <div
                    data-reveal
                    className="mt-10 space-y-3 border-t border-border-subtle pt-8 pb-4"
                >
                    <nav
                        aria-label="Footer"
                        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold"
                    >
                        {NAV.map((n) => (
                            <a
                                key={n.href}
                                href={n.href}
                                className="text-content-muted transition-colors hover:text-brand-orange"
                            >
                                {n.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>

            {/* ---- Sign-off: giant clipped wordmark, letters = EQ bars ---- */}
            <div
                data-wordmark
                aria-hidden="true"
                className="mx-auto max-w-7xl select-none overflow-hidden px-5 md:px-8"
            >
                {/* clamp retuned for 18 glyphs so the mark still bleeds edge-to-edge
                    at the same optical weight the 7-letter version had */}
                <div className="flex translate-y-[0.14em] justify-between text-[clamp(1.05rem,6.1vw,5.6rem)] font-black leading-none tracking-tight text-content/10">
                    {WORDMARK.split("").map((ch, i) =>
                        ch === " " ? (
                            // Real span, not a collapsed whitespace node: keeps the
                            // flex distribution honest and adds visible word spacing
                            // on top of the justify-between gap.
                            <span key={i} data-letter className="inline-block w-[0.25em]" />
                        ) : (
                            <span
                                key={i}
                                data-letter
                                onMouseEnter={bounceLetter}
                                onTouchStart={bounceLetter}
                                className="inline-block cursor-default transition-colors"
                            >
                                {ch}
                            </span>
                        ),
                    )}
                </div>
            </div>

            {/* ---- Legal bar ---- */}
            <div className="border-t border-border-subtle">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-[11px] font-semibold text-content-muted sm:flex-row sm:items-center md:px-8">
                    <p>© {year} Mission Podcast Growth. All rights reserved.</p>
                    <p>Results vary by show and campaign. No fake chart guarantees.</p>
                </div>
            </div>
        </footer>
    );
}
