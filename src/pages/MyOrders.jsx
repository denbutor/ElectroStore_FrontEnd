import { useEffect, useState, useContext } from "react";
import orderService from "../services/orderService";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";

const MyOrders = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const [orders, setOrders] = useState([]);
    const [payingId, setPayingId] = useState(null);

    const storageKey = `electrostore_orders_${user?.id || "guest"}`;

    useEffect(() => {
        if (!user) return;
        const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        setOrders(saved);
    }, [user, storageKey]);

    const handlePay = async (orderId) => {
        setPayingId(orderId);
        try {
            const res = await orderService.payOrder(orderId);
            const updatedOrder = res.data;

            const updatedList = orders.map((o) =>
                o.id === orderId ? { ...o, status: updatedOrder.status } : o
            );
            setOrders(updatedList);
            localStorage.setItem(storageKey, JSON.stringify(updatedList));
            showToast(`Order #${orderId} paid successfully!`, "success");
        } catch (err) {
            showToast(err.response?.data?.detail || "Payment failed", "error");
        } finally {
            setPayingId(null);
        }
    };

    return (
        <div className="page">
            <h1>My orders</h1>
            {orders.length === 0 ? (
                <p>You have no orders yet.</p>
            ) : (
                <ul className="admin-list">
                    {orders.map((o) => (
                        <li key={o.id} className="admin-item">
                            <h3>Order #{o.id}</h3>
                            <p><strong>Status:</strong> {o.status}</p>
                            <p><strong>Total amount:</strong> {o.total_amount} $</p>
                            <p><strong>Shipping address:</strong> {o.shipping_address}</p>
                            {o.created_at && (
                                <p><strong>Date:</strong> {new Date(o.created_at).toLocaleString()}</p>
                            )}
                            {o.items?.map((item) => (
                                <div key={item.product_id}>
                                    <p>- {item.title} × {item.quantity} ({item.price} $)</p>
                                </div>
                            ))}
                            {o.status !== "paid" && (
                                <button
                                    className="button"
                                    style={{ marginTop: "10px", backgroundColor: "#28a745" }}
                                    disabled={payingId === o.id}
                                    onClick={() => handlePay(o.id)}
                                >
                                    {payingId === o.id ? "Processing payment..." : "Pay Order"}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MyOrders;