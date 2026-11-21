import api from "./api";

const authService = {
    login: ({ email, password }) =>
        api.post("/api/v1/auth/login", { email, password }),

    register: ({ email, password, full_name }) =>
        api.post("/api/v1/auth/register", { email, password, full_name }),

    refresh: (refresh_token) =>
        api.post("/api/v1/auth/refresh", { refresh_token }),
};

export default authService;