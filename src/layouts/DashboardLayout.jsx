/* eslint-disable react-hooks/set-state-in-effect */
// src/layouts/DashboardLayout.jsx
// Admin shell: fixed sidebar rail on lg+, off-canvas drawer below. Native
// scrolling (Lenis is client-site only). Derives the topbar title from the
// active route so pages don't each have to declare it.
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";

const TITLES = [
    { match: (p) => p === "/admin", title: "Overview" },
    { match: (p) => p.startsWith("/admin/leads"), title: "Leads" },
    { match: (p) => p.startsWith("/admin/guests"), title: "Guest Bookings" },
    { match: (p) => p.startsWith("/admin/page-meta"), title: "Page SEO" },
    { match: (p) => p.startsWith("/admin/users"), title: "Admin Users" },
    { match: (p) => p.startsWith("/admin/settings"), title: "Account Settings" },
];

const titleFor = (pathname) => TITLES.find((t) => t.match(pathname))?.title ?? "Admin";

export default function DashboardLayout() {
    const { pathname } = useLocation();
    const [drawer, setDrawer] = useState(false);

    // Close the mobile drawer on route change
    useEffect(() => {
        setDrawer(false);
    }, [pathname]);

    // Lock body scroll while the drawer is open
    useEffect(() => {
        document.body.style.overflow = drawer ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawer]);

    return (
        <div className="min-h-screen bg-surface text-content">
            {/* Desktop rail */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
                <Sidebar />
            </aside>

            {/* Mobile off-canvas drawer */}
            {drawer && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={() => setDrawer(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw]">
                        <Sidebar
                            onNavigate={() => setDrawer(false)}
                            onClose={() => setDrawer(false)}
                        />
                    </div>
                </div>
            )}

            {/* Content column */}
            <div className="flex min-h-screen flex-col lg:pl-64">
                <Topbar title={titleFor(pathname)} onMenu={() => setDrawer(true)} />
                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
