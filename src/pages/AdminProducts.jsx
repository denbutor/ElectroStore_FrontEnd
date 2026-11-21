import { useState, useEffect, useContext } from "react";
import productService from "../services/productService";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";
import { resolveImageUrl } from "../utils/image";

const FALLBACK_IMAGE = "https://placehold.co/80x80?text=No+Image";
const NEW_CATEGORY_VALUE = "__new__";
const DEFAULT_JSON_EXAMPLE = '{\n  "socket": "AM5",\n  "cores": 8,\n  "memory": "DDR5"\n}';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        stock: "",
    });

    const [selectedCategory, setSelectedCategory] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");

    const [specMode, setSpecMode] = useState("pairs");
    const [specPairs, setSpecPairs] = useState([{ key: "", value: "" }]);
    const [rawJsonSpecs, setRawJsonSpecs] = useState(DEFAULT_JSON_EXAMPLE);

    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = async () => {
        try {
            const response = await productService.getAll({ limit: 100 });
            setProducts(response.data || []);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await productService.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSpecPairChange = (index, field, val) => {
        setSpecPairs((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
        );
    };

    const addSpecPair = () => {
        setSpecPairs((prev) => [...prev, { key: "", value: "" }]);
    };

    const removeSpecPair = (index) => {
        setSpecPairs((prev) => prev.filter((_, idx) => idx !== index));
    };

    const switchSpecMode = (targetMode) => {
        if (targetMode === specMode) return;

        if (targetMode === "json") {
            const obj = {};
            specPairs.forEach(({ key, value }) => {
                const k = key.trim();
                if (k) {
                    const num = Number(value);
                    obj[k] = value.trim() !== "" && !Number.isNaN(num) ? num : value.trim();
                }
            });
            setRawJsonSpecs(
                Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : DEFAULT_JSON_EXAMPLE
            );
        } else {
            try {
                const parsed = rawJsonSpecs.trim() ? JSON.parse(rawJsonSpecs) : {};
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    const entries = Object.entries(parsed).map(([k, v]) => ({
                        key: k,
                        value: String(v),
                    }));
                    setSpecPairs(entries.length > 0 ? entries : [{ key: "", value: "" }]);
                }
            } catch {
                showToast(t.admin.invalidJsonSwitchError, "error");
                return;
            }
        }
        setSpecMode(targetMode);
    };

    const buildSpecifications = () => {
        if (specMode === "json") {
            const trimmed = rawJsonSpecs.trim();
            if (!trimmed) return {};
            let parsed;
            try {
                parsed = JSON.parse(trimmed);
            } catch (err) {
                throw new Error(`Invalid Specifications JSON: ${err.message}`);
            }
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error('Specifications JSON must be an object, e.g. {"socket": "AM5", "cores": 8}');
            }
            return parsed;
        }

        const result = {};
        for (const { key, value } of specPairs) {
            const cleanKey = key.trim();
            const cleanVal = value.trim();
            if (!cleanKey && !cleanVal) continue;
            if (!cleanKey) {
                throw new Error(t.admin.emptySpecKeyError);
            }
            const asNumber = Number(cleanVal);
            result[cleanKey] = cleanVal !== "" && !Number.isNaN(asNumber) ? asNumber : cleanVal;
        }
        return result;
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        const isCreatingNewCategory = selectedCategory === NEW_CATEGORY_VALUE;
        if (!selectedCategory) {
            showToast(t.admin.selectCategoryError, "error");
            return;
        }
        if (isCreatingNewCategory && !newCategoryName.trim()) {
            showToast(t.admin.enterCategoryError, "error");
            return;
        }

        let specifications = {};
        try {
            specifications = buildSpecifications();
        } catch (err) {
            showToast(err.message, "error");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                price: Number(formData.price),
                stock: Number(formData.stock),
                category_id: isCreatingNewCategory ? null : Number(selectedCategory),
                new_category_name: isCreatingNewCategory ? newCategoryName.trim() : null,
                specifications,
            };

            const createdRes = await productService.create(payload);
            const newProductId = createdRes.data.id;

            if (imageFile && newProductId) {
                await productService.uploadImage(newProductId, imageFile);
            }

            setFormData({
                title: "",
                description: "",
                price: "",
                stock: "",
            });
            setSelectedCategory("");
            setNewCategoryName("");
            setSpecPairs([{ key: "", value: "" }]);
            setRawJsonSpecs(DEFAULT_JSON_EXAMPLE);
            setImageFile(null);

            showToast(t.admin.productCreated, "success");
            await Promise.all([fetchProducts(), fetchCategories()]);
        } catch (err) {
            showToast(err.response?.data?.detail || t.admin.createFailed, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadImage = async (productId, file) => {
        if (!file) return;
        try {
            await productService.uploadImage(productId, file);
            showToast(t.admin.imageUploaded, "success");
            fetchProducts();
        } catch {
            showToast(t.admin.imageUploadFailed, "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t.admin.confirmDelete)) return;
        try {
            await productService.delete(id);
            showToast(t.admin.productDeleted, "success");
            fetchProducts();
        } catch {
            showToast(t.admin.deleteFailed, "error");
        }
    };

    return (
        <div className="page">
            <h1>{t.admin.title}</h1>

            <form className="form" onSubmit={handleCreate} style={{ marginBottom: "40px" }}>
                <h3>{t.admin.createTitle}</h3>

                <label style={{ fontWeight: 600 }}>{t.admin.fieldTitle}</label>
                <input
                    type="text"
                    name="title"
                    placeholder={t.admin.titlePlaceholder}
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>{t.admin.fieldDescription}</label>
                <textarea
                    name="description"
                    placeholder={t.admin.descriptionPlaceholder}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>{t.admin.fieldPrice}</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    placeholder={t.admin.pricePlaceholder}
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>{t.admin.fieldStock}</label>
                <input
                    type="number"
                    min="0"
                    name="stock"
                    placeholder={t.admin.stockPlaceholder}
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>{t.admin.fieldCategory}</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    required
                    className="input"
                >
                    <option value="">{t.admin.selectCategoryPlaceholder}</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                    <option value={NEW_CATEGORY_VALUE}>{t.admin.createNewCategoryOption}</option>
                </select>

                {selectedCategory === NEW_CATEGORY_VALUE && (
                    <input
                        type="text"
                        placeholder={t.admin.newCategoryPlaceholder}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                        className="input"
                    />
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <label style={{ fontWeight: 600 }}>
                        {t.admin.fieldSpecs}
                    </label>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            type="button"
                            className="button"
                            onClick={() => switchSpecMode("pairs")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                backgroundColor: specMode === "pairs" ? "#0d6efd" : "#6c757d",
                            }}
                        >
                            {t.admin.modePairs}
                        </button>
                        <button
                            type="button"
                            className="button"
                            onClick={() => switchSpecMode("json")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                backgroundColor: specMode === "json" ? "#0d6efd" : "#6c757d",
                            }}
                        >
                            {t.admin.modeJson}
                        </button>
                    </div>
                </div>

                {specMode === "pairs" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {specPairs.map((pair, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder={t.admin.specKeyPlaceholder}
                                    value={pair.key}
                                    onChange={(e) => handleSpecPairChange(idx, "key", e.target.value)}
                                    className="input"
                                    style={{ marginBottom: 0, flex: 1 }}
                                />
                                <input
                                    type="text"
                                    placeholder={t.admin.specValuePlaceholder}
                                    value={pair.value}
                                    onChange={(e) => handleSpecPairChange(idx, "value", e.target.value)}
                                    className="input"
                                    style={{ marginBottom: 0, flex: 1 }}
                                />
                                {specPairs.length > 1 && (
                                    <button
                                        type="button"
                                        className="button"
                                        onClick={() => removeSpecPair(idx)}
                                        style={{ backgroundColor: "#dc3545", padding: "8px 12px" }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="button"
                            onClick={addSpecPair}
                            style={{ backgroundColor: "#6c757d", alignSelf: "flex-start", padding: "6px 12px", fontSize: "13px" }}
                        >
                            {t.admin.addSpecBtn}
                        </button>
                    </div>
                ) : (
                    <textarea
                        placeholder='{"socket": "AM5", "cores": 8, "memory": "DDR5"}'
                        value={rawJsonSpecs}
                        onChange={(e) => setRawJsonSpecs(e.target.value)}
                        rows={4}
                        className="input"
                        style={{ fontFamily: "monospace" }}
                    />
                )}

                <label style={{ fontWeight: 600 }}>{t.admin.fieldImage}</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="input"
                />

                <button type="submit" className="button" disabled={submitting}>
                    {submitting ? t.admin.creatingBtn : t.admin.createBtn}
                </button>
            </form>

            <ul className="admin-list">
                {products.map((product) => (
                    <li
                        key={product.id}
                        className="admin-item"
                        style={{ display: "flex", gap: "20px", alignItems: "center", justifyContent: "space-between" }}
                    >
                        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <img
                                src={resolveImageUrl(product.image_url, FALLBACK_IMAGE)}
                                alt={product.title}
                                style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px" }}
                            />
                            <div>
                                <h3>#{product.id} — {product.title}</h3>
                                <p>
                                    {t.admin.priceLabel}: {product.price} $ | {t.admin.stockLabel}: {product.stock} | {t.admin.categoryLabel}:{" "}
                                    {product.category_name || t.admin.uncategorized}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <label className="button" style={{ backgroundColor: "#6c757d", cursor: "pointer" }}>
                                {t.admin.uploadImageBtn}
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => handleUploadImage(product.id, e.target.files?.[0])}
                                />
                            </label>
                            <button
                                className="button"
                                style={{ backgroundColor: "#dc3545" }}
                                onClick={() => handleDelete(product.id)}
                            >
                                {t.admin.deleteBtn}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminProducts;
