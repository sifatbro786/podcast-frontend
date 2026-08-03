import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import toast from "react-hot-toast";
import { ArrowRight, Eye, EyeOff, Loader2, Radio } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const STATS = [
    { k: "10+", v: "Years scaling shows" },
    { k: "2", v: "Apple + Spotify charts" },
    { k: "3 Day", v: "Free visibility test" },
];

const GRID_BG = {
    backgroundImage:
        "linear-gradient(var(--content) 1px,transparent 1px),linear-gradient(90deg,var(--content) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
};

function Waveform() {
    const ref = useRef(null);
    useGSAP(
        () => {
            const bars = ref.current.querySelectorAll("span");
            gsap.to(bars, {
                scaleY: () => 0.25 + Math.random() * 0.9,
                duration: 0.5,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                transformOrigin: "center",
                stagger: { each: 0.06, from: "center" },
            });
        },
        { scope: ref },
    );

    return (
        <div ref={ref} className="flex h-24 items-center gap-1.5">
            {Array.from({ length: 40 }).map((_, i) => (
                <span
                    key={i}
                    className="h-full w-1 flex-1 origin-center bg-brand-orange/70"
                    style={{ transform: "scaleY(0.3)" }}
                />
            ))}
        </div>
    );
}

function MagneticButton({ children, ...props }) {
    const ref = useRef(null);
    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        gsap.to(ref.current, {
            x: (e.clientX - r.left - r.width / 2) * 0.3,
            y: (e.clientY - r.top - r.height / 2) * 0.4,
            duration: 0.4,
            ease: "power3.out",
        });
    };
    const onLeave = () =>
        gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
    return (
        <button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} {...props}>
            {children}
        </button>
    );
}

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/admin";

    const [showPw, setShowPw] = useState(false);
    const formRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    useGSAP(
        () => {
            gsap.from(formRef.current.querySelectorAll("[data-reveal]"), {
                y: 24,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.09,
            });
        },
        { scope: formRef },
    );

    const onSubmit = async ({ email, password }) => {
        try {
            const admin = await login(email.trim(), password);
            toast.success(`Welcome back, ${admin.name.split(" ")[0]}`);
            navigate(from, { replace: true });
        } catch (err) {
            toast.error(err?.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="grid min-h-screen bg-surface text-content lg:grid-cols-2">
            <aside className="relative hidden overflow-hidden border-r border-border-subtle bg-dark-bg p-12 lg:flex lg:flex-col lg:justify-between">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={GRID_BG}
                />
                <div className="relative flex items-center gap-2.5 text-white">
                    <span className="grid h-9 w-9 place-items-center bg-brand-orange">
                        <Radio size={18} />
                    </span>
                    <span className="text-sm font-extrabold uppercase tracking-[0.25em]">
                        Mission
                    </span>
                </div>
                <div className="relative">
                    <Waveform />
                    <h1 className="mt-10 max-w-md text-4xl font-black leading-[1.05] tracking-tight text-white">
                        We don&apos;t fake charts.
                        <br />
                        <span className="text-brand-orange">We climb them.</span>
                    </h1>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-dark-muted">
                        The admin console for real, ethical podcast growth — leads, bookings and
                        campaigns in one place.
                    </p>
                </div>
                <div className="relative grid grid-cols-3 gap-6 border-t border-dark-border pt-8">
                    {STATS.map((s) => (
                        <div key={s.k}>
                            <div className="text-2xl font-black text-white">{s.k}</div>
                            <div className="mt-1 text-xs font-semibold text-dark-muted">{s.v}</div>
                        </div>
                    ))}
                </div>
            </aside>

            <main
                ref={formRef}
                className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20"
            >
                <div className="mx-auto w-full max-w-sm">
                    <p
                        data-reveal
                        className="text-xs font-bold uppercase tracking-[0.3em] text-brand-orange"
                    >
                        Admin Access
                    </p>
                    <h2 data-reveal className="mt-3 text-3xl font-black tracking-tight">
                        Sign in
                    </h2>
                    <p data-reveal className="mt-2 text-sm text-content-muted">
                        Enter your credentials to reach the dashboard.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5" noValidate>
                        <div data-reveal>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-content-muted">
                                Email
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^\S+@\S+\.\S+$/,
                                        message: "Enter a valid email",
                                    },
                                })}
                                className="w-full border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-brand-orange"
                                placeholder="you@agency.com"
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div data-reveal>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="block text-xs font-bold uppercase tracking-wider text-content-muted">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-bold text-brand-orange hover:underline"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"}
                                    autoComplete="current-password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 6, message: "Too short" },
                                    })}
                                    className="w-full border border-border-subtle bg-surface-raised px-4 py-3 pr-11 text-sm font-medium outline-none transition-colors focus:border-brand-orange"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((s) => !s)}
                                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-content-muted hover:text-content"
                                    aria-label={showPw ? "Hide password" : "Show password"}
                                >
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div data-reveal>
                            <MagneticButton
                                type="submit"
                                disabled={isSubmitting}
                                className="group flex w-full items-center justify-center gap-2 bg-brand-orange px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Sign in{" "}
                                        <ArrowRight
                                            size={17}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </>
                                )}
                            </MagneticButton>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
