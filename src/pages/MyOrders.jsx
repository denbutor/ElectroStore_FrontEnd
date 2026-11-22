import { useEffect, useState, useContext } from "react";
import orderService from "../services/orderService";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import { getLocaleTag } from "../config/languages";

const MyOrders = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const { t, language } = useContext(LanguageContext);
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
            showToast(t.orders.paidSuccess.replace("{id}", orderId), "success");
        } catch (err) {
            showToast(err.response?.data?.detail || t.orders.paymentFailed, "error");
        } finally {
            setPayingId(null);
        }
    };

    const formatStatus = (status) => {
        return t.orders.statuses?.[status] || status;
    };

    return (
        <div className="page">
            <h1>{t.orders.title}</h1>
            {orders.length === 0 ? (
                <p>{t.orders.empty}</p>
            ) : (
                <ul className="admin-list">
                    {orders.map((o) => (
                        <li key={o.id} className="admin-item">
                            <h3>{t.orders.order} #{o.id}</h3>
                            <p><strong>{t.orders.status}:</strong> {formatStatus(o.status)}</p>
                            <p><strong>{t.orders.totalAmount}:</strong> {o.total_amount} $</p>
                            <p><strong>{t.orders.shippingAddress}:</strong> {o.shipping_address}</p>
                            {o.created_at && (
                                <p>
                                    <strong>{t.orders.date}:</strong>{" "}
                                    {new Date(o.created_at).toLocaleString(getLocaleTag(language))}
                                </p>
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
                                    {payingId === o.id ? t.orders.processingPayment : t.orders.payOrder}
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