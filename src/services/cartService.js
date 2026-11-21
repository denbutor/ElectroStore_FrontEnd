import api from "./api";

const cartService = {
    getCart: () => api.get("/api/v1/cart/"),
    addToCart: (product_id, quantity = 1) =>
        api.post("/api/v1/cart/add", { product_id: Number(product_id), quantity: Number(quantity) }),
    clearCart: () => api.delete("/api/v1/cart/clear"),
};

export default cartService;