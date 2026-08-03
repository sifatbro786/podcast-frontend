import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function BrandSpinner() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-content">
            <div className="relative h-14 w-14">
                <span className="absolute inset-0 rounded-full border-2 border-border-subtle" />
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-orange" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-content-muted">
                Mission
            </p>
        </div>
    );
}

export default function ProtectedRoute({ children, requireAuth = true, requireAdmin = false }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <BrandSpinner />;

    if (requireAuth && !user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    if (requireAdmin && (!user || (user.role !== "admin" && user.role !== "super_admin"))) {
        return <Navigate to="/" replace />;
    }
    return children;
}
