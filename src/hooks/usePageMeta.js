// src/hooks/usePageMeta.js
import { useState, useEffect } from "react";

export const usePageMeta = (pageSlug) => {
    const [pageMeta, setPageMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPageMeta = async () => {
            if (!pageSlug) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/page-meta/all`);
                const data = await response.json();

                if (data.success && Array.isArray(data.pageMetas)) {
                    const foundMeta = data.pageMetas.find((meta) => {
                        // Exact match
                        if (meta.pageSlug === pageSlug) return true;
                        // Case insensitive match
                        if (meta.pageSlug?.toLowerCase() === pageSlug.toLowerCase()) return true;
                        // Page name match
                        if (meta.pageName?.toLowerCase() === pageSlug.toLowerCase()) return true;
                        return false;
                    });

                    setPageMeta(foundMeta || null);
                } else {
                    console.error("❌ API response format error");
                    setError("Invalid API response format");
                }
            } catch (err) {
                console.error("💥 Fetch error:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchPageMeta();
    }, [pageSlug]);

    return { pageMeta, loading, error };
};
