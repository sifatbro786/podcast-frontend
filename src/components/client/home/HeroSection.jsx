/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/immutability */
// src/components/client/home/HeroSection.jsx
// v4 — "Live Stage". Theme-aware (dark default / .light override), fits 100svh
// past the fixed navbar, human-scale editorial type, and a full-bleed SignalStrip
// that reacts to a real audio preview via the Web Audio API.
//
// Fixes in this pass:
//  • Descenders (p/y/g) no longer clipped by the reveal mask — inner block is
//    padded (pb) so glyph tails live inside the overflow-hidden region.
//  • Callback refs use block bodies (React 19 treats a returned value as a
//    cleanup fn) and no arrow returns an assignment.
//  • Full light-mode support via the [.light_&] variant; the canvas reads the
//    theme class through a MutationObserver so it re-themes on toggle.
//  • Load/scroll/audio animations run on mobile; only pointer-magnetism is
//    gated to hover-capable devices.
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, AudioLines, Pause, Play } from "lucide-react";

gsap.registerPlugin(useGSAP);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const isLightTheme = () =>
    typeof document !== "undefined" && document.documentElement.classList.contains("light");

/**
 * Swap with the client's licensed preview clip before launch. Must be same-origin
 * (or CORS-enabled — crossOrigin="anonymous" is set below) for the analyser to
 * read real amplitude; otherwise the simulated pulse keeps the wave alive.
 */
const HERO_AUDIO = "/audio/hero-preview.mp3";

/**
 * Optional. Set to null to fall back to the SVG waveform badge without breaking
 * layout symmetry.
 */
const HERO_IMG =
    "https://images.unsplash.com/photo-1607805074778-eeb1aafe3641?w=480&auto=format&fit=crop&q=60";

/* ------------------------------------------------------------------ */
/*  Full-bleed audio-reactive signal strip (background layer).         */
/* ------------------------------------------------------------------ */

function SignalStrip({ viz }) {
    const canvasRef = useRef(null);
    const mouse = useRef({ x: -9999, active: false });

    useGSAP(
        () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            let width = 0;
            let height = 0;
            let bars = 0;
            let t = 0;
            let light = isLightTheme();

            const resize = () => {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                width = canvas.clientWidth;
                height = canvas.clientHeight;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                bars = Math.max(56, Math.floor(width / 9));
            };
            resize();

            const draw = () => {
                const V = viz.current;

                // 1. Live audio energy (0..1) when the analyser is wired.
                let audioLevel = 0;
                if (V.playing && V.analyser && V.freq) {
                    V.analyser.getByteFrequencyData(V.freq);
                    let sum = 0;
                    for (let k = 0; k < V.freq.length; k++) sum += V.freq[k];
                    audioLevel = sum / (V.freq.length * 255);
                }

                // 2. Simulated fallback pulse (covers 404 / CORS-zeroed data).
                V.sim += ((V.playing ? 1 : 0) - V.sim) * 0.06;
                const simPulse = (0.4 + 0.6 * Math.abs(Math.sin(t * 3.1))) * V.sim;
                const energy = Math.max(audioLevel, simPulse * 0.55);

                // Shared smoothed level for the player's EQ indicator to read.
                V.level += (energy - V.level) * 0.2;

                ctx.clearRect(0, 0, width, height);
                const gap = 3;
                const bw = width / bars - gap;
                const mid = height / 2;
                const idle = 0.34;

                // Idle bar colour differs per theme; energy always drives to orange.
                const baseR = light ? 100 : 148;
                const baseG = light ? 116 : 163;
                const baseB = light ? 139 : 184;

                for (let i = 0; i < bars; i++) {
                    const x = i * (bw + gap);
                    const s1 = Math.sin(t * 1.4 + i * 0.3);
                    const s2 = Math.sin(t * 0.7 + i * 0.11) * 0.5;
                    const s3 = Math.sin(t * 2.3 - i * 0.44) * 0.25;
                    const ambient = ((s1 + s2 + s3 + 1.8) / 3.55) * idle;

                    let amp = ambient;
                    if (V.playing) {
                        const bin = V.freq
                            ? V.freq[Math.floor((i / bars) * V.freq.length)] / 255
                            : 0;
                        amp = ambient * 0.5 + Math.max(bin, energy) * 1.05;
                    }

                    // Cursor swell — a flashlight of orange following the pointer.
                    let influence = 0;
                    if (mouse.current.active) {
                        const dx = x + bw / 2 - mouse.current.x;
                        influence = Math.exp(-(dx * dx) / (2 * 110 * 110));
                        amp = Math.min(1.15, amp + influence * 0.85);
                    }

                    const h = Math.max(2, amp * mid * 0.92);
                    const hot = Math.min(1, energy * 1.2 + influence);
                    const alpha = (light ? 0.16 : 0.12) + amp * 0.22 + influence * 0.55;

                    const r = Math.round(baseR + (255 - baseR) * hot);
                    const g = Math.round(baseG + (87 - baseG) * hot);
                    const b = Math.round(baseB + (34 - baseB) * hot);
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.fillRect(x, mid - h, bw, h * 2);
                }

                // Baseline brightens with energy so the signal reads as live.
                ctx.fillStyle = `rgba(255, 87, 34, ${0.28 + V.level * 0.5})`;
                ctx.fillRect(0, mid - 0.5, width, 1);
                t += 0.016;
            };

            if (prefersReduced()) draw();
            else gsap.ticker.add(draw);

            // Canvas is behind z-10 content — listen on window, gate by bounds.
            const onMove = (e) => {
                const rect = canvas.getBoundingClientRect();
                const inside =
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom;
                if (inside) {
                    mouse.current = { x: e.clientX - rect.left, active: true };
                } else {
                    mouse.current = { x: -9999, active: false };
                }
            };
            const onLeave = () => {
                mouse.current = { x: -9999, active: false };
            };

            if (canHover()) {
                window.addEventListener("pointermove", onMove, { passive: true });
                window.addEventListener("pointerleave", onLeave);
            }

            const ro = new ResizeObserver(resize);
            ro.observe(canvas);

            // Re-theme live when the .light class flips on <html>.
            const themeObserver = new MutationObserver(() => {
                light = isLightTheme();
                if (prefersReduced()) draw();
            });
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class"],
            });

            return () => {
                gsap.ticker.remove(draw);
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerleave", onLeave);
                ro.disconnect();
                themeObserver.disconnect();
            };
        },
        { scope: canvasRef, dependencies: [viz] },
    );

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="h-full w-full"
            style={{
                maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
                WebkitMaskImage:
                    "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
            }}
        />
    );
}

