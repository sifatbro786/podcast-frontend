// src/components/client/home/WhyMissionSection.jsx
// "The Record". The differentiator — we don't fake charts — is the hero, not
// a card. The honest policy is a giant serif manifesto. On desktop the
// section PINS while scroll fills the words left-to-right, holds a beat once
// complete, then releases. Mobile/reduced-motion: static full text.
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import SplitWords from "../../common/SplitWords";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PILLARS = [
    { title: "Platform-focused", detail: "Apple Podcasts and Spotify expertise" },
    { title: "Review-first", detail: "Test before choosing a longer campaign" },
    { title: "Transparent support", detail: "Clear expectations and progress updates" },
];

const MANIFESTO = [
    { t: "We do not offer" },
    { t: "fake reviews,", key: true },
    { t: "guaranteed chart positions,", key: true },
    { t: "or" },
    { t: "unrealistic promises.", key: true },
    {
        t: "Results depend on your niche, content quality, audience demand, competition, targeting, and campaign duration.",
    },
];

const WORDS = MANIFESTO.flatMap((seg) => seg.t.split(" ").map((w) => ({ w, key: !!seg.key })));

function IntegrityStamp() {
    const ringRef = useRef(null);
    useGSAP(() => {
        if (prefersReduced()) return;
        gsap.to(ringRef.current, {
            rotate: 360,
            duration: 22,
            ease: "none",
            repeat: -1,
            transformOrigin: "center",
        });
    });
    return (
        <div aria-hidden="true" className="relative grid h-24 w-24 shrink-0 place-items-center">
            <svg ref={ringRef} viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                <defs>
                    <path
                        id="stamp-circle"
                        d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    />
                </defs>
                <text className="fill-content-muted text-[9.5px] font-black uppercase tracking-[0.32em]">
                    <textPath href="#stamp-circle">Verified Integrity · Since 2015 ·</textPath>
                </text>
            </svg>
            <span className="grid h-11 w-11 place-items-center">
                <ShieldCheck size={20} className="text-brand-orange" />
            </span>
        </div>
    );
}

export default function WhyMissionSection() {
    const rootRef = useRef(null);
    const pinRef = useRef(null); // the stage that pins
    const manifestoRef = useRef(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(rootRef);
            const words = q("[data-mword]");
            const mm = gsap.matchMedia();

            /* Heading + pillar reveals (both modes, unless reduced) */
            if (!prefersReduced()) {
                gsap.from(q("[data-word]"), {
                    yPercent: 110,
                    duration: 1.1,
                    ease: "power4.out",
                    stagger: 0.03,
                    scrollTrigger: { trigger: rootRef.current, start: "top 80%", once: true },
                });
                gsap.from(q("[data-reveal]"), {
                    y: 34,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: 0.1,
                    scrollTrigger: { trigger: q("[data-pillars]"), start: "top 85%", once: true },
                });
            }

            /* ---------- Desktop: PIN + scroll-fill ----------
               The stage sticks while scroll drives the word fill, holds a beat
               once every word is lit, then unpins and the page continues. */
            mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
                gsap.set(words, { opacity: 0.18 });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: pinRef.current,
                        start: "top top",
                        end: "+=1800", // total pinned scroll — raise = slower
                        pin: true,
                        scrub: 1,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });

                words.forEach((w) => tl.to(w, { opacity: 1, duration: 0.5 }, "<0.2"));
                // Hold beat: text stays fully lit for a stretch before release
                tl.to({}, { duration: 2.4 });
            });

            /* ---------- Mobile / reduced-motion: static full text ---------- */
            mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
                gsap.set(words, { opacity: 1 });
            });

            return () => mm.revert();
        },
        { scope: rootRef },
    );

    return (
        <section
            ref={rootRef}
            id="why-us"
            aria-label="Why Mission and our standard"
            className="relative bg-surface py-10 sm:py-28"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(var(--content) 1px, transparent 1px), linear-gradient(90deg, var(--content) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 72%)",
                }}
            />

            <div className="relative mx-auto max-w-7xl px-5 md:px-8">
                {/* ---- Header ---- */}
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                            <span className="h-2 w-2 rounded-full bg-brand-orange" />
                            Why Mission
                        </p>
                        <h2 className="mt-5 font-serif text-4xl font-black leading-[1.04] tracking-tight text-content sm:text-5xl lg:text-6xl">
                            <SplitWords text="Experience you can test." />
                            <br />
                            <SplitWords
                                text="Growth you can review."
                                className="font-serif font-medium italic tracking-normal text-brand-orange"
                            />
                        </h2>
                    </div>
                    <p className="max-w-xs text-sm leading-relaxed text-content-muted md:text-right">
                        Mahbub Alam Mission has supported podcast creators with marketing and audio
                        post-production since 2015 — practical strategy, transparent updates.
                    </p>
                </div>

                {/* ---- Pinned stage: the manifesto fills here ---- */}
                <div
                    ref={pinRef}
                    className="mt-16 lg:mt-0 lg:flex lg:min-h-screen lg:flex-col lg:justify-center"
                >
                    <div ref={manifestoRef}>
                        <div className="flex items-center gap-4">
                            <IntegrityStamp />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                    Our Standard
                                </p>
                                <p className="mt-1 font-serif text-lg font-black text-content sm:text-xl">
                                    Professional, platform-conscious support.
                                </p>
                            </div>
                        </div>

                        <p className="mt-8 font-serif text-justify text-2xl font-medium leading-[1.35] tracking-tight text-content sm:text-3xl lg:text-[2.6rem] lg:leading-[1.3]">
                            {WORDS.map((word, i) => (
                                <span
                                    key={i}
                                    data-mword
                                    className={`inline-block ${
                                        word.key ? "italic text-brand-orange" : "text-content"
                                    }`}
                                >
                                    {word.w}
                                    {"\u00A0"}
                                </span>
                            ))}
                        </p>

                        <a
                            href="/#contact"
                            className="group mt-10 inline-flex items-center gap-2 border border-border-subtle px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-content transition-colors duration-300 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                        >
                            Plan a responsible campaign
                            <ArrowUpRight
                                size={16}
                                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                        </a>
                    </div>
                </div>

                {/* ---- Pillars ---- */}
                <div
                    data-pillars
                    className="mt-4 sm:mt-8 grid gap-px overflow-hidden border border-border-subtle bg-border-subtle sm:grid-cols-3"
                >
                    {PILLARS.map((p, i) => (
                        <div
                            key={p.title}
                            data-reveal
                            className="group bg-surface p-7 transition-colors duration-300 hover:bg-surface-raised/60 lg:p-9"
                        >
                            <span className="font-serif text-5xl font-black leading-none tracking-tighter text-content/10 transition-colors duration-300 group-hover:text-brand-orange">
                                0{i + 1}
                            </span>
                            <h3 className="mt-6 font-serif text-xl font-black tracking-tight text-content">
                                {p.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-content-muted">
                                {p.detail}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ---- Signature line ---- */}
                <div className="mt-10 flex items-center justify-between border-t border-border-subtle pt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-content-muted">
                    <span>MPG · EST 2015</span>
                    <span className="text-brand-orange">No Bots · No Fakes</span>
                </div>
            </div>
        </section>
    );
}
