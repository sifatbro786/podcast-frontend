// src/services/bookingApi.js
// Thin service layer over the /api/guests resource. Components never touch
// axios directly — they call these and receive response.data.
import api from "./api";

export const bookingApi = {
    /** PUBLIC — POST /api/guests
     *  payload: { fullName, phoneNumber, category }
     *  Rate-limited server-side (5/min); a 429 carries a friendly message. */
    createBooking: (payload) => api.post("/guests", payload).then((r) => r.data),

    /** ADMIN — GET /api/guests?page&limit&status&category&search
     *  Returns { success, count, total, page, pages, guests } */
    getGuestBookings: (params = {}) => api.get("/guests", { params }).then((r) => r.data),

    /** ADMIN — PATCH /api/guests/:id/status */
    updateBookingStatus: (id, status) =>
        api.patch(`/guests/${id}/status`, { status }).then((r) => r.data),

    /** ADMIN — DELETE /api/guests/:id */
    deleteBooking: (id) => api.delete(`/guests/${id}`).then((r) => r.data),

    /** ADMIN — GET /api/guests/export → .xlsx Blob for download.
     *  responseType "blob" is mandatory: the default json transform corrupts
     *  the binary buffer. */
    exportBookings: () => api.get("/guests/export", { responseType: "blob" }).then((r) => r.data),
};

/** Fetch the export AND trigger the browser download in one call — mirrors
 *  downloadLeadsExcel(). This is what the dashboard "Export" button invokes. */
export const downloadBookingsExcel = async (filename = `guests-${Date.now()}.xlsx`) => {
    const blob = await bookingApi.exportBookings();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // free the object URL — leaks otherwise
};

/** Extract the friendliest message an axios error can give us (429-aware). */
export const bookingErrorMessage = (err, fallback = "Something went wrong") => {
    if (err?.response?.status === 429) {
        return err.response.data?.message || "Too many submissions, please slow down";
    }
    return err?.response?.data?.message || fallback;
};

/* Mirrors of backend utils/constants.js — single import point for the
   dashboard's booking filters. Keep in sync with the backend. */
export const GUEST_STATUS = ["pending", "confirmed", "completed", "cancelled"];

export const PODCAST_CATEGORIES = [
    "News",
    "Comedy",
    "Society & Culture",
    "Business",
    "True Crime",
    "Sports",
    "Health & Fitness",
    "Religion & Spirituality",
    "Arts",
    "Education",
    "History",
    "TV & Film",
    "Science",
    "Technology",
    "Music",
    "Kids & Family",
    "Leisure",
    "Government",
];
