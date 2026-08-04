import { Route, Routes } from "react-router-dom";
import ClientLayout from "./layouts/ClientLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./router/ProtectedRoute";
import Homepage from "./pages/client/Homepage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import NotFound from "./components/common/NotFound";
import Overview from "./pages/admin/Overview";
import ContactManagement from "./pages/admin/ContactManagement";
import BookingManagement from "./pages/admin/BookingManagement";
import PageMetaManagement from "./pages/admin/PageMetaManagement";
import UserManagement from "./pages/admin/UserManagement";
import AccountSettings from "./pages/admin/AccountSettings";

export default function App() {
    return (
        <Routes>
            <Route element={<ClientLayout />}>
                <Route path="/" element={<Homepage />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Admin console */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requireAdmin>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Overview />} />
                <Route path="leads" element={<ContactManagement />} />
                <Route path="guests" element={<BookingManagement />} />
                <Route path="page-meta" element={<PageMetaManagement />} />

                {/* super_admin gate lives inside UserManagement */}
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<AccountSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
