// src/services/bookingApi.js
// Thin service layer over the /api/guests resource. Components never touch
// axios directly — they call these and receive response.data.
import api from "./api";

export const bookingApi = {
    /** PUBLIC — POST /api/guests
     *  payload: { fullName, phoneNumber, category }
     *  Rate-limited server-side (5/min); a 429 carries a friendly message. */
    createBooking: (payload) => api.post("/guests", payload).then((r) => r.data),

    /** ADMIN — GET /api/guests?page&limit&status&category&search */
    getGuestBookings: (params = {}) => api.get("/guests", { params }).then((r) => r.data),

    /** ADMIN — PATCH /api/guests/:id/status */
    updateBookingStatus: (id, status) =>
        api.patch(`/guests/${id}/status`, { status }).then((r) => r.data),

    /** ADMIN — DELETE /api/guests/:id */
    deleteBooking: (id) => api.delete(`/guests/${id}`).then((r) => r.data),

    /** ADMIN — GET /api/guests/export → .xlsx Blob for download */
    exportBookings: () => api.get("/guests/export", { responseType: "blob" }).then((r) => r.data),
};

/** Extract the friendliest message an axios error can give us. */
export const bookingErrorMessage = (err, fallback = "Something went wrong") => {
    if (err?.response?.status === 429) {
        return err.response.data?.message || "Too many submissions, please slow down";
    }
    return err?.response?.data?.message || fallback;
};
