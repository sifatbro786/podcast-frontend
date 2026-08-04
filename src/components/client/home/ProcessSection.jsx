// src/components/client/home/ProcessSection.jsx
// "The Sequence". Desktop: the section pins; scroll drives one full-focus step
// at a time — image on one side, copy on the other — snapping to each stage
// with a live progress rail. Mobile: a clean vertical reveal (no pin).
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import SplitWords from "../../common/SplitWords";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Swap these with the client's licensed photography before launch. */
const STEPS = [
    {
        n: "01",
        tag: "Discovery",
        title: "Podcast Review",
        description: "We review your show, niche, recent episodes, audience, and growth goals.",
        img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=1200&auto=format&fit=crop",
        alt: "Broadcast microphone in a recording studio",
    },
    {
        n: "02",
        tag: "Trial",
        title: "Free 3-Day Test",
        description: "Evaluate campaign activity and your analytics before choosing a longer plan.",
        img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
        alt: "Headphones resting on a desk beside a phone",
    },
    {
        n: "03",
        tag: "Execution",
        title: "Focused Campaign",
        description: "We run the agreed strategy and share clear progress updates along the way.",
        img: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=1200&auto=format&fit=crop",
        alt: "Studio mixing console with channel faders",
    },
    {
        n: "04",
        tag: "Momentum",
        title: "Review And Scale",
        description: "You review the results before approving any extended campaign.",
        img: "https://images.unsplash.com/photo-1607805074778-eeb1aafe3641?q=80&w=1200&auto=format&fit=crop",
        alt: "Podcaster speaking into a studio microphone",
    },
];

/** Duotone image — grayscale + brand-orange multiply wash. Keeps any photo
 *  inside the palette and working across dark/light. */
function DuoImage({ src, alt, className = "" }) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img
                data-img
                src={src}
                alt={alt}
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = "none")}
                className="h-full w-full object-cover "
            />
            <div className="absolute inset-0 bg-brand-orange/25 mix-blend-multiply" />
            <div className="absolute inset-0 bg-linear-to-t from-surface/40 to-transparent" />
        </div>
    );
}

export default function ProcessSection() {
    const rootRef = useRef(null);
    const stageRef = useRef(null);
    const fillRef = useRef(null); // ← progress bar fill
    const counterRef = useRef(null); // ← step counter

    useGSAP(
        () => {
            const q = gsap.utils.selector(rootRef);
            const steps = q("[data-step]");
            const nodes = q("[data-node]");

            const setActive = (idx) => {
                nodes.forEach((n, i) => (n.dataset.active = i <= idx ? "true" : "false"));
                if (counterRef.current)
                    counterRef.current.textContent = String(idx + 1).padStart(2, "0");
            };

            const mm = gsap.matchMedia();

            /* ---------- Desktop: pinned scroll sequence ---------- */
            mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
                gsap.set(steps, { position: "absolute", inset: 0, autoAlpha: 0, yPercent: 45 });
                gsap.set(steps[0], { autoAlpha: 1, yPercent: 0 });
                setActive(0);

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: rootRef.current,
                        start: "center center",
                        end: `+=${(STEPS.length - 1) * 100}%`,
                        pin: stageRef.current,
                        scrub: 1,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                        snap: {
                            snapTo: gsap.utils.snap(1 / (STEPS.length - 1)),
                            duration: { min: 0.25, max: 0.6 },
                            delay: 0.06,
                            ease: "power1.inOut",
                        },
                        onUpdate: (self) => {
                            // ✅ fillRef.current এখন null হবে না
                            if (fillRef.current) {
                                fillRef.current.style.transform = `scaleX(${self.progress})`;
                            }
                            setActive(Math.round(self.progress * (STEPS.length - 1)));
                        },
                    },
                });

                for (let i = 1; i < steps.length; i++) {
                    tl.to(
                        steps[i - 1],
                        { autoAlpha: 0, yPercent: -45, ease: "power2.inOut", duration: 0.6 },
                        i - 1,
                    )
                        .fromTo(
                            steps[i],
                            { autoAlpha: 0, yPercent: 45 },
                            { autoAlpha: 1, yPercent: 0, ease: "power2.out", duration: 0.6 },
                            i - 1 + 0.12,
                        )
                        // Image eases in from a slight over-scale as its step arrives
                        .fromTo(
                            steps[i].querySelector("[data-img]"),
                            { scale: 1.14 },
                            { scale: 1, ease: "power2.out", duration: 0.8 },
                            i - 1 + 0.12,
                        );
                }
            });

            /* ---------- Mobile / reduced-motion: vertical reveal ---------- */
            mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
                gsap.set(steps, { clearProps: "all" });
                setActive(STEPS.length - 1);
                if (fillRef.current) fillRef.current.style.transform = "scaleX(1)";

                steps.forEach((step) => {
                    gsap.from(step, {
                        y: 40,
                        opacity: 0,
                        duration: 0.7,
                        ease: "power3.out",
                        scrollTrigger: { trigger: step, start: "top 85%", once: true },
                    });
                });
            });

            /* Heading reveal (both modes) */
            gsap.from(q("[data-word]"), {
                yPercent: 110,
                duration: 1.1,
                ease: "power4.out",
                stagger: 0.03,
                scrollTrigger: { trigger: rootRef.current, start: "top 82%", once: true },
            });

            return () => mm.revert();
        },
        { scope: rootRef },
    );

    return (
        <section ref={rootRef} id="process" aria-label="How it works" className="bg-surface">
            <div
                ref={stageRef}
                className="mx-auto flex max-w-7xl flex-col px-5 py-12 sm:py-24 md:px-8 lg:h-screen lg:justify-center lg:py-0"
            >
                {/* ---- Header row ---- */}
                <div className="flex items-end justify-between gap-6 border-b border-border-subtle pb-8">
                    <div>
                        <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                            <span className="h-2 w-2 rounded-full bg-brand-orange" />
                            How It Works
                        </p>
                        <h2 className="mt-4 font-serif text-3xl font-black leading-[1.05] tracking-tight text-content sm:text-4xl lg:text-5xl">
                            <SplitWords text="A clear path from" />{" "}
                            <SplitWords
                                text="first review"
                                className="font-serif font-medium italic tracking-normal text-brand-orange"
                            />{" "}
                            <SplitWords text="to real momentum." />
                        </h2>
                    </div>
                    <a
                        href="/#contact"
                        className="group hidden shrink-0 items-center gap-2 bg-brand-orange px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-orange-hover sm:inline-flex"
                    >
                        Request my free test
                        <ArrowUpRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                    </a>
                </div>

                {/* ---- Steps viewport ---- */}
                <div className="relative mt-8 lg:mt-10 lg:min-h-0 lg:flex-1 lg:py-10">
                    {/* ✅ Progress Rail - এখানে fillRef ব্যবহার করা হয়েছে */}
                    <div className="absolute left-0 top-0 flex items-center gap-4">
                        <div className="h-1 w-32 overflow-hidden bg-border-subtle lg:w-48">
                            <div
                                ref={fillRef}
                                className="h-full w-full origin-left scale-x-0 bg-brand-orange transition-transform"
                            />
                        </div>
                        <span
                            ref={counterRef}
                            className="font-mono text-sm font-bold tabular-nums text-brand-orange"
                        >
                            01
                        </span>
                    </div>

                    <div className="relative h-full space-y-8 lg:space-y-0">
                        {STEPS.map((s) => (
                            <article
                                key={s.n}
                                data-step
                                className="flex h-full flex-col justify-center"
                            >
                                <div className="grid gap-7 lg:grid-cols-2 lg:items-center lg:gap-16">
                                    {/* Image */}
                                    <div className="relative">
                                        <DuoImage
                                            src={s.img}
                                            alt={s.alt}
                                            className="aspect-4/3 w-full lg:aspect-5/4"
                                        />
                                        {/* Giant number straddles the image corner */}
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute -bottom-2 -left-1 select-none font-serif text-[6rem] font-black leading-none tracking-tighter text-brand-orange lg:bottom-4 lg:text-[11rem]"
                                        >
                                            {s.n}
                                        </span>
                                    </div>

                                    {/* Copy */}
                                    <div className="lg:pl-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                            {s.tag} · Step {s.n} / 0{STEPS.length}
                                        </p>
                                        <h3 className="mt-4 font-serif text-3xl font-black tracking-tight text-content sm:text-4xl lg:text-6xl">
                                            {s.title}
                                        </h3>
                                        <p className="mt-5 max-w-xl text-base leading-relaxed text-content-muted lg:text-xl">
                                            {s.description}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
