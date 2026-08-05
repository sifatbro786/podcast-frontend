// src/components/client/home/WhyMissionSection.jsx — v3
// "The Record". The differentiator — we don't fake charts — is the hero, not
// a card. The honest policy is a giant manifesto that scroll lights up.
//
// Changed vs v2:
//   • Type system corrected — Sora (font-display) carries every heading and
//     the manifesto body; Instrument Serif is now reserved for the italic
//     accent phrases only. Instrument Serif ships one weight (400), so every
//     font-black / font-medium on a serif element was synthesising fake bold.
//   • Word fill is one staggered tween instead of ~40 chained ones.
//   • Mobile gets a single non-scrubbed fill sweep — motion, but nothing
//     pinned and nothing recalculating per frame.
//   • Stamp rotation moved to CSS so it costs no JS ticker time.
import { Fragment, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import SplitWords from "../../common/SplitWords";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PILLARS = [
    { title: "Platform-focused", detail: "Apple Podcasts and Spotify expertise" },
    { title: "Review-first", detail: "Test before choosing a longer campaign" },
    { title: "Transparent support", detail: "Clear expectations and progress updates" },
];

const MANIFESTO = [
    { t: "We do not offer" },
    { t: "fake reviews,", key: true },
    { t: "guaranteed chart positions", key: true },
    { t: "or" },
    { t: "unrealistic promises.", key: true },
    {
        t: "Results depend on your niche, content quality, audience demand, competition, targeting and campaign duration.",
    },
];

const WORDS = MANIFESTO.flatMap((seg) => seg.t.split(" ").map((w) => ({ w, key: !!seg.key })));

/* Unlit state for the scroll-fill. Low enough to read as "not yet", high
   enough that the paragraph never looks broken if motion is disabled. */
const DIM = 0.16;

function IntegrityStamp() {
    return (
        <div aria-hidden="true" className="relative grid h-24 w-24 shrink-0 place-items-center">
            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full animate-spin [animation-duration:26s] motion-reduce:animate-none"
            >
                <defs>
                    <path
                        id="stamp-circle"
                        d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    />
                </defs>
                <text className="fill-content-muted text-[9.5px] font-bold uppercase tracking-[0.32em]">
                    <textPath href="#stamp-circle">Verified Integrity · Since 2015 ·</textPath>
                </text>
            </svg>
            <span className="grid h-11 w-11 place-items-center">
                <ShieldCheck size={20} className="text-brand-orange" />
            </span>
        </div>
    );
}

export default function WhyMissionSection() {
    const rootRef = useRef(null);
    const pinRef = useRef(null); // the stage that pins
    const wordsRef = useRef(null); // the manifesto paragraph

    useGSAP(
        () => {
            const q = gsap.utils.selector(rootRef);
            const words = q("[data-mword]");
            const mm = gsap.matchMedia();

            ScrollTrigger.config({ ignoreMobileResize: true });

            /* ---------------- Heading + pillar reveals ---------------- */
            if (!prefersReduced()) {
                const inView =
                    rootRef.current.getBoundingClientRect().top < window.innerHeight * 0.8;

                gsap.fromTo(
                    q("[data-word]"),
                    { yPercent: 110 },
                    {
                        yPercent: 0,
                        duration: 1.1,
                        ease: "power4.out",
                        stagger: 0.03,
                        // Never pre-render the hidden state — a missed trigger
                        // leaves the heading readable instead of clipped.
                        immediateRender: false,
                        ...(inView
                            ? {}
                            : {
                                  scrollTrigger: {
                                      trigger: rootRef.current,
                                      start: "top 80%",
                                      once: true,
                                  },
                              }),
                    },
                );

                gsap.fromTo(
                    q("[data-reveal]"),
                    { y: 34, autoAlpha: 0 },
                    {
                        y: 0,
                        autoAlpha: 1,
                        duration: 0.8,
                        ease: "power3.out",
                        stagger: 0.1,
                        immediateRender: false,
                        scrollTrigger: {
                            trigger: q("[data-pillars]")[0],
                            start: "top 88%",
                            once: true,
                        },
                    },
                );
            }

            /* ---------------- Desktop: pin + scroll-fill ----------------
               The stage sticks while scroll lights the words left to right,
               holds a beat once every word is lit, then releases. */
            mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
                gsap.set(words, { opacity: DIM });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: pinRef.current,
                        start: "top top",
                        // Viewport-relative instead of a hard 1800px, so the
                        // read speed is the same on a 13" laptop and a 32".
                        end: () => `+=${Math.round(window.innerHeight * 1.9)}`,
                        pin: true,
                        scrub: 1,
                        // No anticipatePin: Lenis already looks ahead of the
                        // native scroll position and the two double-count.
                        invalidateOnRefresh: true,
                    },
                });

                // One tween with a stagger, not one tween per word. Same
                // visual, a fraction of the timeline overhead per frame.
                tl.to(words, {
                    opacity: 1,
                    ease: "none",
                    duration: 0.6,
                    stagger: { each: 0.11 },
                }).to({}, { duration: 1.6 }); // hold beat before release
            });

            /* ------- Mobile / reduced-motion: one sweep, no pin ------- */
            mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
                if (prefersReduced()) {
                    gsap.set(words, { opacity: 1 });
                    return;
                }

                gsap.set(words, { opacity: DIM });

                // Not scrubbed: the fill plays once on entry at its own pace.
                // Scrubbing 40 spans against touch scroll is where phones drop
                // frames, and pinning on mobile fights native momentum.
                gsap.to(words, {
                    opacity: 1,
                    ease: "none",
                    duration: 0.45,
                    stagger: { each: 0.035 },
                    scrollTrigger: {
                        trigger: wordsRef.current,
                        start: "top 78%",
                        once: true,
                    },
                });
            });

            return () => mm.revert();
        },
        { scope: rootRef },
    );

    return (
        <section
            ref={rootRef}
            id="why-us"
            aria-label="Why Mission and our standard"
            className="relative bg-surface py-14 sm:py-28"
        >
            <div className="relative mx-auto max-w-7xl px-5 md:px-8">
                {/* ---- Header ---- */}
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                            <span className="text-brand-orange text-[14px]">✦</span> Why Mission
                        </p>
                        <h2 className="mt-5 font-display text-4xl font-medium leading-[1.04] tracking-[-0.02em] text-content sm:text-5xl lg:text-6xl">
                            <SplitWords text="Experience you can test." />
                            <br />
                            <SplitWords
                                text="Growth you can review."
                                className="font-serif text-[1.06em] font-normal italic tracking-normal text-brand-orange"
                            />
                        </h2>
                    </div>
                    <p className="max-w-xs text-sm leading-relaxed text-content-muted md:text-right">
                        Mahbub Alam Mission has supported podcast creators with marketing and audio
                        post-production since 2015 — practical strategy, transparent updates.
                    </p>
                </div>

                {/* ---- Pinned stage: the manifesto fills here ---- */}
                <div
                    ref={pinRef}
                    className="mt-16 lg:mt-0 lg:flex lg:min-h-screen lg:flex-col lg:justify-center"
                >
                    <div className="flex items-center gap-5 border-b border-border-subtle pb-8">
                        <IntegrityStamp />
                        <div>
                            <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                Our Standard
                            </p>
                            <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.01em] text-content sm:text-xl">
                                Professional, platform-conscious support.
                            </p>
                        </div>
                    </div>

                    <p
                        ref={wordsRef}
                        className="mt-10 font- text-2xl font-light leading-[1.38] tracking-[-0.015em] text-content sm:text-3xl lg:text-[2.5rem] lg:leading-[1.32]"
                    >
                        {WORDS.map((word, i) => (
                            <Fragment key={i}>
                                <span
                                    data-mword
                                    className={word.key ? "italic text-brand-orange" : undefined}
                                >
                                    {word.w}
                                </span>{" "}
                            </Fragment>
                        ))}
                    </p>

                    <a
                        href="/#contact"
                        className="group mt-10 inline-flex w-fit items-center gap-2 border border-border-subtle px-7 py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-content transition-colors duration-300 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                    >
                        Plan a responsible campaign
                        <ArrowUpRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                    </a>
                </div>

                {/* ---- Pillars ---- */}
                <div
                    data-pillars
                    className=" grid gap-px overflow-hidden border border-border-subtle bg-border-subtle sm:grid-cols-3"
                >
                    {PILLARS.map((p, i) => (
                        <div
                            key={p.title}
                            data-reveal
                            className="group relative bg-surface p-7 transition-colors duration-300 hover:bg-surface-raised lg:p-9"
                        >
                            {/* Hairline that draws in on hover — the only
                                decoration on these cards. */}
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                            />
                            <span className="font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-content/10 transition-colors duration-300 group-hover:text-brand-orange">
                                0{i + 1}
                            </span>
                            <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.015em] text-content">
                                {p.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-content-muted">
                                {p.detail}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ---- Signature line ---- */}
                <div className="mt-10 flex items-center justify-between border-t border-border-subtle pt-6 font-display text-[10px] font-bold uppercase tracking-[0.25em] text-content-muted">
                    <span>MPG · EST 2015</span>
                    <span className="text-brand-orange">No Bots · No Fakes</span>
                </div>
            </div>
        </section>
    );
}
