/* eslint-disable no-useless-assignment */
/* eslint-disable react-refresh/only-export-components */
// src/components/SmoothScroll.jsx — v3
//
// Lenis smooth scroll wired to GSAP ScrollTrigger. The three things that cause
// pinned-section jump-backs, and how they're handled here:
//
//   1. Browser scroll restoration fires AFTER pins have measured, so the page
//      lands at a scroll position the triggers weren't built for.
//      → history.scrollRestoration = "manual".
//   2. ScrollTrigger's snap/scrollTo writes to window.scrollY directly. If
//      Lenis is mid-flight it ignores that write and keeps animating toward
//      its own stale target — that's the visible "jump back".
//      → adoptExternalScroll() re-seats Lenis whenever the real scroll
//        position diverges from what Lenis thinks it is.
//   3. refresh() recalculates pin spacing; Lenis' cached page height is then
//      stale and it clamps scroll to the old maximum.
//      → lenis.resize() on every ScrollTrigger refresh, and refreshes are
//        deferred while the user is actively scrolling.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fixed navbar height — anchor targets stop this far below the top.
const NAV_OFFSET = 80;

// Expo-out. Long tail, no overshoot — reads as "heavy but frictionless".
const EASE_EXPO_OUT = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// Anything further apart than this and we assume something other than Lenis
// moved the page. 2px absorbs subpixel rounding from window.scrollTo.
const DIVERGENCE_PX = 2;

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenisSingleton = null;
export const getLenis = () => lenisSingleton;

