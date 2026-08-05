// src/components/client/home/ServicesSection.jsx
// v3 — "Service Index". Editorial full-width rows + cursor-chasing preview on
// desktop, inline clean imagery on touch.
//
// Changes vs v2:
//  • Type system aligned with the hero: Sora display (font-sans) for headings
//    with an Instrument Serif italic accent — no more font-serif + font-black
//    mismatch (Instrument Serif ships one weight, 900 silently fell back).
//  • Images now render clean — no orange multiply, no grayscale, no gradient
//    scrim. The photograph itself is the design decision. Fallback bg still
//    holds layout if a URL 404s.
//  • Mobile motion budget: gsap.matchMedia() splits desktop's elaborate row
//    reveal (line draw + staggered cells) from a single lightweight fade-up on
//    smaller screens. Fewer ScrollTriggers, cheaper timelines, same rhythm.

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import SplitWords from "../../common/SplitWords";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Swap these three URLs with the client's licensed/owned photography before
 * launch — one constant, one place. Shots of hardware (mics, consoles,
 * headphones) work best; clean photography now carries the section's mood.
 */
const SERVICES = [
    {
        index: "01",
        title: "Podcast Growth Campaigns",
        description:
            "Focused campaigns that support listener activity, platform reach, and sustainable audience growth.",
        img: "https://images.pexels.com/photos/6878199/pexels-photo-6878199.jpeg?w=480&auto=format&fit=crop",
        alt: "Broadcast microphone in a recording studio",
    },
    {
        index: "02",
        title: "Apple & Spotify Visibility",
        description:
            "Category research, positioning, episode optimization, and promotion planning for stronger discoverability.",
        img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGfVK6nyxUPX-ePydArnnVQ5FOaY2IfXtgr-MYMpNoutRDQwoxZVNloipk&s=100",
        alt: "Headphones resting on a desk beside a phone playing audio",
    },
    {
        index: "03",
        title: "Audio Post-Production",
        description:
            "Professional editing, noise reduction, mixing, mastering, and publishing support for every episode.",
        img: "https://images.pexels.com/photos/4143420/pexels-photo-4143420.jpeg?w=480&auto=format&fit=crop",
        alt: "Studio mixing console with channel faders",
    },
];

/** Clean image block. No filters, no overlays. The `surface-raised` backdrop
 *  keeps the frame designed if a photo ever fails to load. */
function ServiceImage({ src, alt, className = "" }) {
    return (
        <div className={`relative overflow-hidden bg-surface-raised ${className}`}>
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
                className="h-full w-full object-cover"
            />
        </div>
    );
}

