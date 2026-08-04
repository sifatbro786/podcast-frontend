// src/components/admin/MagneticButton.jsx
// Same magnetic behaviour used across the public site (x/y * 0.3, elastic
// return), extracted for the dashboard's primary actions. Guarded so touch /
// reduced-motion users get a plain button.
import gsap from "gsap";
import { useRef } from "react";
import { prefersReduced } from "./adminUtils";

const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export default function MagneticButton({ children, className = "", ...props }) {
    const ref = useRef(null);

    const onMove = (e) => {
        if (prefersReduced() || !canHover()) return;
        const r = ref.current.getBoundingClientRect();
        gsap.to(ref.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.3,
            y: (e.clientY - r.top - r.height / 2) * 0.4,
            duration: 0.4,
            ease: "power3.out",
        });
    };
    const onLeave = () =>
        gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });

    return (
        <button
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className={className}
            {...props}
        >
            {children}
        </button>
    );
}
