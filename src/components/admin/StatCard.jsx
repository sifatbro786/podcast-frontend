// src/components/admin/StatCard.jsx
// Overview metric: oversized black numeral (font-serif) that counts up on
// mount, a tracked micro-label, and a small EQ motif to echo the brand. Sharp
// hairline card. Guarded — reduced-motion users just see the final value.
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { prefersReduced } from "./adminUtils";

gsap.registerPlugin(useGSAP);

function EqMotif() {
    return (
        <div aria-hidden className="flex h-8 items-end gap-1 opacity-70">
            {[0.4, 0.9, 0.6, 1, 0.5, 0.8].map((h, i) => (
                <span
                    key={i}
                    className="w-1 bg-brand-orange/60"
                    style={{ height: `${h * 100}%` }}
                />
            ))}
        </div>
    );
}

export default function StatCard({ label, value, loading, accent = false }) {
    const numRef = useRef(null);

    useGSAP(
        () => {
            if (loading || value == null || !numRef.current) return;
            if (prefersReduced()) {
                numRef.current.textContent = String(value);
                return;
            }
            const obj = { n: 0 };
            gsap.to(obj, {
                n: value,
                duration: 1.1,
                ease: "power2.out",
                onUpdate: () => {
                    numRef.current.textContent = String(Math.round(obj.n));
                },
            });
        },
        { dependencies: [value, loading] },
    );

    return (
        <div
            className={`relative flex flex-col justify-between gap-6 border border-border-subtle bg-surface-raised p-5 ${
                accent ? "border-l-2 border-l-brand-orange" : ""
            }`}
        >
            <div className="flex items-start justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-content-muted">
                    {label}
                </p>
                <EqMotif />
            </div>
            <div>
                {loading ? (
                    <div className="h-10 w-20 animate-pulse bg-border-subtle/70" />
                ) : (
                    <span
                        ref={numRef}
                        className="block text-5xl font-medium leading-none tracking-tighter text-content tabular-nums"
                    >
                        0
                    </span>
                )}
            </div>
        </div>
    );
}
