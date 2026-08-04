// src/services/pageMetaApi.js
// Service layer over /api/page-meta (mounted in server.js).
//
// ⚠ CONTRACT NOTE: pageMetaController.js / pageMetaRoutes.js were not in the
// files I could read, so the endpoints below follow the same RESTful shape as
// your other resources + the PageMeta model. If your actual route file differs
// (e.g. PUT instead of PATCH, or a { data } vs { pageMetas } envelope), adjust
// the two spots marked [VERIFY]. The component consumes results through
// normalizePageMetaList() so a differently-named array won't break the UI.
import api from "./api";

export const pageMetaApi = {
    /** GET /api/page-meta  (optional ?page&limit&search) */
    getAll: (params = {}) => api.get("/page-meta", { params }).then((r) => r.data),

    /** GET /api/page-meta/:id */
    getById: (id) => api.get(`/page-meta/${id}`).then((r) => r.data),

    /** POST /api/page-meta
     *  { pageName, pageSlug, metaTitle, metaDescription, metaKeywords,
     *    canonicalUrl, isActive } */
    create: (payload) => api.post("/page-meta", payload).then((r) => r.data),

    /** PATCH /api/page-meta/:id  — [VERIFY] switch to api.put if your route uses PUT */
    update: (id, payload) => api.patch(`/page-meta/${id}`, payload).then((r) => r.data),

    /** DELETE /api/page-meta/:id */
    remove: (id) => api.delete(`/page-meta/${id}`).then((r) => r.data),
};

/** [VERIFY] Tolerant extractor — returns the array regardless of envelope key. */
export const normalizePageMetaList = (res) =>
    res?.pageMetas ?? res?.pages ?? res?.data ?? res?.items ?? [];

export const pageMetaErrorMessage = (err, fallback = "Something went wrong") =>
    err?.response?.data?.message || fallback;
