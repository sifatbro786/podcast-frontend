/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import { createContext, useContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    return <AuthContext value={{}}>{children}</AuthContext>;
};
