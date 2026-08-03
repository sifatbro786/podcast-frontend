import { Route, Routes } from "react-router-dom";
import ClientLayout from "./layouts/ClientLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./router/ProtectedRoute";
import Homepage from "./pages/client/Homepage";
import LoginPage from "./pages/auth/LoginPage";
import NotFound from "./components/common/NotFound";
import ContactManagement from "./pages/admin/ContactManagement";
import BookingManagement from "./pages/admin/BookingManagement";
import PageMetaManagement from "./pages/admin/PageMetaManagement";

export default function App() {
    return (
        <Routes>
            <Route element={<ClientLayout />}>
                <Route path="/" element={<Homepage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute requireAdmin>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<div>Overview</div>} />
                <Route path="leads" element={<ContactManagement />} />
                <Route path="guests" element={<BookingManagement />} />
                <Route path="page-meta" element={<PageMetaManagement />} />
                <Route path="settings" element={<div>Change Password</div>} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
