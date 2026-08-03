// src/components/client/home/HeroSection.jsx
// v2 — "Front Page Transmission". The left-copy / right-widget split is gone.
// The headline IS the layout: full-bleed fluid display type with an inline
// duotone photo breaking the type block, a full-width live signal strip
// running underneath, and an infinite stat marquee as the section's floor.
import { useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDown, ArrowUpRight, AudioLines } from "lucide-react";

gsap.registerPlugin(useGSAP);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Swap with client photography before launch — duotone makes any shot fit.
const HERO_IMG =
    "https://images.unsplash.com/photo-1607805074778-eeb1aafe3641?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTV8fHBvZGNhc3R8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop";

const MARQUEE = [
    "10+ Years Scaling Shows",
    "Apple + Spotify Charts",
    "3-Day Free Visibility Test",
    "Real Charts · No Bots",
];

/* ------------------------------------------------------------------ */
/*  Full-width signal strip (canvas) — runs under the headline block.  */
/* ------------------------------------------------------------------ */

function SignalStrip() {
    const canvasRef = useRef(null);
    const mouse = useRef({ x: -9999, active: false });

    useGSAP(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let width = 0;
        let height = 0;
        let bars = 0;
        let t = 0;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            bars = Math.max(48, Math.floor(width / 8));
        };
        resize();

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            const gap = 2;
            const bw = width / bars - gap;
            const mid = height / 2;

            for (let i = 0; i < bars; i++) {
                const x = i * (bw + gap);
                const s1 = Math.sin(t * 1.4 + i * 0.3);
                const s2 = Math.sin(t * 0.7 + i * 0.11) * 0.5;
                const s3 = Math.sin(t * 2.3 - i * 0.44) * 0.25;
                let amp = (s1 + s2 + s3 + 1.8) / 3.55;

                let influence = 0;
                if (mouse.current.active) {
                    const dist = Math.abs(x + bw / 2 - mouse.current.x);
                    influence = Math.exp(-(dist * dist) / (2 * 90 * 90));
                    amp = Math.min(1, amp + influence * 0.9);
                }

                const h = Math.max(2, amp * mid * 0.9);
                const alpha = 0.18 + influence * 0.7 + amp * 0.1;
                ctx.fillStyle =
                    influence > 0.08
                        ? `rgba(255, 87, 34, ${alpha})`
                        : `rgba(148, 163, 184, ${alpha})`;
                ctx.fillRect(x, mid - h, bw, h * 2);
            }

            ctx.fillStyle = "rgba(255, 87, 34, 0.45)";
            ctx.fillRect(0, mid - 0.5, width, 1);
            t += 0.016;
        };

        if (prefersReduced()) draw();
        else gsap.ticker.add(draw);

        const onMove = (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.current = { x: e.clientX - r.left, active: true };
        };
        const onLeave = () => (mouse.current = { x: -9999, active: false });
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerleave", onLeave);

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        return () => {
            gsap.ticker.remove(draw);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerleave", onLeave);
            ro.disconnect();
        };
    });

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="h-full w-full"
            style={{
                maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            }}
        />
    );
}

/* ------------------------------------------------------------------ */
/*  Infinite stat marquee — the section's floor.                       */
/* ------------------------------------------------------------------ */

