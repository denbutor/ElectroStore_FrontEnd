import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import { resolveImageUrl } from "../utils/image";

const FALLBACK_IMAGE = "https://placehold.co/100x100?text=No+Image";

const Cart = () => {
    const { cartItems, cartLoading, addToCart, removeFromCart, clearCart } = useContext(CartContext);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const handleIncrement = async (productId) => {
        try {
            await addToCart(productId, 1);
        } catch {
            showToast(t.cart.incError, "error");
        }
    };

    const handleDecrement = async (productId, currentQty) => {
        if (currentQty <= 1) {
            await handleRemove(productId);
            return;
        }
        try {
            await addToCart(productId, -1);
        } catch {
            showToast(t.cart.decError, "error");
        }
    };

    const handleRemove = async (productId) => {
        try {
            await removeFromCart(productId);
            showToast(t.cart.itemRemoved, "success");
        } catch {
            showToast(t.cart.removeError, "error");
        }
    };

    const handleClearCart = async () => {
        try {
            await clearCart();
            showToast(t.cart.cartCleared, "success");
        } catch {
            showToast(t.cart.clearError, "error");
        }
    };

    const total = cartItems.reduce(
        (sum, item) => sum + item.quantity * (item.product?.price || 0),
        0
    );

    if (cartLoading) return <div className="page"><p>{t.cart.loading}</p></div>;

    return (
        <div className="page">
            <h1>{t.cart.title}</h1>
            {cartItems.length === 0 ? (
                <p>{t.cart.empty}</p>
            ) : (
                <div className="cart-layout">
                    <ul className="cart-list">
                        {cartItems.map((item) => (
                            <li key={item.product_id} className="cart-item">
                                <img
                                    src={resolveImageUrl(item.product?.image_url, FALLBACK_IMAGE)}
                                    alt={item.product?.title}
                                    className="cart-item-image"
                                />
                                <div className="cart-item-info">
                                    <h3>{item.product?.title}</h3>
                                    <p>{item.product?.price} $ {t.cart.perPcs}</p>
                                    <div className="cart-item-controls">
                                        <div className="quantity-controls">
                                            <button
                                                type="button"
                                                className="button qty-btn"
                                                onClick={() => handleDecrement(item.product_id, item.quantity)}
                                            >
                                                -
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                type="button"
                                                className="button qty-btn"
                                                onClick={() => handleIncrement(item.product_id)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            className="button button-danger"
                                            onClick={() => handleRemove(item.product_id)}
                                        >
                                            {t.cart.delete}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="cart-summary-box">
                        <h2>{t.cart.totalCost}: {total} $</h2>
                        <div className="cart-summary-buttons">
                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={handleClearCart}
                            >
                                {t.cart.clearCart}
                            </button>

                            <button
                                type="button"
                                className="button"
                                onClick={() => navigate("/checkout")}
                            >
                                {t.cart.proceedToCheckout}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
