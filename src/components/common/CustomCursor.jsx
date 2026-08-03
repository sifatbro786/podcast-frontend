import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function CustomCursor() {
    const cursorRef = useRef(null);
    const dotRef = useRef(null);

    useGSAP(() => {
        const cursor = cursorRef.current;
        const dot = dotRef.current;

        // Mouse Move Animation (Smooth Follow)
        const onMouseMove = (e) => {
            const { clientX: x, clientY: y } = e;

            // Outer Glowing Ring Follows with Delay
            gsap.to(cursor, {
                x: x - 20,
                y: y - 20,
                duration: 0.5,
                ease: "power3.out",
            });

            // Inner Small Dot Follows Instantly
            gsap.to(dot, {
                x: x - 4,
                y: y - 4,
                duration: 0.1,
            });
        };

        // Hover Scaling Effect for Interactive Elements
        const onMouseEnterLink = () => {
            gsap.to(cursor, {
                scale: 2.2,
                backgroundColor: "rgba(255, 87, 34, 0.15)", // Subtle Brand Orange Glow
                borderColor: "#FF5722",
                duration: 0.3,
            });
        };

        const onMouseLeaveLink = () => {
            gsap.to(cursor, {
                scale: 1,
                backgroundColor: "transparent",
                borderColor: "rgba(255, 87, 34, 0.6)",
                duration: 0.3,
            });
        };

        window.addEventListener("mousemove", onMouseMove);

        // Dynamic Hover Attach to Buttons & Links
        const interactiveElements = document.querySelectorAll("a, button, [data-cursor-hover]");
        interactiveElements.forEach((el) => {
            el.addEventListener("mouseenter", onMouseEnterLink);
            el.addEventListener("mouseleave", onMouseLeaveLink);
        });

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    return (
        <>
            {/* Outer Glow Circle */}
            <div
                ref={cursorRef}
                className="pointer-events-none fixed top-0 left-0 z-9999 h-10 w-10 rounded-full border border-brand-orange/60 transition-opacity duration-300 hidden md:block"
            />
            {/* Inner Dot */}
            <div
                ref={dotRef}
                className="pointer-events-none fixed top-0 left-0 z-9999 h-2 w-2 rounded-full bg-brand-orange transition-opacity duration-300 hidden md:block"
            />
        </>
    );
}
