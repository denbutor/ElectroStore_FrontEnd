import api from "./api";

const orderService = {
    checkout: (shipping_address) => {
        const idempotencyKey = crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        return api.post(
            "/api/v1/orders/checkout",
            { shipping_address },
            { headers: { "x-idempotency-key": idempotencyKey } }
        );
    },
    payOrder: (orderId) => api.post(`/api/v1/orders/${orderId}/pay`),
};

export default orderService;