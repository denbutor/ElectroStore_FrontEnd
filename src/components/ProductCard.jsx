import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../utils/image";
import "./ProductCard.css";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=No+Image";

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();

    const isInStock = product.stock > 0;

    const handleAdd = async () => {
        if (!isAuthenticated) {
            showToast(t.products.loginToAdd, "error");
            navigate("/login");
            return;
        }
        try {
            await addToCart(product.id, quantity);
            showToast(t.products.addedToCart, "success");
        } catch {
            showToast(t.products.addError, "error");
        }
    };

    return (
        <article className="product-card">
            <Link to={`/products/${product.id}`} className="product-link">
                <div className="product-image-wrap">
                    <img
                        src={resolveImageUrl(product.image_url, FALLBACK_IMAGE)}
                        alt={product.title}
                        className="product-image"
                    />
                </div>
                <h2 className="product-name">{product.title}</h2>
                <div className="product-price-row">
                    <p className="product-price">{product.price} $</p>
                    <span
                        className={`product-stock-badge ${isInStock ? "in-stock" : "out-of-stock"}`}
                    >
                        {isInStock ? `${t.products.inStock}: ${product.stock}` : t.products.outOfStock}
                    </span>
                </div>
            </Link>
            <div className="product-card-actions">
                <div className="quantity-controls">
                    <button
                        type="button"
                        className="button qty-btn"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!isInStock}
                    >
                        -
                    </button>
                    <span className="qty-value">{quantity}</span>
                    <button
                        type="button"
                        className="button qty-btn"
                        onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                        disabled={!isInStock}
                    >
                        +
                    </button>
                </div>
                <button
                    type="button"
                    className="button product-add-btn"
                    onClick={handleAdd}
                    disabled={!isInStock}
                >
                    {t.products.addToCart}
                </button>
            </div>
        </article>
    );
};

export default ProductCard;
