// src/components/client/home/ProcessSection.jsx
// "The Sequence" — v3
//
// Desktop  : the stage pins, scroll scrubs one full-focus step at a time.
//            Crossfades are alpha-led with a 6% transform travel so the GPU
//            never has to repaint a large area mid-scrub.
// Mobile   : no pin, no scrub. One batched ScrollTrigger reveals cards on the
//            way up — transforms + opacity only, so iOS Safari holds 60fps.
//
// Changed vs v2: progress rail + step counter removed, image duotone/gradient
// washes removed, headings moved to font-display (serif is now reserved for
// the italic accent phrase only).
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import SplitWords from "../../common/SplitWords";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Set to 0 if you notice the pin engaging a few pixels early — Lenis and
   anticipatePin both look ahead, and together they can double-count. */
// const ANTICIPATE_PIN = 1;

/* Swap these with the client's licensed photography before launch. */
const STEPS = [
    {
        n: "01",
        tag: "Discovery",
        title: "Podcast Review",
        description: "We review your show, niche, recent episodes, audience, and growth goals.",
        img: "https://images.pexels.com/photos/6919987/pexels-photo-6919987.jpeg",
        alt: "Broadcast microphone in a recording studio",
    },
    {
        n: "02",
        tag: "Trial",
        title: "Free 3-Day Test",
        description: "Evaluate campaign activity and your analytics before choosing a longer plan.",
        img: "https://images.pexels.com/photos/9011378/pexels-photo-9011378.jpeg",
        alt: "Headphones resting on a desk beside a phone",
    },
    {
        n: "03",
        tag: "Execution",
        title: "Focused Campaign",
        description: "We run the agreed strategy and share clear progress updates along the way.",
        img: "https://images.pexels.com/photos/5563238/pexels-photo-5563238.jpeg",
        alt: "Studio mixing console with channel faders",
    },
    {
        n: "04",
        tag: "Momentum",
        title: "Review And Scale",
        description: "You review the results before approving any extended campaign.",
        img: "https://images.pexels.com/photos/27357322/pexels-photo-27357322.jpeg",
        alt: "Podcaster speaking into a studio microphone",
    },
];

/* Fixed spectrum — deterministic, so it never differs between renders and
   never needs to run a single frame of JS. */
const SPECTRUM = [
    14, 30, 22, 46, 34, 58, 40, 74, 52, 88, 62, 44, 70, 32, 56, 26, 48, 20, 66, 38, 82, 50, 28, 60,
    36, 72, 42, 24, 54, 18, 64, 30, 46, 22, 58, 34, 40, 16, 52, 26,
];

