import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import orderService from "../services/orderService";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
    const { cartItems, fetchCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const navigate = useNavigate();

    const [shippingAddress, setShippingAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const total = cartItems.reduce(
        (sum, item) => sum + item.quantity * (item.product?.price || 0),
        0
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return showToast("Your cart is empty!", "error");
        if (!shippingAddress.trim()) return showToast("Enter shipping address", "error");

        setLoading(true);
        try {
            const res = await orderService.checkout(shippingAddress.trim());
            const createdOrder = res.data;

            // Зберігаємо замовлення локально для відображення в MyOrders (оскільки GET /orders у сервісі поки відсутній)
            const storageKey = `electrostore_orders_${user?.id || "guest"}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
            localStorage.setItem(
                storageKey,
                JSON.stringify([
                    {
                        ...createdOrder,
                        items: cartItems.map((i) => ({
                            product_id: i.product_id,
                            title: i.product?.title,
                            price: i.product?.price,
                            quantity: i.quantity,
                        })),
                        created_at: new Date().toISOString(),
                    },
                    ...existing,
                ])
            );

            await fetchCart();
            showToast(`Order #${createdOrder.id} created!`, "success");
            navigate("/orders");
        } catch (err) {
            showToast(err.response?.data?.detail || "Failed to create order.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <h1>Checkout</h1>
            <form className="form" onSubmit={handleSubmit}>
                <textarea
                    name="shipping_address"
                    placeholder="Shipping address (City, Street, Building / Post Office)"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                    rows={3}
                    className="input"
                />

                <h3>Order Summary ({total} $)</h3>
                <ul className="cart-list">
                    {cartItems.map((item) => (
                        <li key={item.product_id}>
                            {item.product?.title} — {item.quantity} pcs × {item.product?.price} $
                        </li>
                    ))}
                </ul>

                <button className="button" type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Place Order"}
                </button>
            </form>
        </div>
    );
};

export default Checkout;