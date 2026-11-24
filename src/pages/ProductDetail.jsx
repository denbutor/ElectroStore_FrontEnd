import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import productService from "../services/productService";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import { AiProductsContext, MAX_CHAT_PRODUCTS } from "../context/AiProductsContext";
import { resolveImageUrl } from "../utils/image";

const FALLBACK_IMAGE = "https://placehold.co/400x400?text=No+Image";

const ProductDetail = ({ onOpenChat }) => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const { addToCart } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);
    const { attachedProducts, attachProduct } = useContext(AiProductsContext);
    const navigate = useNavigate();

    useEffect(() => {
        productService
            .getById(id)
            .then((res) => setProduct(res.data))
            .catch(() => showToast(t.productDetail.notFound, "error"));
    }, [id]);

    if (!product) return <div className="page"><p>{t.productDetail.loading}</p></div>;

    const specs = product.specifications ? Object.entries(product.specifications) : [];
    const isAttached = attachedProducts.some((item) => Number(item.id) === Number(product.id));

    const handleAdd = async () => {
        if (!isAuthenticated) {
            showToast(t.productDetail.loginFirst, "error");
            navigate("/login");
            return;
        }
        try {
            await addToCart(product.id, 1);
            showToast(t.productDetail.addedToCart, "success");
        } catch {
            showToast(t.productDetail.addFailed, "error");
        }
    };

    const handleAskAi = () => {
        const result = attachProduct(product, onOpenChat);
        if (result.limitReached) {
            showToast(
                (t.chat.maxProductsError || "Максимум {max} товарів за одне повідомлення").replace(
                    "{max}",
                    String(MAX_CHAT_PRODUCTS)
                ),
                "error"
            );
            return;
        }
        if (result.added) {
            showToast(t.chat.productAddedToChat || "Товар додано до чату з AI", "success");
        }
    };

    return (
        <div className="page">
            <div className="product-detail">
                <img
                    className="product-detail-image"
                    src={resolveImageUrl(product.image_url, FALLBACK_IMAGE)}
                    alt={product.title}
                />
                <div className="product-detail-info">
                    <h1>{product.title}</h1>
                    <p>{product.description}</p>
                    <h2>{product.price} $</h2>
                    <p>
                        <strong>{t.productDetail.category}:</strong> {product.category_name || t.productDetail.uncategorized} |{" "}
                        <strong>{t.productDetail.stock}:</strong> {product.stock}
                    </p>

                    {specs.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                            <h3>{t.productDetail.specifications}</h3>
                            <ul>
                                {specs.map(([key, val]) => (
                                    <li key={key}>
                                        <strong>{key}:</strong> {String(val)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        <button
                            type="button"
                            className="button"
                            disabled={product.stock === 0}
                            onClick={handleAdd}
                        >
                            {t.productDetail.addToCart}
                        </button>
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={handleAskAi}
                        >
                            {isAttached
                                ? `✓ ${t.chat.inChat || "У чаті"}`
                                : `🤖 ${t.chat.askAboutProduct || "Спитати AI про товар"}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