export default function ProcessSection() {
    const rootRef = useRef(null);
    const stageRef = useRef(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(rootRef);
            const steps = q("[data-step]");

            // iOS/Android fire resize every time the URL bar collapses. Without
            // this the pin recalculates mid-scroll, which reads as a jump.
            ScrollTrigger.config({ ignoreMobileResize: true });

            const mm = gsap.matchMedia();

            /* ---------------- Desktop: pinned scrub sequence ---------------- */
            mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
                gsap.set(steps, {
                    position: "absolute",
                    inset: 0,
                    autoAlpha: 0,
                    yPercent: 6,
                    force3D: true,
                });
                gsap.set(steps[0], { autoAlpha: 1, yPercent: 0 });

                const tl = gsap.timeline({
                    defaults: { force3D: true },
                    scrollTrigger: {
                        trigger: rootRef.current,
                        start: "top top-=10px", // 10px অফসেট দিলে স্ক্রোল ঢোকার সাথে সাথে পিন পজিশনে লক হবে
                        end: () => `+=${window.innerHeight * STEPS.length}`,
                        pin: stageRef.current,
                        pinSpacing: true,
                        scrub: 0.5,
                        anticipatePin: 1,
                        fastScrollEnd: true,
                        invalidateOnRefresh: true,
                    },
                });

                // 🌟 ১ম ইমেজকে পজিশনে হোল্ড করে রাখার জন্য ইনিশিয়াল ডেড-জোন
                tl.to({}, { duration: 0.4 });

                for (let i = 1; i < steps.length; i += 1) {
                    const at = i;
                    const shot = steps[i].querySelector("[data-shot]");

                    tl.to(
                        steps[i - 1],
                        { autoAlpha: 0, yPercent: -6, duration: 0.55, ease: "power2.inOut" },
                        at,
                    ).fromTo(
                        steps[i],
                        { autoAlpha: 0, yPercent: 6 },
                        { autoAlpha: 1, yPercent: 0, duration: 0.55, ease: "power2.out" },
                        at + 0.15,
                    );

                    if (shot) {
                        tl.fromTo(
                            shot,
                            { scale: 1.07 },
                            { scale: 1, duration: 0.8, ease: "power2.out" },
                            at + 0.15,
                        );
                    }

                    // স্টেপগুলোর মাঝে হোল্ড টাইম
                    tl.to({}, { duration: 0.3 });
                }
            });

            /* -------- Mobile / reduced-motion: batched vertical reveal -------- */
            mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
                gsap.set(steps, { autoAlpha: 0, y: 28, force3D: true });

                // One trigger for the whole group instead of four independent
                // ones — fewer scroll listeners, fewer layout reads per frame.
                const batch = ScrollTrigger.batch(steps, {
                    start: "top 88%",
                    once: true,
                    onEnter: (targets) =>
                        gsap.to(targets, {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.6,
                            ease: "power3.out",
                            stagger: 0.1,
                            overwrite: true,
                        }),
                });

                return () => batch.forEach((st) => st.kill());
            });

            /* ---------------- Heading reveal (both modes) ---------------- */
            const words = q("[data-word]");
            const headingInView =
                rootRef.current.getBoundingClientRect().top < window.innerHeight * 0.82;

            gsap.fromTo(
                words,
                { yPercent: 110 },
                {
                    yPercent: 0,
                    duration: 1.1,
                    ease: "power4.out",
                    stagger: 0.03,
                    // Never pre-render the hidden state: if the trigger misses,
                    // the heading stays readable instead of sitting clipped.
                    immediateRender: false,
                    ...(headingInView
                        ? {}
                        : {
                              scrollTrigger: {
                                  trigger: rootRef.current,
                                  start: "top 82%",
                                  once: true,
                              },
                          }),
                },
            );

            const refresh = () => ScrollTrigger.refresh();
            if (document.fonts?.ready) document.fonts.ready.then(refresh).catch(() => {});

            return () => mm.revert();
        },
        { scope: rootRef },
    );

    return (
        <section ref={rootRef} aria-label="How it works" className="relative isolate bg-surface">
            {/* ---- Studio backdrop: frequency grid + spectrum ridge ---- */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 opacity-70" />
                <div className="absolute inset-x-0 bottom-0 flex h-48 items-end gap-0.75 px-5 opacity-[0.18] md:px-8">
                    {SPECTRUM.map((h, i) => (
                        <span
                            key={i}
                            style={{ height: `${h}%` }}
                            className="flex-1 bg-linear-to-t from-brand-orange to-transparent"
                        />
                    ))}
                </div>
            </div>

            <div
                ref={stageRef}
                className="mx-auto flex max-w-7xl flex-col px-5 py-12 sm:py-24 md:px-8 lg:h-screen lg:justify-center lg:py-0 motion-reduce:lg:h-auto motion-reduce:lg:py-24"
            >
                {/* ---- Header row ---- */}
                <div className="flex items-end justify-between gap-6 border-b border-border-subtle pb-8">
                    <div>
                        <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                            <span className="text-brand-orange text-[14px]">✦</span> How It Works
                        </p>
                        <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-content sm:text-5xl lg:text-6xl">
                            <SplitWords text="A clear path from first review to" />{" "}
                            <SplitWords
                                text="real momentum."
                                className="font-serif font-normal italic tracking-normal text-brand-orange"
                            />
                        </h2>
                    </div>
                    <a
                        href="/#contact"
                        className="group hidden shrink-0 items-center gap-2 bg-brand-orange px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-orange-hover sm:inline-flex"
                    >
                        Request my free test
                        <ArrowUpRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                    </a>
                </div>

                {/* ---- Steps viewport ---- */}
                <div id="process" className="relative mt-10 sm:mt-20 lg:min-h-0 lg:flex-1 lg:py-10">
                    <div className="relative h-full space-y-12 lg:space-y-0 motion-reduce:lg:space-y-24">
                        {STEPS.map((s) => (
                            <article
                                key={s.n}
                                data-step
                                className="flex h-full flex-col justify-center lg:will-change-[transform,opacity]"
                            >
                                <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
                                    {/* ---- Framed shot: no wash, no gradient ---- */}
                                    <figure className="rounded-[14px] border border-border-subtle bg-surface-raised p-2 shadow-[0_24px_60px_-32px_rgb(0_0_0/0.65)]">
                                        <figcaption className="flex items-center justify-between px-2 pb-2 pt-1">
                                            <span className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-content-muted">
                                                <span className="text-brand-orange">{s.n}</span>
                                                <span aria-hidden="true">/</span>
                                                {s.tag}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className="flex items-center gap-1"
                                            >
                                                <span className="h-1 w-1 bg-brand-orange" />
                                                <span className="h-1 w-1 bg-border-subtle" />
                                                <span className="h-1 w-1 bg-border-subtle" />
                                            </span>
                                        </figcaption>
                                        <div className="overflow-hidden rounded-lg">
                                            <img
                                                data-shot
                                                src={s.img}
                                                alt={s.alt}
                                                loading="lazy"
                                                decoding="async"
                                                className="aspect-4/3 w-full object-cover lg:aspect-5/4"
                                            />
                                        </div>
                                    </figure>

                                    {/* ---- Copy ---- */}
                                    <div className="lg:pl-4">
                                        <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-content-muted">
                                            Step {s.n} of 0{STEPS.length}
                                        </p>
                                        <h3 className="mt-4 font-display text-3xl font-semibold tracking-[-0.02em] text-content sm:text-4xl lg:text-5xl">
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
