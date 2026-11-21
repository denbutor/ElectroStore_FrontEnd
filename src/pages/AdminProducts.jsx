import { useState, useEffect, useContext } from "react";
import productService from "../services/productService";
import { ToastContext } from "../context/ToastContext";
import { resolveImageUrl } from "../utils/image";

const FALLBACK_IMAGE = "https://placehold.co/80x80?text=No+Image";
const NEW_CATEGORY_VALUE = "__new__";
const DEFAULT_JSON_EXAMPLE = '{\n  "socket": "AM5",\n  "cores": 8,\n  "memory": "DDR5"\n}';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const { showToast } = useContext(ToastContext);

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
                showToast("Cannot switch to Key-Value: fix invalid JSON first", "error");
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
                throw new Error("Specification key cannot be empty when value is provided");
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
            showToast("Please select a category or create a new one", "error");
            return;
        }
        if (isCreatingNewCategory && !newCategoryName.trim()) {
            showToast("Please enter the new category name", "error");
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

            showToast("Product created!", "success");
            await Promise.all([fetchProducts(), fetchCategories()]);
        } catch (err) {
            showToast(err.response?.data?.detail || "Failed to create product", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadImage = async (productId, file) => {
        if (!file) return;
        try {
            await productService.uploadImage(productId, file);
            showToast("Image uploaded to MinIO!", "success");
            fetchProducts();
        } catch {
            showToast("Failed to upload image", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this product?")) return;
        try {
            await productService.delete(id);
            showToast("Product deleted", "success");
            fetchProducts();
        } catch {
            showToast("Failed to delete product", "error");
        }
    };

    return (
        <div className="page">
            <h1>Admin: Manage Products</h1>

            <form className="form" onSubmit={handleCreate} style={{ marginBottom: "40px" }}>
                <h3>Create New Product</h3>

                <label style={{ fontWeight: 600 }}>Title</label>
                <input
                    type="text"
                    name="title"
                    placeholder="e.g. AMD Ryzen 7 7800X3D"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>Description</label>
                <textarea
                    name="description"
                    placeholder="Short product description..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>Price ($)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    placeholder="e.g. 399.99"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>Stock quantity</label>
                <input
                    type="number"
                    min="0"
                    name="stock"
                    placeholder="e.g. 15"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="input"
                />

                <label style={{ fontWeight: 600 }}>Category</label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    required
                    className="input"
                >
                    <option value="">-- Select category --</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                    <option value={NEW_CATEGORY_VALUE}>+ Create new category...</option>
                </select>

                {selectedCategory === NEW_CATEGORY_VALUE && (
                    <input
                        type="text"
                        placeholder="Enter new category name (e.g. SSD Drives)"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                        className="input"
                    />
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <label style={{ fontWeight: 600 }}>
                        Specifications (JSON, e.g. socket, cores, DDR)
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
                            Key : Value
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
                            Raw JSON
                        </button>
                    </div>
                </div>

                {specMode === "pairs" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {specPairs.map((pair, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder="Key (e.g. socket)"
                                    value={pair.key}
                                    onChange={(e) => handleSpecPairChange(idx, "key", e.target.value)}
                                    className="input"
                                    style={{ marginBottom: 0, flex: 1 }}
                                />
                                <input
                                    type="text"
                                    placeholder="Value (e.g. AM5)"
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
                            + Add specification
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

                <label style={{ fontWeight: 600 }}>Product Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="input"
                />

                <button type="submit" className="button" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Product"}
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
                                    Price: {product.price} $ | Stock: {product.stock} | Category:{" "}
                                    {product.category_name || "Uncategorized"}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <label className="button" style={{ backgroundColor: "#6c757d", cursor: "pointer" }}>
                                Upload Image
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
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminProducts;


// import { useState, useEffect, useContext } from "react";
// import productService from "../services/productService";
// import { ToastContext } from "../context/ToastContext";
// import { resolveImageUrl } from "../utils/image";

// const FALLBACK_IMAGE = "https://placehold.co/80x80?text=No+Image";

// const AdminProducts = () => {
//     const [products, setProducts] = useState([]);
//     const { showToast } = useContext(ToastContext);
//     const [formData, setFormData] = useState({
//         title: "",
//         description: "",
//         price: "",
//         stock: "",
//         category_id: "",
//         specifications: "{}",
//     });
//     const [imageFile, setImageFile] = useState(null);
//     const [submitting, setSubmitting] = useState(false);

//     const fetchProducts = async () => {
//         try {
//             const response = await productService.getAll({ limit: 100 });
//             setProducts(response.data || []);
//         } catch (error) {
//             console.error("Failed to fetch products:", error);
//         }
//     };

//     useEffect(() => {
//         fetchProducts();
//     }, []);

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleCreate = async (e) => {
//         e.preventDefault();
//         let parsedSpecs = {};
//         try {
//             parsedSpecs = formData.specifications.trim()
//                 ? JSON.parse(formData.specifications)
//                 : {};
//         } catch {
//             showToast("Specifications must be valid JSON", "error");
//             return;
//         }

//         setSubmitting(true);
//         try {
//             const createdRes = await productService.create({
//                 title: formData.title,
//                 description: formData.description,
//                 price: Number(formData.price),
//                 stock: Number(formData.stock),
//                 category_id: Number(formData.category_id),
//                 specifications: parsedSpecs,
//             });

//             const newProductId = createdRes.data.id;

//             if (imageFile && newProductId) {
//                 await productService.uploadImage(newProductId, imageFile);
//             }

//             setFormData({
//                 title: "",
//                 description: "",
//                 price: "",
//                 stock: "",
//                 category_id: "",
//                 specifications: "{}",
//             });
//             setImageFile(null);
//             showToast("Product created!", "success");
//             fetchProducts();
//         } catch (err) {
//             showToast(err.response?.data?.detail || "Failed to create product", "error");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const handleUploadImage = async (productId, file) => {
//         if (!file) return;
//         try {
//             await productService.uploadImage(productId, file);
//             showToast("Image uploaded to MinIO!", "success");
//             fetchProducts();
//         } catch {
//             showToast("Failed to upload image", "error");
//         }
//     };

//     const handleDelete = async (id) => {
//         if (!confirm("Delete this product?")) return;
//         try {
//             await productService.delete(id);
//             showToast("Product deleted", "success");
//             fetchProducts();
//         } catch {
//             showToast("Failed to delete product", "error");
//         }
//     };

//     return (
//         <div className="page">
//             <h1>Admin: Manage Products</h1>

//             <form className="form" onSubmit={handleCreate} style={{ marginBottom: "40px" }}>
//                 <h3>Create New Product</h3>
//                 <input
//                     type="text"
//                     name="title"
//                     placeholder="Title"
//                     value={formData.title}
//                     onChange={handleChange}
//                     required
//                     className="input"
//                 />
//                 <textarea
//                     name="description"
//                     placeholder="Description"
//                     value={formData.description}
//                     onChange={handleChange}
//                     required
//                     className="input"
//                 />
//                 <input
//                     type="number"
//                     step="0.01"
//                     name="price"
//                     placeholder="Price"
//                     value={formData.price}
//                     onChange={handleChange}
//                     required
//                     className="input"
//                 />
//                 <input
//                     type="number"
//                     name="stock"
//                     placeholder="Stock quantity"
//                     value={formData.stock}
//                     onChange={handleChange}
//                     required
//                     className="input"
//                 />
//                 <input
//                     type="number"
//                     name="category_id"
//                     placeholder="Category ID"
//                     value={formData.category_id}
//                     onChange={handleChange}
//                     required
//                     className="input"
//                 />
//                 <textarea
//                     name="specifications"
//                     placeholder='Specifications JSON, e.g. {"ram": "16GB", "cpu": "M2"}'
//                     value={formData.specifications}
//                     onChange={handleChange}
//                     rows={3}
//                     className="input"
//                 />
//                 <input
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => setImageFile(e.target.files?.[0] || null)}
//                     className="input"
//                 />
//                 <button type="submit" className="button" disabled={submitting}>
//                     {submitting ? "Creating..." : "Create Product"}
//                 </button>
//             </form>

//             <ul className="admin-list">
//                 {products.map((product) => (
//                     <li
//                         key={product.id}
//                         className="admin-item"
//                         style={{ display: "flex", gap: "20px", alignItems: "center", justifyContent: "space-between" }}
//                     >
//                         <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
//                             <img
//                                 src={resolveImageUrl(product.image_url, FALLBACK_IMAGE)}
//                                 alt={product.title}
//                                 style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px" }}
//                             />
//                             <div>
//                                 <h3>#{product.id} — {product.title}</h3>
//                                 <p>
//                                     Price: {product.price} $ | Stock: {product.stock} | Category ID: {product.category_id}
//                                 </p>
//                             </div>
//                         </div>

//                         <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//                             <label className="button" style={{ backgroundColor: "#6c757d", cursor: "pointer" }}>
//                                 Upload Image
//                                 <input
//                                     type="file"
//                                     accept="image/*"
//                                     hidden
//                                     onChange={(e) => handleUploadImage(product.id, e.target.files?.[0])}
//                                 />
//                             </label>
//                             <button
//                                 className="button"
//                                 style={{ backgroundColor: "#dc3545" }}
//                                 onClick={() => handleDelete(product.id)}
//                             >
//                                 Delete
//                             </button>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// };

// export default AdminProducts;

// // import { useState, useEffect, useContext } from "react";
// // import productService from "../services/productService";
// // import { ToastContext } from "../context/ToastContext";

// // const FALLBACK_IMAGE = "https://placehold.co/80x80?text=No+Image";

// // const AdminProducts = () => {
// //     const [products, setProducts] = useState([]);
// //     const { showToast } = useContext(ToastContext);
// //     const [formData, setFormData] = useState({
// //         title: "",
// //         description: "",
// //         price: "",
// //         stock: "",
// //         category_id: "",
// //         specifications: "{}",
// //     });
// //     const [imageFile, setImageFile] = useState(null);
// //     const [submitting, setSubmitting] = useState(false);

// //     const fetchProducts = async () => {
// //         try {
// //             const response = await productService.getAll({ limit: 100 });
// //             setProducts(response.data || []);
// //         } catch (error) {
// //             console.error("Failed to fetch products:", error);
// //         }
// //     };

// //     useEffect(() => {
// //         fetchProducts();
// //     }, []);

// //     const handleChange = (e) => {
// //         setFormData({ ...formData, [e.target.name]: e.target.value });
// //     };

// //     const handleCreate = async (e) => {
// //         e.preventDefault();
// //         let parsedSpecs = {};
// //         try {
// //             parsedSpecs = formData.specifications.trim()
// //                 ? JSON.parse(formData.specifications)
// //                 : {};
// //         } catch {
// //             showToast("Specifications must be valid JSON", "error");
// //             return;
// //         }

// //         setSubmitting(true);
// //         try {
// //             const createdRes = await productService.create({
// //                 title: formData.title,
// //                 description: formData.description,
// //                 price: Number(formData.price),
// //                 stock: Number(formData.stock),
// //                 category_id: Number(formData.category_id),
// //                 specifications: parsedSpecs,
// //             });

// //             const newProductId = createdRes.data.id;

// //             if (imageFile && newProductId) {
// //                 await productService.uploadImage(newProductId, imageFile);
// //             }

// //             setFormData({
// //                 title: "",
// //                 description: "",
// //                 price: "",
// //                 stock: "",
// //                 category_id: "",
// //                 specifications: "{}",
// //             });
// //             setImageFile(null);
// //             showToast("Product created!", "success");
// //             fetchProducts();
// //         } catch (err) {
// //             showToast(err.response?.data?.detail || "Failed to create product", "error");
// //         } finally {
// //             setSubmitting(false);
// //         }
// //     };

// //     const handleUploadImage = async (productId, file) => {
// //         if (!file) return;
// //         try {
// //             await productService.uploadImage(productId, file);
// //             showToast("Image uploaded to MinIO!", "success");
// //             fetchProducts();
// //         } catch {
// //             showToast("Failed to upload image", "error");
// //         }
// //     };

// //     const handleDelete = async (id) => {
// //         if (!confirm("Delete this product?")) return;
// //         try {
// //             await productService.delete(id);
// //             showToast("Product deleted", "success");
// //             fetchProducts();
// //         } catch {
// //             showToast("Failed to delete product", "error");
// //         }
// //     };

// //     return (
// //         <div className="page">
// //             <h1>Admin: Manage Products</h1>

// //             <form className="form" onSubmit={handleCreate} style={{ marginBottom: "40px" }}>
// //                 <h3>Create New Product</h3>
// //                 <input
// //                     type="text"
// //                     name="title"
// //                     placeholder="Title"
// //                     value={formData.title}
// //                     onChange={handleChange}
// //                     required
// //                     className="input"
// //                 />
// //                 <textarea
// //                     name="description"
// //                     placeholder="Description"
// //                     value={formData.description}
// //                     onChange={handleChange}
// //                     required
// //                     className="input"
// //                 />
// //                 <input
// //                     type="number"
// //                     step="0.01"
// //                     name="price"
// //                     placeholder="Price"
// //                     value={formData.price}
// //                     onChange={handleChange}
// //                     required
// //                     className="input"
// //                 />
// //                 <input
// //                     type="number"
// //                     name="stock"
// //                     placeholder="Stock quantity"
// //                     value={formData.stock}
// //                     onChange={handleChange}
// //                     required
// //                     className="input"
// //                 />
// //                 <input
// //                     type="number"
// //                     name="category_id"
// //                     placeholder="Category ID"
// //                     value={formData.category_id}
// //                     onChange={handleChange}
// //                     required
// //                     className="input"
// //                 />
// //                 <textarea
// //                     name="specifications"
// //                     placeholder='Specifications JSON, e.g. {"ram": "16GB", "cpu": "M2"}'
// //                     value={formData.specifications}
// //                     onChange={handleChange}
// //                     rows={3}
// //                     className="input"
// //                 />
// //                 <input
// //                     type="file"
// //                     accept="image/*"
// //                     onChange={(e) => setImageFile(e.target.files?.[0] || null)}
// //                     className="input"
// //                 />
// //                 <button type="submit" className="button" disabled={submitting}>
// //                     {submitting ? "Creating..." : "Create Product"}
// //                 </button>
// //             </form>

// //             <ul className="admin-list">
// //                 {products.map((product) => (
// //                     <li
// //                         key={product.id}
// //                         className="admin-item"
// //                         style={{ display: "flex", gap: "20px", alignItems: "center", justifyContent: "space-between" }}
// //                     >
// //                         <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
// //                             <img
// //                                 src={product.image_url || FALLBACK_IMAGE}
// //                                 alt={product.title}
// //                                 style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px" }}
// //                             />
// //                             <div>
// //                                 <h3>#{product.id} — {product.title}</h3>
// //                                 <p>
// //                                     Price: {product.price} $ | Stock: {product.stock} | Category ID: {product.category_id}
// //                                 </p>
// //                             </div>
// //                         </div>

// //                         <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
// //                             <label className="button" style={{ backgroundColor: "#6c757d", cursor: "pointer" }}>
// //                                 Upload Image
// //                                 <input
// //                                     type="file"
// //                                     accept="image/*"
// //                                     hidden
// //                                     onChange={(e) => handleUploadImage(product.id, e.target.files?.[0])}
// //                                 />
// //                             </label>
// //                             <button
// //                                 className="button"
// //                                 style={{ backgroundColor: "#dc3545" }}
// //                                 onClick={() => handleDelete(product.id)}
// //                             >
// //                                 Delete
// //                             </button>
// //                         </div>
// //                     </li>
// //                 ))}
// //             </ul>
// //         </div>
// //     );
// // };

// // export default AdminProducts;