export default function ServicesSection() {
    const rootRef = useRef(null);
    const listRef = useRef(null);
    const previewRef = useRef(null);
    const imgRefs = useRef([]);

    /* --- Cursor-chasing preview (desktop pointer devices only) --- */
    useGSAP(
        () => {
            if (!canHover() || prefersReduced()) return;

            const xTo = gsap.quickTo(previewRef.current, "x", {
                duration: 0.55,
                ease: "power3.out",
            });
            const yTo = gsap.quickTo(previewRef.current, "y", {
                duration: 0.55,
                ease: "power3.out",
            });
            let lastX = 0;

            const onMove = (e) => {
                const r = listRef.current.getBoundingClientRect();
                xTo(e.clientX - r.left);
                yTo(e.clientY - r.top);
                // Velocity → tilt: preview leans into the direction of travel.
                const dx = gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.55);
                gsap.to(previewRef.current, {
                    rotate: dx,
                    duration: 0.5,
                    ease: "power2.out",
                });
                lastX = e.clientX;
            };

            const list = listRef.current;
            list.addEventListener("pointermove", onMove);
            return () => list.removeEventListener("pointermove", onMove);
        },
        { scope: rootRef },
    );

    /* --- Entrance: heading words on all screens; elaborate row reveal on
           desktop, single fade-up on mobile. Fewer ScrollTriggers on small. --- */
    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);

            const mm = gsap.matchMedia();

            mm.add(
                {
                    isDesktop: "(min-width: 1024px)",
                    isMobile: "(max-width: 1023px)",
                },
                (ctx) => {
                    const { isDesktop, isMobile } = ctx.conditions;

                    // Heading word reveal — all screens, slightly quicker on mobile.
                    gsap.from(q("[data-word]"), {
                        yPercent: 110,
                        duration: isMobile ? 0.8 : 1.1,
                        ease: "power4.out",
                        stagger: 0.03,
                        scrollTrigger: {
                            trigger: rootRef.current,
                            start: "top 80%",
                            once: true,
                        },
                    });

                    if (isDesktop) {
                        // Full editorial reveal: hairline draw + staggered cells.
                        q("[data-row]").forEach((row) => {
                            const line = row.querySelector("[data-line]");
                            gsap.timeline({
                                scrollTrigger: { trigger: row, start: "top 88%", once: true },
                                defaults: { ease: "power3.out" },
                            })
                                .from(line, {
                                    scaleX: 0,
                                    transformOrigin: "left",
                                    duration: 0.8,
                                })
                                .from(
                                    row.querySelectorAll("[data-cell]"),
                                    { y: 34, opacity: 0, duration: 0.8, stagger: 0.08 },
                                    "-=0.5",
                                );
                        });
                    } else {
                        // Mobile: one lightweight fade-up per row, one ScrollTrigger.
                        q("[data-row]").forEach((row) => {
                            gsap.from(row, {
                                y: 24,
                                opacity: 0,
                                duration: 0.65,
                                ease: "power3.out",
                                scrollTrigger: { trigger: row, start: "top 90%", once: true },
                            });
                        });
                    }
                },
            );

            return () => mm.revert();
        },
        { scope: rootRef },
    );

    const enter = (i) => {
        if (!canHover() || prefersReduced()) return;
        gsap.to(previewRef.current, {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: "power3.out",
        });
        imgRefs.current.forEach((el, j) => {
            if (el) gsap.to(el, { opacity: j === i ? 1 : 0, duration: 0.35, overwrite: true });
        });
    };

    const leave = () => {
        if (!canHover() || prefersReduced()) return;
        gsap.to(previewRef.current, {
            opacity: 0,
            scale: 0.85,
            duration: 0.35,
            ease: "power2.in",
        });
    };

    return (
        <section
            ref={rootRef}
            aria-label="What we do"
            className="overflow-hidden bg-surface py-15 sm:py-24 sm:pt-30"
        >
            <div className="mx-auto max-w-7xl px-5 md:px-8">
                {/* ---- Header: badge + heading left, subhead pinned right-bottom ---- */}
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                            <span className="text-brand-orange text-[14px]">✦</span> What We Do
                        </p>
                        <h2 className="mt-5 font-sans text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-content sm:text-5xl lg:text-6xl">
                            <SplitWords text="Everything your podcast needs to" />{" "}
                            <SplitWords
                                text="move forward."
                                className="font-serif font-normal tracking-normal text-brand-orange italic"
                            />
                        </h2>
                    </div>
                    <p className="max-w-md pb-2 text-base leading-relaxed text-content-muted lg:text-right">
                        One specialist partner for strategy, visibility, promotion and
                        studio-quality sound.
                    </p>
                </div>

                {/* ---- Service index ---- */}
                <div ref={listRef} onMouseLeave={leave} className="relative mt-16">
                    {/* Cursor-chasing preview — sits above rows, never catches events */}
                    <div
                        ref={previewRef}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 left-0 z-10 hidden h-52 w-72 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:block"
                        style={{ transform: "translate(-50%, -50%) scale(0.85)" }}
                    >
                        {SERVICES.map((s, i) => (
                            <div
                                key={s.index}
                                ref={(el) => {
                                    imgRefs.current[i] = el;
                                }}
                                className="absolute inset-0 opacity-0"
                            >
                                <ServiceImage src={s.img} alt="" className="h-full w-full" />
                            </div>
                        ))}
                    </div>

                    {SERVICES.map((s, i) => (
                        <a
                            key={s.index}
                            href="/#contact"
                            id="services"
                            data-row
                            onMouseEnter={() => enter(i)}
                            aria-label={`${s.title} — discuss my goals`}
                            className="group relative block"
                        >
                            <span
                                data-line
                                className="absolute inset-x-0 top-0 block h-px bg-border-subtle"
                            />
                            <div className="grid items-center gap-x-8 gap-y-5 py-9 sm:grid-cols-[3.5rem_1fr_auto] lg:py-12">
                                {/* Index */}
                                <span
                                    data-cell
                                    className="text-sm font-bold tracking-[0.2em] text-content-muted transition-colors duration-300 group-hover:text-brand-orange"
                                >
                                    {s.index}
                                </span>

                                {/* Title + description */}
                                <div data-cell>
                                    <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-content transition-transform duration-500 ease-out group-hover:translate-x-3 sm:text-3xl lg:text-4xl">
                                        {s.title}
                                    </h3>
                                    <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-content-muted lg:text-base">
                                        {s.description}
                                    </p>

                                    {/* Inline image — mobile/tablet/touch only */}
                                    <ServiceImage
                                        src={s.img}
                                        alt={s.alt}
                                        className="mt-5 h-44 w-full sm:h-52 lg:hidden"
                                    />
                                </div>

                                {/* Action */}
                                <span
                                    data-cell
                                    className="flex items-center gap-3 text-sm font-bold text-content"
                                >
                                    <span className="hidden transition-colors duration-300 group-hover:text-brand-orange sm:inline">
                                        Discuss my goals
                                    </span>
                                    <span className="grid h-11 w-11 place-items-center border border-border-subtle transition-all duration-300 group-hover:border-brand-orange group-hover:bg-brand-orange group-hover:text-white">
                                        <ArrowUpRight
                                            size={17}
                                            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </span>
                            </div>
                        </a>
                    ))}
                    <span className="block h-px bg-border-subtle" />
                </div>
            </div>
        </section>
    );
}
