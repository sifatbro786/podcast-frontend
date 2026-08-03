/* eslint-disable react-refresh/only-export-components */
// src/components/SmoothScroll.jsx
// Lenis smooth scroll, correctly wired to GSAP ScrollTrigger AND to in-page
// anchor links so nav clicks glide (instead of hard-jumping) and land
// accurately even past pinned sections.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fixed navbar height — anchor targets stop this far below the top.
const NAV_OFFSET = 80;

let lenisSingleton = null;
export const getLenis = () => lenisSingleton;

export default function SmoothScroll({ children }) {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
            smoothWheel: true,
        });
        lenisSingleton = lenis;

        // Drive Lenis from GSAP's ticker (one rAF loop, perfectly in sync)
        const raf = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        // Keep ScrollTrigger's scroll position in lockstep with Lenis
        lenis.on("scroll", ScrollTrigger.update);

        // Recalculate pinned/scrub triggers once everything (incl. fonts,
        // images) has settled — stale measurements are the #1 pin-jump cause.
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        const settleTimer = setTimeout(refresh, 600);

        return () => {
            gsap.ticker.remove(raf);
            lenis.off("scroll", ScrollTrigger.update);
            window.removeEventListener("load", refresh);
            clearTimeout(settleTimer);
            lenis.destroy();
            lenisSingleton = null;
        };
    }, []);

    /* --- Smooth in-page anchor navigation ---
       Intercept clicks on same-page hash links and hand them to Lenis, which
       computes the target's CURRENT position — so it's correct even when
       pinned sections have injected spacer height above it. */
    useEffect(() => {
        const onClick = (e) => {
            const a = e.target.closest('a[href*="#"]');
            if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;

            // Same-route hashes only: "/#process", "#contact", "/current#x"
            const url = new URL(a.href, window.location.origin);
            if (url.pathname !== window.location.pathname) return;

            const id = url.hash;
            if (!id || id === "#") return;
            const target = document.querySelector(id);
            if (!target) return;

            e.preventDefault();
            const lenis = lenisSingleton;
            if (lenis) {
                lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.2 });
            } else {
                target.scrollIntoView({ behavior: "smooth" });
            }
            history.pushState(null, "", id);
        };

        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    /* --- Deep-link on route/hash change (e.g. arriving at /#contact) --- */
    useEffect(() => {
        if (!hash) {
            lenisSingleton?.scrollTo(0, { immediate: true });
            return;
        }
        // Wait a tick so the target section is mounted and measured
        const t = setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) lenisSingleton?.scrollTo(target, { offset: -NAV_OFFSET });
        }, 120);
        return () => clearTimeout(t);
    }, [pathname, hash]);

    return children;
}
