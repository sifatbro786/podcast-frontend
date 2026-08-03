// src/services/leadApi.js
// Thin service layer over the /api/leads resource — same contract as
// bookingApi.js: methods return response.data; axios errors propagate to the
// caller, where leadErrorMessage() extracts the friendliest message.
//
// Auth note: the JWT bearer header is attached globally by the request
// interceptor in ./api — no per-method token handling here, ever.
import api from "./api";

export const leadApi = {
    /** PUBLIC — POST /api/leads
     *  Accepts the form's semantic field names and maps them to the exact
     *  backend schema (businessEmail / additionalDetails) in ONE place, so
     *  components never need to know the wire format.
     *  form: { fullName, email, podcastLink, primaryGoal, targetMarket, notes } */
    submitLead: (form) =>
        api
            .post("/leads", {
                fullName: form.fullName,
                businessEmail: form.email ?? form.businessEmail,
                podcastLink: form.podcastLink || undefined, // optional in schema
                primaryGoal: form.primaryGoal,
                targetMarket: form.targetMarket,
                additionalDetails: form.notes ?? form.additionalDetails ?? undefined,
            })
            .then((r) => r.data),

    /** ADMIN — GET /api/leads?page&limit&status&search
     *  Returns { success, count, total, page, pages, leads } */
    getAllLeads: (params = {}) => api.get("/leads", { params }).then((r) => r.data),

    /** ADMIN — GET /api/leads/:id */
    getLeadById: (id) => api.get(`/leads/${id}`).then((r) => r.data),

    /** ADMIN — PATCH /api/leads/:id/status
     *  status: "new" | "contacted" | "qualified" | "converted" | "rejected" */
    updateLeadStatus: (id, status) =>
        api.patch(`/leads/${id}/status`, { status }).then((r) => r.data),

    /** ADMIN — DELETE /api/leads/:id */
    deleteLead: (id) => api.delete(`/leads/${id}`).then((r) => r.data),

    /** ADMIN — GET /api/leads/export → .xlsx Blob
     *  responseType "blob" is mandatory: default json transform corrupts
     *  the binary buffer. */
    exportLeadsToExcel: () =>
        api.get("/leads/export", { responseType: "blob" }).then((r) => r.data),
};

/** Fetch the export AND trigger the browser download in one call —
 *  what the dashboard's "Export" button should invoke. */
export const downloadLeadsExcel = async (filename = `leads-${Date.now()}.xlsx`) => {
    const blob = await leadApi.exportLeadsToExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // free the object URL — leaks otherwise
};

/** Friendliest message an axios error can give us (429-aware for the
 *  public form's rate limiter). */
export const leadErrorMessage = (err, fallback = "Something went wrong") => {
    if (err?.response?.status === 429) {
        return err.response.data?.message || "Too many submissions, please slow down";
    }
    return err?.response?.data?.message || fallback;
};

/* Mirror of backend utils/constants.js — single import point for the
   contact form's selects. Keep in sync with the backend. */
export const LEAD_GOALS = [
    { value: "audience_growth", label: "Audience Growth" },
    { value: "chart_visibility", label: "Chart Visibility" },
    { value: "episode_promotion", label: "Episode Promotion" },
    { value: "audio_editing", label: "Audio Editing" },
];

export const TARGET_MARKETS = ["USA", "UK", "Canada", "Australia", "Global"];

export const LEAD_STATUS = ["new", "contacted", "qualified", "converted", "rejected"];
