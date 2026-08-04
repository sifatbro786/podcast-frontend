// src/services/authApi.js
// Service layer over /api/auth for the flows AuthContext doesn't own:
// password recovery + super_admin admin management. Mirrors the contract of
// leadApi/bookingApi — every method returns response.data and lets axios
// errors propagate to the caller, where authErrorMessage() extracts the copy.
//
// Login / me / change-password stay in AuthContext (they mutate session
// state); everything here is stateless request plumbing.
import api from "./api";

export const authApi = {
    /* ---------------- Public password recovery ---------------- */

    /** POST /api/auth/forgot-password
     *  Always resolves with the same generic message (anti-enumeration) — the
     *  UI must NOT branch on whether the account existed. */
    forgotPassword: (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data),

    /** PATCH /api/auth/reset-password/:token  (password >= 8 chars server-side) */
    resetPassword: (token, password) =>
        api.patch(`/auth/reset-password/${token}`, { password }).then((r) => r.data),

    /* ---------------- Super-admin: admin management ----------------
       All protected + restrictTo("super_admin"); a non-super token gets 403. */

    /** GET /api/auth/admins → { success, count, admins } */
    getAdmins: () => api.get("/auth/admins").then((r) => r.data),

    /** POST /api/auth/admins  payload: { name, email, password, role? } */
    createAdmin: (payload) => api.post("/auth/admins", payload).then((r) => r.data),

    /** PATCH /api/auth/admins/:id/role  — role: "admin" | "super_admin"
     *  Server rejects self-demotion + demoting the last super_admin. */
    updateAdminRole: (id, role) =>
        api.patch(`/auth/admins/${id}/role`, { role }).then((r) => r.data),

    /** PATCH /api/auth/admins/:id/status  — server toggles isActive (no body).
     *  Rejects deactivating your own account. */
    toggleAdminStatus: (id) => api.patch(`/auth/admins/${id}/status`).then((r) => r.data),

    /** DELETE /api/auth/admins/:id  — rejects self-delete + last super_admin. */
    deleteAdmin: (id) => api.delete(`/auth/admins/${id}`).then((r) => r.data),
};

/** 429-aware (the auth limiter is 10 / 15min on credential + recovery routes). */
export const authErrorMessage = (err, fallback = "Something went wrong") => {
    if (err?.response?.status === 429) {
        return err.response.data?.message || "Too many attempts, try again later";
    }
    return err?.response?.data?.message || fallback;
};

/* Mirror of backend utils/constants.js ADMIN_ROLES — value/label for selects. */
export const ADMIN_ROLES = [
    { value: "admin", label: "Admin" },
    { value: "super_admin", label: "Super Admin" },
];
