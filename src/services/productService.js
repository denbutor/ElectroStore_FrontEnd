import api from "./api";

const productService = {
    getAll: (params = {}) => {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        );
        return api.get("/api/v1/products/", { params: cleanParams });
    },
    getById: (id) => api.get(`/api/v1/products/${id}`),
    create: (data) => api.post("/api/v1/products/", data),
    delete: (id) => api.delete(`/api/v1/products/${id}`),
    uploadImage: (id, file) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post(`/api/v1/products/${id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
};

export default productService;