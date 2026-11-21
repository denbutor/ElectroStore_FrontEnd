import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import productService from "../services/productService";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import { resolveImageUrl } from "../utils/image";

const FALLBACK_IMAGE = "https://placehold.co/400x400?text=No+Image";

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const { addToCart } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    useEffect(() => {
        productService
            .getById(id)
            .then((res) => setProduct(res.data))
            .catch(() => showToast(t.productDetail.notFound, "error"));
    }, [id]);

    if (!product) return <div className="page"><p>{t.productDetail.loading}</p></div>;

    const specs = product.specifications ? Object.entries(product.specifications) : [];

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

                    <button
                        className="button"
                        disabled={product.stock === 0}
                        onClick={handleAdd}
                    >
                        {t.productDetail.addToCart}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
