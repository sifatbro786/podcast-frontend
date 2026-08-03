import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const Demo = () => {
    const containerRef = useRef();
    const boxRef = useRef();

    useGSAP(
        () => {
            gsap.to(boxRef.current, {
                x: 300,
                rotate: 360,
                borderRadius: "100px",
                duration: 1.5,
                scrollTrigger: {
                    trigger: boxRef.current,
                    start: "top 80%", // যখন এলিমেন্টটি ভিউপোর্টের ৮০% নিচে আসবে
                    end: "top 30%", // যখন ৩০% পজিশনে পৌঁছাবে
                    scrub: 1, // স্ক্রোলের সাথে অ্যানিমেশন সিঙ্ক হবে (Smooth Scrub)
                    toggleActions: "play reverse play reverse",
                },
            });
        },
        { scope: containerRef },
    );

    return (
        <div
            ref={containerRef}
            className="py-40 min-h-[150vh] flex flex-col justify-center items-center"
        >
            <div
                ref={boxRef}
                className="w-32 h-32 bg-brand-orange text-white font-bold flex items-center justify-center rounded-2xl shadow-lg shadow-brand-orange/20 cursor-pointer"
            >
                Scroll Me
            </div>
        </div>
    );
};

export default Demo;
