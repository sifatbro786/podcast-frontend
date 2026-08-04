// src/components/common/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Menu, Moon, Radio, Sun, X } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../context/AuthContext";

gsap.registerPlugin(useGSAP);

const NAV = [
    { label: "Services", href: "/#services" },
    { label: "How It Works", href: "/#process" },
    { label: "Guest Booking", href: "/#guest-booking" },
    { label: "Why Us", href: "/#why-us" },
    { label: "Contact", href: "/#contact" },
];

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/*  Micro-animation helpers                                            */
/* ------------------------------------------------------------------ */

/** Magnetic pull on pointer devices only — no-op on touch. */
function MagneticCTA({ children, className = "", ...props }) {
    const ref = useRef(null);

    const onMove = (e) => {
        if (prefersReduced()) return;
        const r = ref.current.getBoundingClientRect();
        gsap.to(ref.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.28,
            y: (e.clientY - r.top - r.height / 2) * 0.36,
            duration: 0.4,
            ease: "power3.out",
        });
    };
    const onLeave = () =>
        gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.35)" });

    return (
        <a ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className} {...props}>
            {children}
        </a>
    );
}

/** Sun/Moon crossfade + rotation, driven by the shared theme context. */
function ThemeToggle() {
    const { isDark, toggle } = useTheme();
    const iconRef = useRef(null);

    const handleToggle = () => {
        if (prefersReduced()) return toggle();
        gsap.timeline()
            .to(iconRef.current, {
                rotate: 90,
                scale: 0.4,
                opacity: 0,
                duration: 0.18,
                ease: "power2.in",
                onComplete: toggle,
            })
            .to(iconRef.current, {
                rotate: 0,
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "back.out(2.5)",
            });
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-10 w-10 place-items-center border border-border-subtle text-content transition-colors hover:border-brand-orange hover:text-brand-orange"
        >
            <span ref={iconRef} className="grid place-items-center">
                {isDark ? <Moon size={17} /> : <Sun size={17} />}
            </span>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export default function Navbar() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);
    const innerRef = useRef(null);
    const overlayRef = useRef(null);
    const menuTl = useRef(null);
    const menuBtnRef = useRef(null);

    /* --- Sticky shrink: 80px → 64px + shadow, tweened once per crossing --- */
    useGSAP(
        () => {
            let scrolled = false;
            const dur = prefersReduced() ? 0 : 0.35;

            const apply = (on) => {
                gsap.to(innerRef.current, {
                    height: on ? 72 : 80,
                    duration: dur,
                    ease: "power3.out",
                });
                gsap.to(headerRef.current, {
                    boxShadow: on ? "0 8px 32px -12px rgba(0,0,0,0.35)" : "0 0 0 0 rgba(0,0,0,0)",
                    duration: dur,
                });
                headerRef.current.dataset.scrolled = on ? "true" : "false";
            };

            const onScroll = () => {
                const next = window.scrollY > 32;
                if (next !== scrolled) {
                    scrolled = next;
                    apply(next);
                }
            };
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
        },
        { scope: headerRef },
    );

    /* --- Mobile overlay timeline --- */
    useGSAP(
        () => {
            const links = overlayRef.current?.querySelectorAll("[data-stagger]");
            if (!links || links.length === 0) return;

            // Timeline
            menuTl.current = gsap
                .timeline({ paused: true, defaults: { ease: "power4.out" } })
                .to(overlayRef.current, {
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", // High compatibility clip-path
                    duration: 0.5,
                })
                .fromTo(
                    links,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.06 },
                    "-=0.2",
                );
        },
        { scope: overlayRef },
    );

    useEffect(() => {
        if (!menuTl.current) return;
        if (open) {
            // Overlay আগে Visual dynamic করুন, তারপর play করুন
            overlayRef.current.style.display = "flex";
            menuTl.current.play();
            document.body.style.overflow = "hidden";
        } else {
            menuTl.current.reverse().then(() => {
                if (overlayRef.current) overlayRef.current.style.display = "none";
            });
            document.body.style.overflow = "";
        }
    }, [open]);

    /* --- Escape closes the drawer, focus returns to the trigger --- */
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                menuBtnRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <header
                ref={headerRef}
                data-scrolled="false"
                className="group/header fixed inset-x-0 top-0 z-50 border-b border-transparent bg-surface-raised/70 backdrop-blur-xl transition-colors duration-300 data-[scrolled=true]:border-border-subtle"
            >
                <div
                    ref={innerRef}
                    className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8"
                >
                    {/* Logo */}
                    <Link
                        to="/"
                        aria-label="Mission Podcast Growth — home"
                        className="group flex items-center gap-2.5 transition-[filter] duration-300 hover:drop-shadow-[0_0_12px_rgba(255,87,34,0.5)]"
                    >
                        <img src="/logo.png" alt="logo" className="h-22 w-22 object-cover" />
                    </Link>

                    {/* Desktop links — dot indicator + center-out underline */}
                    <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
                        {NAV.map((n) => (
                            <a
                                key={n.href}
                                href={n.href}
                                className="group relative flex items-center gap-1.5 text-sm font-bold text-content-muted transition-colors duration-300 hover:text-content"
                            >
                                {/* <span className="h-1.5 w-1.5 scale-0 rounded-full bg-brand-orange transition-transform duration-300 ease-out group-hover:scale-100" /> */}
                                {n.label}
                                <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-brand-orange transition-all duration-300 ease-out group-hover:w-[calc(100%-14px)]" />
                            </a>
                        ))}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="group relative flex items-center gap-1.5 text-sm font-bold text-content-muted transition-colors duration-300 hover:text-content"
                            >
                                Dashboard
                                <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-brand-orange transition-all duration-300 ease-out group-hover:w-[calc(100%-14px)]" />
                            </Link>
                        )}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <MagneticCTA
                            href="/#contact"
                            className="group hidden items-center gap-1.5 bg-brand-orange px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover sm:inline-flex"
                        >
                            Free Podcast Audit
                            <ArrowUpRight
                                size={16}
                                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                        </MagneticCTA>
                        <button
                            ref={menuBtnRef}
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            aria-controls="mobile-menu"
                            aria-label={open ? "Close menu" : "Open menu"}
                            className="grid h-10 w-10 place-items-center border border-border-subtle text-content lg:hidden"
                        >
                            {open ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile overlay — full-screen curtain, editorial type */}
            <div
                ref={overlayRef}
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
                className="fixed inset-0 z-40 hidden flex-col justify-between pt-24 lg:hidden"
                style={{
                    clipPath: "inset(0 0 100% 0)",
                    backgroundColor: "var(--surface, var(--color-dark-bg))",
                }}
            >
                <nav aria-label="Mobile" className="flex flex-col px-6">
                    {NAV.map((n) => (
                        <a
                            key={n.href}
                            href={n.href}
                            data-stagger
                            onClick={() => setOpen(false)}
                            className="group flex items-center justify-between border-b border-border-subtle py-5 text-2xl font-black font-serif uppercase tracking-tight text-content transition-colors hover:text-brand-orange"
                        >
                            {n.label}
                            <ArrowUpRight
                                size={22}
                                className="text-content-muted opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-orange group-hover:opacity-100"
                            />
                        </a>
                    ))}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            data-stagger
                            onClick={() => setOpen(false)}
                            className="group flex items-center justify-between border-b border-border-subtle py-5 text-2xl font-black font-serif uppercase tracking-tight text-content transition-colors hover:text-brand-orange"
                        >
                            Dashboard
                            <ArrowUpRight
                                size={22}
                                className="text-content-muted opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-orange group-hover:opacity-100"
                            />
                        </Link>
                    )}
                </nav>

                <div data-stagger className="px-6 pb-10">
                    <a
                        href="/#contact"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-2 bg-brand-orange px-6 py-4 text-sm font-bold uppercase tracking-widest text-white"
                    >
                        Free Review <ArrowUpRight size={16} />
                    </a>
                    <p className="mt-6 flex items-center gap-2 text-xs justify-center font-semibold text-content-muted">
                        <Radio size={14} className="text-brand-orange" />
                        Real charts. Real listeners. No bots.
                    </p>
                </div>
            </div>
        </>
    );
}
