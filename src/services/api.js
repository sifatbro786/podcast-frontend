import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "mpg_token";

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (t) => localStorage.setItem(TOKEN_KEY, t),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Clear stale token on 401, but never on the login attempt itself (avoids loops)
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";
        if (status === 401 && !url.includes("/auth/login")) tokenStore.clear();
        return Promise.reject(error);
    },
);

export default api;
