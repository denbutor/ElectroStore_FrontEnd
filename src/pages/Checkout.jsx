import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import orderService from "../services/orderService";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
    const { cartItems, fetchCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const [shippingAddress, setShippingAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const total = cartItems.reduce(
        (sum, item) => sum + item.quantity * (item.product?.price || 0),
        0
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return showToast(t.checkout.emptyCartError, "error");
        if (!shippingAddress.trim()) return showToast(t.checkout.enterAddressError, "error");

        setLoading(true);
        try {
            const res = await orderService.checkout(shippingAddress.trim());
            const createdOrder = res.data;

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
            showToast(t.checkout.orderCreated.replace("{id}", createdOrder.id), "success");
            navigate("/orders");
        } catch (err) {
            showToast(err.response?.data?.detail || t.checkout.orderFailed, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <h1>{t.checkout.title}</h1>
            <form className="form" onSubmit={handleSubmit}>
                <textarea
                    name="shipping_address"
                    placeholder={t.checkout.addressPlaceholder}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                    rows={3}
                    className="input"
                />

                <h3>{t.checkout.orderSummary} ({total} $)</h3>
                <ul className="cart-list">
                    {cartItems.map((item) => (
                        <li key={item.product_id}>
                            {item.product?.title} — {item.quantity} {t.checkout.pcs} × {item.product?.price} $
                        </li>
                    ))}
                </ul>

                <button className="button" type="submit" disabled={loading}>
                    {loading ? t.checkout.processing : t.checkout.placeOrder}
                </button>
            </form>
        </div>
    );
};

export default Checkout;