function StatMarquee() {
    const trackRef = useRef(null);
    const tween = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            tween.current = gsap.to(trackRef.current, {
                xPercent: -50,
                ease: "none",
                duration: 26,
                repeat: -1,
            });
        },
        { scope: trackRef },
    );

    // Slow to a crawl under the cursor — readable, never frozen
    const slow = () => tween.current && gsap.to(tween.current, { timeScale: 0.15, duration: 0.5 });
    const resume = () => tween.current && gsap.to(tween.current, { timeScale: 1, duration: 0.5 });

    const items = (hidden) => (
        <div aria-hidden={hidden} className="flex shrink-0 items-center">
            {MARQUEE.map((m) => (
                <span key={m} className="flex items-center">
                    <span className="whitespace-nowrap px-8 text-sm font-black uppercase tracking-[0.2em] text-content">
                        {m}
                    </span>
                    <span className="text-brand-orange">✦</span>
                </span>
            ))}
        </div>
    );

    return (
        <div
            onMouseEnter={slow}
            onMouseLeave={resume}
            className="overflow-hidden border-y border-border-subtle py-4"
        >
            <div ref={trackRef} className="flex w-max">
                {items(false)}
                {items(true)}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export default function HeroSection() {
    const rootRef = useRef(null);
    const ctaRef = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);

            gsap.timeline({ defaults: { ease: "power4.out" } })
                .from(q("[data-line]"), {
                    yPercent: 115,
                    duration: 1.3,
                    stagger: 0.12,
                })
                .from(
                    q("[data-photo]"),
                    { clipPath: "inset(0 100% 0 0)", duration: 1, ease: "power3.inOut" },
                    "-=1",
                )
                .from(q("[data-fade]"), { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, "-=0.7")
                .from(q("[data-strip]"), { opacity: 0, duration: 0.9 }, "-=0.5");
        },
        { scope: rootRef },
    );

    /* Magnetic primary CTA + press feedback */
    const onCtaMove = useCallback((e) => {
        if (prefersReduced()) return;
        const r = ctaRef.current.getBoundingClientRect();
        gsap.to(ctaRef.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.3,
            y: (e.clientY - r.top - r.height / 2) * 0.38,
            duration: 0.4,
            ease: "power3.out",
        });
    }, []);
    const onCtaLeave = useCallback(() => {
        gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.35)" });
    }, []);
    const onCtaPress = useCallback(() => {
        if (prefersReduced()) return;
        gsap.timeline()
            .to(ctaRef.current, { scale: 0.93, duration: 0.1, ease: "power2.in" })
            .to(ctaRef.current, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    }, []);

    return (
        <section
            ref={rootRef}
            aria-label="Podcast growth agency introduction"
            className="relative overflow-hidden bg-surface"
        >
            <div className="mx-auto max-w-7xl px-5 pt-10 md:px-10 lg:pt-20">
                {/* ---- Top meta row: status left, brand line right ---- */}
                <div
                    data-fade
                    className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-content-muted sm:text-[11px]"
                >
                    <p className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                            <span className="relative h-2 w-2 rounded-full bg-brand-orange" />
                        </span>
                        Live Transmission
                    </p>
                    <p className="hidden sm:block">Apple &amp; Spotify Growth</p>
                </div>

                {/* ---- The headline IS the layout ---- */}
                <h1 className="mt-10 font-serif font-black leading-[0.95] tracking-tight text-content">
                    {/* Line 1 */}
                    <span className="block overflow-hidden">
                        <span
                            data-line
                            className="block text-[clamp(2.8rem,8.5vw,7.5rem)] uppercase"
                        >
                            Turn your podcast
                        </span>
                    </span>

                    {/* Line 2 — inline duotone photo breaks the type block */}
                    <span className=" overflow-hidden z-100">
                        <span
                            data-line
                            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[clamp(2.8rem,8.5vw,7.5rem)] uppercase"
                        >
                            into a show
                            <span
                                data-photo
                                className="relative hidden h-[1.5em] w-[2.5em] align-middle sm:inline-block -rotate-30 z-50 -mt-50"
                            >
                                <img
                                    src={HERO_IMG}
                                    alt=""
                                    loading="eager"
                                    fetchPriority="high"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                    className="h-full w-full object-cover"
                                />
                            </span>
                        </span>
                    </span>

                    {/* Line 3 — serif italic, pushed right: the editorial break */}
                    <span className="block overflow-hidden">
                        <span
                            data-line
                            className="block pl-0 font-serif text-[clamp(3rem,9.5vw,8.5rem)] font-medium italic normal-case tracking-normal text-brand-orange "
                        >
                            people discover.
                        </span>
                    </span>
                </h1>

                {/* ---- Sub + CTAs: asymmetric two-column under the type ---- */}
                <div className="mt-12 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16">
                    <div data-fade className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a
                            ref={ctaRef}
                            href="/#contact"
                            onMouseMove={onCtaMove}
                            onMouseLeave={onCtaLeave}
                            onPointerDown={onCtaPress}
                            className="group inline-flex items-center justify-center gap-2 bg-brand-orange px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                        >
                            Start Free 3 Day Test
                            <ArrowUpRight
                                size={17}
                                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                        </a>
                        <a
                            href="/#process"
                            className="group inline-flex items-center justify-center gap-2 border border-border-subtle px-8 py-4 text-sm font-bold text-content transition-colors hover:border-brand-orange hover:text-brand-orange"
                        >
                            <AudioLines size={16} />
                            How It Works
                            <ArrowDown
                                size={15}
                                className="transition-transform duration-300 group-hover:translate-y-0.5"
                            />
                        </a>
                    </div>
                    <p
                        data-fade
                        className="max-w-md text-base leading-relaxed text-content-muted sm:text-lg lg:ml-auto lg:text-right"
                    >
                        Strategic podcast promotion for Apple Podcasts and Spotify built to improve
                        visibility, attract relevant listeners and support sustainable audience
                        growth.
                    </p>
                </div>
            </div>

            {/* ---- Full-width live signal, edge to edge ---- */}
            <div data-strip className="mt-14 h-28 sm:h-36 lg:mt-16">
                <SignalStrip />
            </div>

            {/* ---- Stat marquee floor ---- */}
            <div data-strip className="mt-2">
                <StatMarquee />
            </div>
        </section>
    );
}
