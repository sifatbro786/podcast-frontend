// src/components/common/NotFound.jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowUpRight, RadioTower } from "lucide-react";

gsap.registerPlugin(useGSAP);

const BAR_COUNT = 56;

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * "Signal lost" spectrum: bars play live for a beat, collapse to a flatline
 * from the center out, then occasional random bars spike (dead-channel static).
 */
function FlatlineSpectrum() {
    const ref = useRef(null);

    useGSAP(
        () => {
            const bars = ref.current.children;
            if (prefersReduced()) {
                gsap.set(bars, { scaleY: 0.06 });
                return;
            }

            const tl = gsap.timeline();

            // 1) Live signal
            tl.to(bars, {
                scaleY: () => 0.2 + Math.random() * 0.8,
                duration: 0.4,
                ease: "sine.inOut",
                repeat: 3,
                yoyo: true,
                repeatRefresh: true,
                transformOrigin: "center",
                stagger: { each: 0.015, from: "random" },
            })
                // 2) Signal dies — collapse from center out
                .to(bars, {
                    scaleY: 0.06,
                    duration: 0.5,
                    ease: "power4.in",
                    stagger: { each: 0.012, from: "center" },
                });

            // 3) Dead-channel static: random single-bar spikes, forever
            const spike = () => {
                const bar = bars[Math.floor(Math.random() * bars.length)];
                gsap.timeline()
                    .to(bar, { scaleY: 0.3 + Math.random() * 0.5, duration: 0.08 })
                    .to(bar, { scaleY: 0.06, duration: 0.25, ease: "power2.out" });
                gsap.delayedCall(0.4 + Math.random() * 1.4, spike);
            };
            gsap.delayedCall(2.4, spike);
        },
        { scope: ref },
    );

    return (
        <div ref={ref} aria-hidden="true" className="flex h-16 w-full max-w-md items-center gap-1">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <span
                    key={i}
                    className="h-full flex-1 origin-center bg-brand-orange/60"
                    style={{ transform: "scaleY(0.6)" }}
                />
            ))}
        </div>
    );
}

/**
 * Giant 404 with RGB-split frequency glitch: two offset clones jolt
 * horizontally in short random bursts behind the main figure.
 */
function Glitch404() {
    const ref = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            const [ghostA, ghostB] = ref.current.querySelectorAll("[data-ghost]");

            const burst = () => {
                const amp = 4 + Math.random() * 8;
                gsap.timeline({
                    onComplete: () => gsap.delayedCall(1.2 + Math.random() * 2.4, burst),
                })
                    .set(ghostA, { opacity: 0.7 })
                    .set(ghostB, { opacity: 0.7 })
                    .to(ghostA, { x: -amp, duration: 0.05, repeat: 3, yoyo: true })
                    .to(ghostB, { x: amp, duration: 0.05, repeat: 3, yoyo: true }, "<")
                    .set([ghostA, ghostB], { x: 0, opacity: 0 });
            };
            gsap.delayedCall(0.8, burst);
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className="relative select-none" aria-hidden="true">
            <span
                data-ghost
                className="absolute inset-0 text-[9rem] font-black leading-none tracking-tighter text-brand-orange opacity-0 sm:text-[13rem]"
            >
                404
            </span>
            <span
                data-ghost
                className="absolute inset-0 text-[9rem] font-black leading-none tracking-tighter text-content-muted opacity-0 sm:text-[13rem]"
            >
                404
            </span>
            <span className="relative text-[9rem] font-black leading-none tracking-tighter text-content sm:text-[13rem]">
                404
            </span>
        </div>
    );
}

export default function NotFound() {
    const rootRef = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.from(rootRef.current.querySelectorAll("[data-reveal]"), {
                y: 26,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.09,
                delay: 0.15,
            });
        },
        { scope: rootRef },
    );

    return (
        <main
            ref={rootRef}
            className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-10 text-center text-content"
        >
            {/* Off-air tag */}
            <p
                data-reveal
                className="flex items-center gap-2 border border-border-subtle px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted"
            >
                <RadioTower size={13} className="text-brand-orange" />
                Off Air · Signal Lost
            </p>

            <div data-reveal className="mt-6">
                <Glitch404 />
                <h1 className="sr-only">404 — Page not found</h1>
            </div>

            <div data-reveal className="mt-2 flex justify-center">
                <FlatlineSpectrum />
            </div>

            <h2
                data-reveal
                className="text-2xl font-medium uppercase tracking-tight sm:text-3xl"
            >
                Frequency Offline <span className="text-brand-orange">/</span> Episode Not Found
            </h2>
            <p data-reveal className="mt-3 max-w-md text-sm leading-relaxed text-content-muted">
                The show or page you are looking for has been moved, archived, or never existed in
                our directory.
            </p>

            <div data-reveal className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                    to="/"
                    className="group inline-flex items-center justify-center gap-2 bg-brand-orange px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover"
                >
                    <ArrowLeft
                        size={16}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                    Return to Transmission
                </Link>
                <a
                    href="/#guest-booking"
                    className="group inline-flex items-center justify-center gap-2 border border-border-subtle px-7 py-3.5 text-sm font-bold text-content transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                    Browse Guest Categories
                    <ArrowUpRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                </a>
            </div>
        </main>
    );
}
