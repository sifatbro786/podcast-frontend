// import { useState } from "react";
// import { NavLink, Outlet, useNavigate } from "react-router-dom";
// import {
//     CalendarCheck,
//     ChevronDown,
//     Download,
//     FileText,
//     LayoutDashboard,
//     LogOut,
//     Menu,
//     Moon,
//     Radio,
//     Settings,
//     Sun,
//     Users,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
// import { useTheme } from "../hooks/useTheme";

// const NAV = [
//     { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
//     { to: "/admin/leads", label: "Contact Leads", icon: Users },
//     { to: "/admin/guests", label: "Guest Bookings", icon: CalendarCheck },
//     { to: "/admin/page-meta", label: "Page Meta / SEO", icon: FileText },
//     { to: "/admin/settings", label: "Change Password", icon: Settings },
// ];

// function ThemeToggle() {
//     const { isDark, toggle } = useTheme();
//     return (
//         <button
//             onClick={toggle}
//             aria-label="Toggle theme"
//             className="grid h-9 w-9 place-items-center border border-border-subtle text-content transition-colors hover:border-brand-orange hover:text-brand-orange"
//         >
//             {isDark ? <Moon size={16} /> : <Sun size={16} />}
//         </button>
//     );
// }

// export default function DashboardLayout() {
//     const { user, logout } = useAuth();
//     const navigate = useNavigate();
//     const [mobileOpen, setMobileOpen] = useState(false);
//     const [menuOpen, setMenuOpen] = useState(false);

//     const handleLogout = () => {
//         logout();
//         navigate("/login", { replace: true });
//     };

//     const initials = (user?.name || "A")
//         .split(" ")
//         .map((w) => w[0])
//         .slice(0, 2)
//         .join("")
//         .toUpperCase();

//     const Sidebar = () => (
//         <>
//             <div className="flex h-16 items-center gap-2.5 border-b border-border-subtle px-6">
//                 <span className="grid h-8 w-8 place-items-center bg-brand-orange text-white">
//                     <Radio size={16} />
//                 </span>
//                 <span className="text-sm font-extrabold uppercase tracking-[0.2em]">Mission</span>
//             </div>
//             <nav className="flex-1 space-y-1 p-4">
//                 {NAV.map(({ to, label, icon: Icon, end }) => (
//                     <NavLink
//                         key={to}
//                         to={to}
//                         end={end}
//                         onClick={() => setMobileOpen(false)}
//                         className={({ isActive }) =>
//                             `flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm font-bold transition-colors ${
//                                 isActive
//                                     ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
//                                     : "border-transparent text-content-muted hover:border-border-subtle hover:text-content"
//                             }`
//                         }
//                     >
//                         <Icon size={17} /> {label}
//                     </NavLink>
//                 ))}
//             </nav>
//             <div className="border-t border-border-subtle p-4">
//                 <button
//                     onClick={handleLogout}
//                     className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-content-muted transition-colors hover:text-red-500"
//                 >
//                     <LogOut size={17} /> Sign out
//                 </button>
//             </div>
//         </>
//     );

//     return (
//         <div className="flex min-h-screen bg-surface text-content">
//             <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-raised lg:flex">
//                 <Sidebar />
//             </aside>

//             {mobileOpen && (
//                 <div className="fixed inset-0 z-50 lg:hidden">
//                     <div
//                         className="absolute inset-0 bg-black/60"
//                         onClick={() => setMobileOpen(false)}
//                     />
//                     <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border-subtle bg-surface-raised">
//                         <Sidebar />
//                     </aside>
//                 </div>
//             )}

//             <div className="flex min-w-0 flex-1 flex-col">
//                 <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border-subtle bg-surface/80 px-5 backdrop-blur-xl md:px-8">
//                     <div className="flex items-center gap-3">
//                         <button
//                             className="grid h-9 w-9 place-items-center border border-border-subtle lg:hidden"
//                             onClick={() => setMobileOpen(true)}
//                             aria-label="Open sidebar"
//                         >
//                             <Menu size={18} />
//                         </button>
//                         <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-widest text-content-muted sm:flex">
//                             <Download size={14} className="text-brand-orange" /> Export ready
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-3">
//                         <ThemeToggle />
//                         <div className="relative">
//                             <button
//                                 onClick={() => setMenuOpen((s) => !s)}
//                                 className="flex items-center gap-2 border border-border-subtle py-1.5 pl-1.5 pr-3 transition-colors hover:border-brand-orange"
//                             >
//                                 <span className="grid h-7 w-7 place-items-center bg-brand-orange text-xs font-black text-white">
//                                     {initials}
//                                 </span>
//                                 <span className="hidden text-sm font-bold sm:block">
//                                     {user?.name?.split(" ")[0]}
//                                 </span>
//                                 <ChevronDown size={15} className="text-content-muted" />
//                             </button>
//                             {menuOpen && (
//                                 <>
//                                     <div
//                                         className="fixed inset-0 z-10"
//                                         onClick={() => setMenuOpen(false)}
//                                     />
//                                     <div className="absolute right-0 z-20 mt-2 w-52 border border-border-subtle bg-surface-raised p-1 shadow-xl">
//                                         <div className="border-b border-border-subtle px-3 py-2.5">
//                                             <p className="truncate text-sm font-bold">
//                                                 {user?.name}
//                                             </p>
//                                             <p className="truncate text-xs text-content-muted">
//                                                 {user?.email}
//                                             </p>
//                                             <span className="mt-1 inline-block bg-brand-orange/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
//                                                 {user?.role}
//                                             </span>
//                                         </div>
//                                         <button
//                                             onClick={() => {
//                                                 setMenuOpen(false);
//                                                 navigate("/admin/settings");
//                                             }}
//                                             className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-content-muted hover:text-content"
//                                         >
//                                             <Settings size={15} /> Change password
//                                         </button>
//                                         <button
//                                             onClick={handleLogout}
//                                             className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-content-muted hover:text-red-500"
//                                         >
//                                             <LogOut size={15} /> Sign out
//                                         </button>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 </header>

//                 <main className="flex-1 p-5 md:p-8">
//                     <Outlet />
//                 </main>
//             </div>
//         </div>
//     );
// }


export default function DashboardLayout() {
    return (
        <div>
            DashboardLayout
        </div>
    );
}