/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { tokenStore } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate session once on mount
    useEffect(() => {
        const token = tokenStore.get();
        if (!token) {
            setIsLoading(false);
            return;
        }
        let active = true;
        (async () => {
            try {
                const { data } = await api.get("/auth/me");
                if (active) setUser(data.admin);
            } catch {
                tokenStore.clear();
                if (active) setUser(null);
            } finally {
                if (active) setIsLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        tokenStore.set(data.token);
        setUser(data.admin);
        return data.admin;
    }, []);

    const logout = useCallback(() => {
        tokenStore.clear();
        setUser(null);
    }, []);

    const changePassword = useCallback(async (currentPassword, newPassword) => {
        const { data } = await api.patch("/auth/change-password", {
            currentPassword,
            newPassword,
        });
        // Backend rotates the token (old JWTs invalidated via passwordChangedAt)
        if (data.token) tokenStore.set(data.token);
        return data;
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
    };

    return <AuthContext value={value}>{children}</AuthContext>;
}