/* ------------------------------------------------------------------ */
/*  Audio preview pill — the toggle that drives the wave.              */
/* ------------------------------------------------------------------ */

function AudioPreview({ viz, className = "" }) {
    const audioRef = useRef(null);
    const ctxRef = useRef(null);
    const srcRef = useRef(null); // MediaElementSource — created exactly once
    const barsRef = useRef([]);
    const [playing, setPlaying] = useState(false);
    const [live, setLive] = useState(true); // false → simulation-only fallback

    // Build the Web Audio graph lazily, inside the user gesture, once.
    const ensureGraph = useCallback(() => {
        if (srcRef.current) return true;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC || !audioRef.current) return false;
        try {
            const ctx = new AC();
            const src = ctx.createMediaElementSource(audioRef.current);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.82;
            src.connect(analyser);
            analyser.connect(ctx.destination);
            ctxRef.current = ctx;
            srcRef.current = src;
            viz.current.analyser = analyser;
            viz.current.freq = new Uint8Array(analyser.frequencyBinCount);
            return true;
        } catch {
            return false; // fall through to simulation
        }
    }, [viz]);

    const start = useCallback(async () => {
        const el = audioRef.current;
        if (live && el) {
            ensureGraph();
            try {
                await ctxRef.current?.resume?.();
                await el.play();
            } catch {
                // Autoplay policy / decode failure → keep the visual alive via sim.
            }
        }
        viz.current.playing = true;
        setPlaying(true);
    }, [live, ensureGraph, viz]);

    const stop = useCallback(() => {
        audioRef.current?.pause?.();
        viz.current.playing = false;
        setPlaying(false);
    }, [viz]);

    const toggle = useCallback(() => {
        if (playing) stop();
        else start();
    }, [playing, start, stop]);

    // EQ indicator reads the shared level the strip writes each frame.
    useEffect(() => {
        let raf;
        const tick = () => {
            const lvl = viz.current.level || 0;
            for (let i = 0; i < barsRef.current.length; i++) {
                const el = barsRef.current[i];
                if (!el) continue;
                const base = playing ? 0.32 : 0.16;
                const s = Math.min(1, base + lvl * (0.85 + i * 0.28));
                el.style.transform = `scaleY(${s.toFixed(3)})`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [playing, viz]);

    // Teardown: close context, null the shared handles.
    useEffect(() => {
        return () => {
            try {
                ctxRef.current?.close?.();
            } catch {
                /* already closed */
            }
            viz.current.playing = false;
            viz.current.analyser = null;
            viz.current.freq = null;
        };
    }, [viz]);

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={toggle}
                aria-pressed={playing}
                aria-label={playing ? "Pause audio preview" : "Play audio preview"}
                className="group inline-flex w-full items-center gap-3 rounded-full border border-white/15 bg-white/4 py-2 pl-2 pr-5 backdrop-blur-sm transition-colors hover:border-brand-orange/60 hover:bg-white/[0.07] sm:w-auto in-[.light]:border-slate-900/15 in-[.light]:bg-slate-900/3 in-[.light]:hover:bg-slate-900/6"
            >
                <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${
                        playing
                            ? "bg-brand-orange text-white"
                            : "bg-white/10 text-white group-hover:bg-brand-orange group-hover:text-white in-[.light]:bg-slate-900/10 in-[.light]:text-slate-900 in-[.light]:group-hover:text-white"
                    }`}
                >
                    {playing ? (
                        <Pause size={15} fill="currentColor" />
                    ) : (
                        <Play size={15} fill="currentColor" className="translate-x-px" />
                    )}
                </span>

                {/* Live EQ indicator — three bars pulsing off the shared level */}
                <span aria-hidden="true" className="flex h-4 items-end gap-0.75">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            ref={(el) => {
                                barsRef.current[i] = el;
                            }}
                            className="w-0.75 origin-bottom rounded-full bg-brand-orange"
                            style={{ height: "100%", transform: "scaleY(0.16)" }}
                        />
                    ))}
                </span>

                <span className="text-left leading-tight">
                    <span className="block text-[13px] font-bold text-white in-[.light]:text-slate-900">
                        {playing ? "Live wave" : "Preview audio"}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 in-[.light]:text-slate-500">
                        {live ? "30-sec sample" : "Waveform demo"}
                    </span>
                </span>
            </button>

            {live && (
                <audio
                    ref={audioRef}
                    src={HERO_AUDIO}
                    preload="none"
                    crossOrigin="anonymous"
                    onEnded={stop}
                    onError={() => {
                        setLive(false);
                        stop();
                    }}
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Optional hero media — framed photo, or SVG waveform fallback.      */
/* ------------------------------------------------------------------ */

function HeroBadge({ image }) {
    return (
        <div
            data-fade
            className="relative w-full max-w-60 overflow-hidden rounded-xl border border-white/12 bg-white/3 p-2 backdrop-blur-sm lg:max-w-[16rem] in-[.light]:border-slate-900/12 in-[.light]:bg-slate-900/3"
        >
            <div className="relative aspect-5/4 overflow-hidden rounded-lg bg-slate-900 in-[.light]:bg-slate-200">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        loading="eager"
                        fetchPriority="high"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                        className="h-full w-full object-cover opacity-90 filter-[grayscale(0.35)_contrast(1.05)]"
                    />
                ) : (
                    <svg
                        viewBox="0 0 200 160"
                        preserveAspectRatio="none"
                        className="h-full w-full"
                        aria-hidden="true"
                    >
                        {Array.from({ length: 26 }).map((_, i) => {
                            const h = 18 + Math.abs(Math.sin(i * 0.9)) * 108;
                            return (
                                <rect
                                    key={i}
                                    x={i * 7.6 + 4}
                                    y={80 - h / 2}
                                    width="4"
                                    height={h}
                                    rx="2"
                                    fill={i % 4 === 0 ? "#FF5722" : "#334155"}
                                />
                            );
                        })}
                    </svg>
                )}
                <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#020617]/70 via-transparent to-transparent in-[.light]:from-white/70" />
            </div>

            <div className="flex items-center justify-between px-1 pt-2 pb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 in-[.light]:text-slate-500">
                    Now charting
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-brand-orange">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute h-full w-full animate-ping rounded-full bg-brand-orange opacity-70" />
                        <span className="relative h-1.5 w-1.5 rounded-full bg-brand-orange" />
                    </span>
                    Top 50
                </span>
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

    // Shared visualiser bus between the audio pill and the background strip.
    const viz = useRef({ playing: false, analyser: null, freq: null, level: 0, sim: 0 });

    useGSAP(
        () => {
            if (prefersReduced()) return;
            const q = gsap.utils.selector(rootRef);

            gsap.timeline({ defaults: { ease: "power4.out" } })
                .from(q("[data-line]"), { yPercent: 118, duration: 1.15, stagger: 0.1 })
                .from(
                    q("[data-fade]"),
                    { y: 22, opacity: 0, duration: 0.7, stagger: 0.08 },
                    "-=0.6",
                )
                .from(q("[data-strip]"), { opacity: 0, duration: 1 }, "-=0.8");
        },
        { scope: rootRef },
    );

    /* Magnetic primary CTA + press feedback (pointer devices only) */
    const onCtaMove = useCallback((e) => {
        if (!canHover() || prefersReduced()) return;
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
            className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#020617] in-[.light]:bg-light-border"
        >
            {/* ---- Background stack: metallic gradient → live strip → scrim ---- */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_75%_at_50%_-10%,#0b1220_0%,transparent_60%),linear-gradient(180deg,#0b1220_0%,#020617_100%)] in-[.light]:bg-[radial-gradient(120%_75%_at_50%_-10%,#ffffff_0%,transparent_60%),linear-gradient(180deg,#f1f5f9_0%,#e2e8f0_100%)]"
            />
            <div
                data-strip
                className="absolute inset-0 -z-10 opacity-[0.55] in-[.light]:opacity-[0.5]"
            >
                <SignalStrip viz={viz} />
            </div>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_46%_at_46%_42%,rgba(2,6,23,0.82)_0%,transparent_72%)] in-[.light]:bg-[radial-gradient(58%_46%_at_46%_42%,rgba(241,245,249,0.88)_0%,transparent_72%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-[#020617] to-transparent in-[.light]:from-light-border"
            />

            {/* ---- Content: cleared past the fixed navbar, vertically centred ---- */}
            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-12 pt-10 md:px-10">
                {/* Eyebrow */}
                <div
                    data-fade
                    className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400 sm:text-[11px] in-[.light]:text-slate-500"
                >
                    <p className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                            <span className="relative h-2 w-2 rounded-full bg-brand-orange" />
                        </span>
                        Live transmission
                    </p>
                    <p className="hidden sm:block">Apple &amp; Spotify growth</p>
                </div>

                {/* Headline — human-scale display type, Instrument Serif accent.
                    Inner blocks are padded (pb) so descenders clear the reveal mask. */}
                <h1 className="mt-7 font-serif font-extrabold leading-[1.05] tracking-[-0.02em] text-white lg:mt-9 in-[.light]:text-slate-900">
                    <span className="block overflow-hidden">
                        <span
                            data-line
                            className="block pb-[0.22em] text-[clamp(2rem,5.4vw,3.75rem)]"
                        >
                            Turn your podcast into
                        </span>
                    </span>
                    <span className="block overflow-hidden">
                        <span
                            data-line
                            className="block pb-[0.22em] text-[clamp(2rem,5.4vw,3.75rem)]"
                        >
                            a show people{" "}
                            <span className="font-instrument text-[1.05em] font-normal italic tracking-normal text-brand-orange">
                                discover.
                            </span>
                        </span>
                    </span>
                </h1>

                {/* Sub + actions + optional media — asymmetric two-column */}
                <div className="mt-8 grid items-end gap-x-12 gap-y-8 lg:mt-10 lg:grid-cols-[1fr_auto]">
                    <div className="max-w-xl">
                        <p
                            data-fade
                            className="text-base leading-relaxed text-slate-300 sm:text-[17px] in-[.light]:text-slate-600"
                        >
                            Strategic promotion for Apple Podcasts and Spotify built to lift
                            visibility, attract relevant listeners, and support sustainable audience
                            growth.
                        </p>

                        <div
                            data-fade
                            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
                        >
                            <a
                                ref={ctaRef}
                                href="/#contact"
                                onMouseMove={onCtaMove}
                                onMouseLeave={onCtaLeave}
                                onPointerDown={onCtaPress}
                                className="group inline-flex items-center justify-center gap-2 bg-brand-orange px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                            >
                                Start free 3-day test
                                <ArrowUpRight
                                    size={17}
                                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                />
                            </a>
                            <a
                                href="/#process"
                                className="group inline-flex items-center justify-center gap-2 border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:border-brand-orange hover:text-brand-orange in-[.light]:border-slate-900/15 in-[.light]:text-slate-900"
                            >
                                <AudioLines size={16} />
                                How it works
                            </a>
                            <AudioPreview viz={viz} className="sm:ml-1" />
                        </div>
                    </div>

                    {/* Optional media — hidden on small screens to protect the 100svh fit */}
                    <div className="hidden lg:block">
                        <HeroBadge image={HERO_IMG} />
                    </div>
                </div>
            </div>
        </section>
    );
}
