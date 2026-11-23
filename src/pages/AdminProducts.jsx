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

    // Пошук, фільтрація та мобільна панель фільтрів у списку товарів адміна
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategoryId, setFilterCategoryId] = useState("");
    const [stockFilter, setStockFilter] = useState("all");
    const [isAdminFiltersOpen, setIsAdminFiltersOpen] = useState(false);

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

    const activeAdminFiltersCount = [filterCategoryId, stockFilter !== "all" ? stockFilter : ""].filter(
        Boolean
    ).length;

    const filteredProducts = products.filter((product) => {
        const matchesQuery =
            !searchQuery.trim() ||
            product.title?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            String(product.id).includes(searchQuery.trim());

        const matchesCategory =
            !filterCategoryId || String(product.category_id) === String(filterCategoryId);

        const matchesStock =
            stockFilter === "all" ||
            (stockFilter === "in_stock" && Number(product.stock) > 0) ||
            (stockFilter === "out_of_stock" && Number(product.stock) <= 0);

        return matchesQuery && matchesCategory && matchesStock;
    });

    return (
        <div className="page">
            <div className="page-header">
                <h1>{t.admin.title}</h1>
            </div>

            <form className="form admin-create-form" onSubmit={handleCreate}>
                <h3>{t.admin.createTitle}</h3>

                <label className="admin-field-label">{t.admin.fieldTitle}</label>
                <input
                    type="text"
                    name="title"
                    placeholder={t.admin.titlePlaceholder}
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label className="admin-field-label">{t.admin.fieldDescription}</label>
                <textarea
                    name="description"
                    placeholder={t.admin.descriptionPlaceholder}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label className="admin-field-label">{t.admin.fieldPrice}</label>
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

                <label className="admin-field-label">{t.admin.fieldStock}</label>
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

                <label className="admin-field-label">{t.admin.fieldCategory}</label>
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

                <div className="admin-specs-header">
                    <label className="admin-field-label">
                        {t.admin.fieldSpecs}
                    </label>
                    <div className="admin-mode-switch">
                        <button
                            type="button"
                            className={`button ${specMode === "pairs" ? "" : "button-secondary"}`}
                            onClick={() => switchSpecMode("pairs")}
                        >
                            {t.admin.modePairs}
                        </button>
                        <button
                            type="button"
                            className={`button ${specMode === "json" ? "" : "button-secondary"}`}
                            onClick={() => switchSpecMode("json")}
                        >
                            {t.admin.modeJson}
                        </button>
                    </div>
                </div>

                {specMode === "pairs" ? (
                    <div className="admin-pairs-list">
                        {specPairs.map((pair, idx) => (
                            <div key={idx} className="admin-pair-row">
                                <input
                                    type="text"
                                    placeholder={t.admin.specKeyPlaceholder}
                                    value={pair.key}
                                    onChange={(e) => handleSpecPairChange(idx, "key", e.target.value)}
                                    className="input"
                                />
                                <input
                                    type="text"
                                    placeholder={t.admin.specValuePlaceholder}
                                    value={pair.value}
                                    onChange={(e) => handleSpecPairChange(idx, "value", e.target.value)}
                                    className="input"
                                />
                                {specPairs.length > 1 && (
                                    <button
                                        type="button"
                                        className="button button-danger"
                                        onClick={() => removeSpecPair(idx)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="button button-secondary admin-add-spec-btn"
                            onClick={addSpecPair}
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
                        className="input admin-json-textarea"
                    />
                )}

                <label className="admin-field-label">{t.admin.fieldImage}</label>
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

            <div className="admin-toolbar">
                <div className="catalog-mobile-bar">
                    <input
                        type="text"
                        className="input search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.products.searchPlaceholder}
                    />
                    <button
                        type="button"
                        className="button button-secondary mobile-filter-toggle-btn"
                        onClick={() => setIsAdminFiltersOpen((prev) => !prev)}
                        aria-expanded={isAdminFiltersOpen}
                    >
                        <span>
                            {isAdminFiltersOpen
                                ? (t.products.hideFilters || "Сховати фільтри")
                                : (t.products.openFilters || "Фільтри")}
                        </span>
                        {activeAdminFiltersCount > 0 && (
                            <span className="filter-count-badge">{activeAdminFiltersCount}</span>
                        )}
                    </button>
                </div>

                <div
                    className={`catalog-filters-collapsible ${
                        isAdminFiltersOpen ? "is-open" : ""
                    }`}
                >
                    <select
                        className="input"
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                    >
                        <option value="">{t.products.allCategories}</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="input"
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                    >
                        <option value="all">{t.admin.allStock || "Усі товари"}</option>
                        <option value="in_stock">{t.products.inStock}</option>
                        <option value="out_of_stock">{t.products.outOfStock}</option>
                    </select>

                    {(searchQuery || filterCategoryId || stockFilter !== "all") && (
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                                setSearchQuery("");
                                setFilterCategoryId("");
                                setStockFilter("all");
                            }}
                        >
                            {t.admin.resetFilters || "Скинути"}
                        </button>
                    )}
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <p>{t.products.notFound}</p>
            ) : (
                <ul className="admin-list">
                    {filteredProducts.map((product) => (
                        <li key={product.id} className="admin-item admin-product-row">
                            <div className="admin-product-main">
                                <img
                                    src={resolveImageUrl(product.image_url, FALLBACK_IMAGE)}
                                    alt={product.title}
                                    className="admin-product-thumb"
                                />
                                <div className="admin-product-details">
                                    <h3 className="admin-product-title">
                                        #{product.id} — {product.title}
                                    </h3>
                                    <p className="admin-product-meta">
                                        {t.admin.priceLabel}: {product.price} $ | {t.admin.stockLabel}: {product.stock} | {t.admin.categoryLabel}:{" "}
                                        {product.category_name || t.admin.uncategorized}
                                    </p>
                                </div>
                            </div>

                            <div className="admin-product-actions">
                                <label className="button button-secondary admin-upload-label">
                                    {t.admin.uploadImageBtn}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleUploadImage(product.id, e.target.files?.[0])}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="button button-danger"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    {t.admin.deleteBtn}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminProducts;
