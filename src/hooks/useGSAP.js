import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Demo = () => {
    const boxRef = useRef();

    useGSAP(() => {
        gsap.to(boxRef.current, {
            x: 200,
            duration: 1,
        });
    });

    return <div ref={boxRef}>Animate Me</div>;
};

export default Demo;
