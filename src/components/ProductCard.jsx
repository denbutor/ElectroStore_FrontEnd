import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { Link, useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../utils/image";
import "./ProductCard.css";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=No+Image";

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();

    const handleAdd = async () => {
        if (!isAuthenticated) {
            showToast("Please login to add products to cart", "error");
            navigate("/login");
            return;
        }
        try {
            await addToCart(product.id, quantity);
            showToast("Product added to cart", "success");
        } catch {
            showToast("Error adding to cart", "error");
        }
    };

    return (
        <div className="product-card">
            <Link to={`/products/${product.id}`} className="product-link">
                <img
                    src={resolveImageUrl(product.image_url, FALLBACK_IMAGE)}
                    alt={product.title}
                    className="product-image"
                />
                <h2 className="product-name">{product.title}</h2>
                <p className="product-price">{product.price} $</p>
                <p style={{ fontSize: "13px", color: product.stock > 0 ? "#28a745" : "#dc3545" }}>
                    {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
                </p>
            </Link>
            <div style={{ padding: "0 15px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="quantity-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        className="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={product.stock === 0}
                    >
                        -
                    </button>
                    <span>{quantity}</span>
                    <button
                        className="button"
                        onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                        disabled={product.stock === 0}
                    >
                        +
                    </button>
                </div>
                <button
                    className="button"
                    onClick={handleAdd}
                    disabled={product.stock === 0}
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
