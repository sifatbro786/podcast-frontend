import ContactSection from "../../components/client/home/ContactSection";
import GuestDirectorySection from "../../components/client/home/GuestDirectorySection";
import HeroSection from "../../components/client/home/HeroSection";
import ProcessSection from "../../components/client/home/ProcessSection";
import ServicesSection from "../../components/client/home/ServicesSection";
import WhyMissionSection from "../../components/client/home/WhyMissionSection";
import { usePageMeta } from "../../hooks/usePageMeta";

// src/pages/client/Homepage.jsx
export default function Homepage() {
    const { pageMeta } = usePageMeta("home");

    return (
        <>
            <title>{pageMeta?.metaTitle}</title>
            <meta name="description" content={pageMeta?.metaDescription} />
            <meta name="keywords" content={pageMeta?.metaKeywords} />
            <link rel="canonical" href={pageMeta?.canonicalUrl} />

            <HeroSection />
            <ServicesSection />
            <GuestDirectorySection />
            <ProcessSection />
            <WhyMissionSection />
            <ContactSection />
        </>
    );
}