export default function SmoothScroll({ children }) {
    const { pathname, hash } = useLocation();

    /* ------------------------------------------------------------------ */
    /*  Lenis lifecycle + ScrollTrigger sync                               */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        // Reduced motion: no Lenis at all. Native scroll is already smooth
        // enough and ScrollTrigger needs no proxy.
        if (prefersReduced()) {
            ScrollTrigger.config({ ignoreMobileResize: true });
            return undefined;
        }

        // The browser restores scroll position asynchronously on reload,
        // usually after ScrollTrigger has measured. Owning it ourselves
        // removes an entire class of "it jumped on refresh" reports.
        const prevRestoration = history.scrollRestoration;
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";

        // Mobile URL-bar collapse fires resize on every scroll direction
        // change. Without this, pins recalculate mid-gesture.
        ScrollTrigger.config({ ignoreMobileResize: true });

        const lenis = new Lenis({
            duration: 1.1,
            easing: EASE_EXPO_OUT,
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.5,
            // Native touch scrolling. syncTouch:true routes touch through the
            // rAF loop, which costs frames on iOS Safari and fights momentum.
            syncTouch: false,
            gestureOrientation: "vertical",
            // We own the rAF loop below; never let Lenis start its own.
            autoRaf: false,
            // We handle anchors ourselves (see the click interceptor).
            anchors: false,
            // Opt-out hook for modals / independently scrolling panes:
            // <div data-lenis-prevent> is excluded from smoothing.
            prevent: (node) => node.hasAttribute?.("data-lenis-prevent"),
        });
        lenisSingleton = lenis;

        /* ---- One rAF loop: GSAP's ticker drives Lenis ---- */
        const raf = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        // Lag smoothing lets GSAP "skip" time after a stall. With a scrubbed
        // pin that turns into a visible position jump, so it's disabled.
        gsap.ticker.lagSmoothing(0);

        /* ---- Keep ScrollTrigger in lockstep, and track Lenis' position ---- */
        let lenisScroll = window.scrollY;
        const onLenisScroll = ({ animatedScroll }) => {
            lenisScroll = animatedScroll;
            ScrollTrigger.update();
        };
        lenis.on("scroll", onLenisScroll);

        /* ---- Fix #2: adopt scroll positions Lenis didn't produce ----
           ScrollTrigger's snap tween, scrollIntoView, and focus-scroll all
           write straight to window.scrollY. Lenis only absorbs those when it
           is idle; mid-animation it ignores them and finishes its own tween,
           which yanks the page back. Detect the divergence and re-seat. */
        const adoptExternalScroll = () => {
            if (lenis.isScrolling !== "smooth") return;
            const actual = window.scrollY;
            if (Math.abs(actual - lenisScroll) <= DIVERGENCE_PX) return;
            lenisScroll = actual;
            lenis.scrollTo(actual, { immediate: true, force: true, lock: false });
        };
        window.addEventListener("scroll", adoptExternalScroll, { passive: true });

        /* ---- Fix #3: hand Lenis the new page height on every refresh ---- */
        const onRefresh = () => {
            lenis.resize();
            lenisScroll = window.scrollY;
        };
        ScrollTrigger.addEventListener("refresh", onRefresh);

        /* ---- Refresh scheduling ----
           refresh(true) is the "safe" form: if the page is mid-scroll it
           defers until scrolling settles instead of re-measuring under the
           user's finger. */
        let refreshTimer = 0;
        const scheduleRefresh = () => {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => ScrollTrigger.refresh(true), 180);
        };

        // Fonts change line-height, which changes section heights, which
        // invalidates every pin measurement below them.
        if (document.fonts?.ready) {
            document.fonts.ready.then(scheduleRefresh).catch(() => {});
        }
        window.addEventListener("load", scheduleRefresh);

        // Lazy images finishing after first paint are the other common cause
        // of stale measurements. Capture phase — `load` doesn't bubble.
        const onMediaLoad = (e) => {
            const tag = e.target?.tagName;
            if (tag === "IMG" || tag === "VIDEO" || tag === "IFRAME") scheduleRefresh();
        };
        document.addEventListener("load", onMediaLoad, true);

        // Catch-all for content that changes height without a load event.
        let bodyObserver = null;
        if (typeof ResizeObserver !== "undefined") {
            let lastHeight = document.body.scrollHeight;
            bodyObserver = new ResizeObserver(() => {
                const h = document.body.scrollHeight;
                if (Math.abs(h - lastHeight) < 2) return;
                lastHeight = h;
                scheduleRefresh();
            });
            bodyObserver.observe(document.body);
        }

        return () => {
            gsap.ticker.remove(raf);
            gsap.ticker.lagSmoothing(500, 33); // restore GSAP's default
            lenis.off("scroll", onLenisScroll);
            ScrollTrigger.removeEventListener("refresh", onRefresh);
            window.removeEventListener("scroll", adoptExternalScroll);
            window.removeEventListener("load", scheduleRefresh);
            document.removeEventListener("load", onMediaLoad, true);
            bodyObserver?.disconnect();
            clearTimeout(refreshTimer);
            lenis.destroy();
            lenisSingleton = null;
            if ("scrollRestoration" in history) history.scrollRestoration = prevRestoration;
        };
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Smooth in-page anchor navigation                                   */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        const onClick = (e) => {
            // Let the browser handle modified / non-primary clicks.
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (!(e.target instanceof Element)) return;

            const a = e.target.closest('a[href*="#"]');
            if (!a || a.hasAttribute("download") || a.target === "_blank") return;
            if (a.getAttribute("rel")?.includes("external")) return;

            // Same-route hashes only: "/#process", "#contact", "/current#x"
            const url = new URL(a.href, window.location.origin);
            if (url.origin !== window.location.origin) return;
            if (url.pathname !== window.location.pathname) return;

            const id = url.hash;
            if (!id || id === "#") return;

            let target = null;
            try {
                target = document.querySelector(id);
            } catch {
                return; // non-selector-safe hash, e.g. "#2024"
            }
            if (!target) return;

            e.preventDefault();

            const lenis = lenisSingleton;
            if (lenis) {
                lenis.scrollTo(target, {
                    offset: -NAV_OFFSET,
                    duration: 1.2,
                    easing: EASE_EXPO_OUT,
                    // Ignore wheel input mid-flight so a stray trackpad nudge
                    // doesn't strand the scroll halfway through a pinned block.
                    lock: true,
                });
            } else {
                target.scrollIntoView({ behavior: "smooth" });
            }

            if (window.location.hash !== id) history.pushState(null, "", id);
        };

        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Deep links + route changes                                         */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        const lenis = lenisSingleton;

        if (!hash) {
            // New route: reset to the top, then re-measure. Without the
            // refresh, pins created on this page inherit spacer heights from
            // the previous one and every trigger fires at the wrong offset.
            if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
            else window.scrollTo(0, 0);

            const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
            return () => cancelAnimationFrame(raf);
        }

        // Wait a tick so the target section is mounted and measured, and
        // refresh first so the offset accounts for any pin spacers above it.
        const t = setTimeout(() => {
            let target = null;
            try {
                target = document.querySelector(hash);
            } catch {
                return;
            }
            if (!target) return;
            ScrollTrigger.refresh();
            if (lenisSingleton) {
                lenisSingleton.scrollTo(target, {
                    offset: -NAV_OFFSET,
                    easing: EASE_EXPO_OUT,
                });
            } else {
                target.scrollIntoView({ behavior: "smooth" });
            }
        }, 120);

        return () => clearTimeout(t);
    }, [pathname, hash]);

    return children;
}
