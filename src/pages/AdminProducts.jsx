import { useState, useEffect, useContext } from "react";
import productService from "../services/productService";
import { ToastContext } from "../context/ToastContext";
import { resolveImageUrl } from "../utils/image";

const FALLBACK_IMAGE = "https://placehold.co/80x80?text=No+Image";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const { showToast } = useContext(ToastContext);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        stock: "",
        category_id: "",
        specifications: "{}",
    });
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

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        let parsedSpecs = {};
        try {
            parsedSpecs = formData.specifications.trim()
                ? JSON.parse(formData.specifications)
                : {};
        } catch {
            showToast("Specifications must be valid JSON", "error");
            return;
        }

        setSubmitting(true);
        try {
            const createdRes = await productService.create({
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                stock: Number(formData.stock),
                category_id: Number(formData.category_id),
                specifications: parsedSpecs,
            });

            const newProductId = createdRes.data.id;

            if (imageFile && newProductId) {
                await productService.uploadImage(newProductId, imageFile);
            }

            setFormData({
                title: "",
                description: "",
                price: "",
                stock: "",
                category_id: "",
                specifications: "{}",
            });
            setImageFile(null);
            showToast("Product created!", "success");
            fetchProducts();
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
                <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <input
                    type="number"
                    step="0.01"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <input
                    type="number"
                    name="stock"
                    placeholder="Stock quantity"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <input
                    type="number"
                    name="category_id"
                    placeholder="Category ID"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <textarea
                    name="specifications"
                    placeholder='Specifications JSON, e.g. {"ram": "16GB", "cpu": "M2"}'
                    value={formData.specifications}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                />
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
                                    Price: {product.price} $ | Stock: {product.stock} | Category ID: {product.category_id}
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
//                                 src={product.image_url || FALLBACK_IMAGE}
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