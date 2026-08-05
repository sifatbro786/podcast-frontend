// src/components/client/home/StatMarquee.jsx
// Extracted from HeroSection so it can sit beneath the hero (or anywhere).
// Fast, continuous, never pausing. Self-contained: owns its data, motion guard,
// and tween. Hardware-accelerated (force3D + will-change) for jank-free looping
// on iOS/Android; edge fade masks so items resolve gracefully at the bounds.
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DEFAULT_ITEMS = [
    "10+ years scaling shows",
    "Apple + Spotify charts",
    "3-day free visibility test",
    "Real charts · no bots",
];

// Rotating separators — a live glowing dot, a sound-wave badge, a star — so the
// rhythm between phrases never reads as a single repeated glyph.
function Separator({ variant }) {
    if (variant === 0) {
        return (
            <span
                aria-hidden="true"
                className="relative mx-1 flex h-2 w-2 items-center justify-center"
            >
                <span className="absolute h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-brand-orange" />
            </span>
        );
    }
    if (variant === 1) {
        return (
            <span aria-hidden="true" className="mx-1 flex items-end gap-0.75">
                {[6, 11, 4, 9].map((h, i) => (
                    <span
                        key={i}
                        className="w-0.75 rounded-full bg-brand-orange/80"
                        style={{ height: `${h}px` }}
                    />
                ))}
            </span>
        );
    }
    return (
        <span
            aria-hidden="true"
            className="mx-1 text-brand-orange drop-shadow-[0_0_8px_rgba(255,87,34,0.55)]"
        >
            ✦
        </span>
    );
}

/**
 * @param {object}   props
 * @param {string[]} [props.items]     Marquee phrases. Defaults to the brand set.
 * @param {number}   [props.duration]  Seconds for one full loop. Default 13.
 * @param {string}   [props.className] Extra classes on the outer wrapper.
 */
export default function StatMarquee({ items = DEFAULT_ITEMS, duration = 13, className = "" }) {
    const trackRef = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            gsap.to(trackRef.current, {
                xPercent: -50,
                ease: "none",
                duration,
                repeat: -1,
                force3D: true,
            });
        },
        { scope: trackRef, dependencies: [duration] },
    );

    // `hidden` marks the duplicated half so screen readers only announce it once.
    const row = (hidden) => (
        <div aria-hidden={hidden} className="flex shrink-0 items-center">
            {items.map((m, i) => (
                <span key={`${m}-${i}`} className="flex items-center">
                    <span
                        className={
                            i % 2 === 0
                                ? "px-8 text-sm font-black tracking-[0.2em] whitespace-nowrap text-content uppercase"
                                : "px-8 text-sm font-black tracking-[0.2em] whitespace-nowrap uppercase text-transparent [-webkit-text-stroke:1px_var(--color-brand-orange)]"
                        }
                    >
                        {m}
                    </span>
                    <Separator variant={i % 3} />
                </span>
            ))}
        </div>
    );

    return (
        <div
            className={`group relative overflow-hidden border-y border-border-subtle bg-surface py-4 ${className}`}
        >
            {/* Ambient brand glow behind the track — subtle glassmorphism wash. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_50%,rgba(255,87,34,0.10)_0%,transparent_70%)] in-[.light]:bg-[radial-gradient(60%_120%_at_50%_50%,rgba(255,87,34,0.07)_0%,transparent_70%)]"
            />
            <div
                ref={trackRef}
                className="flex w-max will-change-transform transform-[translateZ(0)] backface-hidden"
                style={{
                    maskImage:
                        "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                }}
            >
                {row(false)}
                {row(true)}
            </div>
        </div>
    );
}
