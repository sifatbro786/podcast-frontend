// src/services/bookingApi.js
// Thin service layer over the /api/guests resource. Components never touch
// axios directly — they call these and receive response.data.
import api from "./api";

export const bookingApi = {
    /** PUBLIC — POST /api/guests
     *  payload: { fullName, email, phoneNumber, categories: string[],
     *             portfolioLink?: string, resume?: File }
     *  Sends multipart/form-data when a resume File is present, else JSON.
     *  Rate-limited server-side (5/min); a 429 carries a friendly message. */
    createBooking: (payload = {}) => {
        const { resume, categories = [], portfolioLink, ...rest } = payload;

        if (resume instanceof File) {
            const fd = new FormData();
            fd.append("fullName", rest.fullName ?? "");
            fd.append("email", rest.email ?? "");
            fd.append("phoneNumber", rest.phoneNumber ?? "");
            if (portfolioLink) fd.append("portfolioLink", portfolioLink);
            categories.forEach((c) => fd.append("categories", c)); // repeated → array
            fd.append("resume", resume);
            // CRITICAL: the shared axios instance defaults to
            // `Content-Type: application/json`. Left untouched, axios v1's
            // transformRequest would run formDataToJSON() and ship the file as
            // JSON — the resume never reaches multer (req.file === undefined).
            // Setting multipart here keeps the FormData intact; axios/the browser
            // fill in the boundary. Do NOT hand-write a boundary.
            return api
                .post("/guests", fd, { headers: { "Content-Type": "multipart/form-data" } })
                .then((r) => r.data);
        }

        return api
            .post("/guests", {
                ...rest,
                categories,
                ...(portfolioLink ? { portfolioLink } : {}),
            })
            .then((r) => r.data);
    },

    /** ADMIN — GET /api/guests?page&limit&status&category&search
     *  Returns { success, count, total, page, pages, guests } */
    getGuestBookings: (params = {}) => api.get("/guests", { params }).then((r) => r.data),

    /** ADMIN — PATCH /api/guests/:id/status */
    updateBookingStatus: (id, status) =>
        api.patch(`/guests/${id}/status`, { status }).then((r) => r.data),

    /** ADMIN — DELETE /api/guests/:id */
    deleteBooking: (id) => api.delete(`/guests/${id}`).then((r) => r.data),

    /** ADMIN — GET /api/guests/:id/resume → file Blob (auth header via interceptor). */
    getResume: (id) =>
        api.get(`/guests/${id}/resume`, { responseType: "blob" }).then((r) => r.data),

    /** ADMIN — GET /api/guests/export → .xlsx Blob for download.
     *  responseType "blob" is mandatory: the default json transform corrupts
     *  the binary buffer. */
    exportBookings: () => api.get("/guests/export", { responseType: "blob" }).then((r) => r.data),
};

/* Shared browser-download helper — object URL + synthetic click + cleanup. */
const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // free the object URL — leaks otherwise
};

/** Fetch the export AND trigger the browser download in one call. */
export const downloadBookingsExcel = async (filename = `guests-${Date.now()}.xlsx`) => {
    const blob = await bookingApi.exportBookings();
    triggerBlobDownload(blob, filename);
};

/** Fetch a booking's resume (auth-protected) and save it under its original name. */
export const downloadGuestResume = async (guest) => {
    const blob = await bookingApi.getResume(guest._id);
    const name = guest?.resume?.originalName || `resume-${guest?._id || Date.now()}`;
    triggerBlobDownload(blob, name);
};

/** Extract the friendliest message an axios error can give us (429-aware). */
export const bookingErrorMessage = (err, fallback = "Something went wrong") => {
    if (err?.response?.status === 429) {
        return err.response.data?.message || "Too many submissions, please slow down";
    }
    return err?.response?.data?.message || fallback;
};

/* Mirrors of backend utils/constants.js — single import point for the
   dashboard's booking filters and the public form. Keep in sync with backend. */
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
