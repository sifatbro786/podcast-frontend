// src/router/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, requireAuth = true, requireAdmin = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // If authentication is required and user is not logged in
    if (requireAuth && !user) {
        // Save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // If admin is required and user is not admin
    if (requireAdmin && (!user || (user.role !== "admin" && user.role !== "super_admin"))) {
        return <Navigate to="/" replace />;
    }

    return children;
}
