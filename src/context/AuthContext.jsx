import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { parseJwt, isTokenExpired } from "../utils/token";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const syncUserFromToken = (token) => {
        const payload = parseJwt(token);
        if (!payload) return false;

        const savedMeta = JSON.parse(localStorage.getItem("user_meta") || "{}");
        setUser({
            id: payload.sub,
            role: payload.role || "client",
            email: savedMeta.email || "",
            full_name: savedMeta.full_name || "",
        });
        setIsAuthenticated(true);
        return true;
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("access_token");
            const refreshToken = localStorage.getItem("refresh_token");

            if (token && !isTokenExpired(token)) {
                syncUserFromToken(token);
                setLoading(false);
                return;
            }

            if (refreshToken) {
                try {
                    const res = await authService.refresh(refreshToken);
                    const { access_token, refresh_token: newRefresh } = res.data;
                    localStorage.setItem("access_token", access_token);
                    if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
                    syncUserFromToken(access_token);
                } catch {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const response = await authService.login({ email, password });
        const { access_token, refresh_token } = response.data;

        if (!access_token) throw new Error("No access token");

        localStorage.setItem("access_token", access_token);
        if (refresh_token) localStorage.setItem("refresh_token", refresh_token);

        const prevMeta = JSON.parse(localStorage.getItem("user_meta") || "{}");
        localStorage.setItem(
            "user_meta",
            JSON.stringify({ ...prevMeta, email })
        );

        syncUserFromToken(access_token);
        navigate("/");
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_meta");
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                login,
                logout,
                loading,
                setUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };