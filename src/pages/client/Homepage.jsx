import ContactSection from "../../components/client/home/ContactSection";
import GuestDirectorySection from "../../components/client/home/GuestDirectorySection";
import HeroSection from "../../components/client/home/HeroSection";
import ProcessSection from "../../components/client/home/ProcessSection";
import ServicesSection from "../../components/client/home/ServicesSection";
import WhyMissionSection from "../../components/client/home/WhyMissionSection";

// src/pages/client/Homepage.jsx
export default function Homepage() {
    return (
        <>
            <HeroSection />
            <ServicesSection />
            <GuestDirectorySection />
            <ProcessSection />
            <WhyMissionSection />
            <ContactSection />
        </>
    );
}
