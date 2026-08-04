// src/components/client/home/StatMarquee.jsx
// Extracted from HeroSection so it can sit beneath the hero (or anywhere).
// Infinite horizontal scroll that slows to a crawl under the cursor — readable,
// never frozen. Self-contained: owns its data, motion guard, and tween.
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

/**
 * @param {object}   props
 * @param {string[]} [props.items]     Marquee phrases. Defaults to the brand set.
 * @param {number}   [props.duration]  Seconds for one full loop. Default 26.
 * @param {string}   [props.className] Extra classes on the outer wrapper.
 */
export default function StatMarquee({ items = DEFAULT_ITEMS, duration = 26, className = "" }) {
    const trackRef = useRef(null);
    const tween = useRef(null);

    useGSAP(
        () => {
            if (prefersReduced()) return;
            tween.current = gsap.to(trackRef.current, {
                xPercent: -50,
                ease: "none",
                duration,
                repeat: -1,
            });
        },
        { scope: trackRef, dependencies: [duration] },
    );

    const slow = () => tween.current && gsap.to(tween.current, { timeScale: 0.15, duration: 0.5 });
    const resume = () => tween.current && gsap.to(tween.current, { timeScale: 1, duration: 0.5 });

    // `hidden` marks the duplicated half so screen readers only announce it once.
    const row = (hidden) => (
        <div aria-hidden={hidden} className="flex shrink-0 items-center">
            {items.map((m, i) => (
                <span key={`${m}-${i}`} className="flex items-center">
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
            className={`overflow-hidden border-y border-border-subtle bg-surface py-4 ${className}`}
        >
            <div ref={trackRef} className="flex w-max">
                {row(false)}
                {row(true)}
            </div>
        </div>
    );
}
