import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import SmoothScroll from "../components/common/SmoothScroll";
import CustomCursor from "../components/common/CustomCursor";


export default function ClientLayout() {
    return (
        <div className="bg-surface text-content">
            <SmoothScroll>
                <CustomCursor />
                <Navbar />
                <main className="pt-18 font-display">
                    <Outlet />
                </main>
                <Footer />
            </SmoothScroll>
        </div>
    );
}
