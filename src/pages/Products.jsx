import { useEffect, useState } from "react";
import productService from "../services/productService";
import ProductCard from "../components/ProductCard";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortOption, setSortOption] = useState("");

    const fetchCategories = async () => {
        try {
            const res = await productService.getCategories();
            setCategories(res.data || []);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    };

    const fetchProducts = async (selectedCatId = categoryId) => {
        try {
            const res = await productService.getAll({
                category_id: selectedCatId ? Number(selectedCatId) : undefined,
                min_price: minPrice ? Number(minPrice) : undefined,
                max_price: maxPrice ? Number(maxPrice) : undefined,
                limit: 100,
            });
            setProducts(res.data || []);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const handleFilter = (e) => {
        e.preventDefault();
        fetchProducts(categoryId);
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setCategoryId(value);
        fetchProducts(value);
    };

    const filteredAndSorted = products
        .filter((p) =>
            p.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
        .sort((a, b) => {
            if (sortOption === "price-asc") return a.price - b.price;
            if (sortOption === "price-desc") return b.price - a.price;
            if (sortOption === "title") return a.title.localeCompare(b.title);
            return 0;
        });

    return (
        <div className="page">
            <h1>Products</h1>

            <form
                onSubmit={handleFilter}
                className="search-bar"
                style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}
            >
                <input
                    className="input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title..."
                />
                <select
                    className="input"
                    value={categoryId}
                    onChange={handleCategoryChange}
                >
                    <option value="">All categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                <input
                    className="input"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min price"
                    style={{ width: "130px" }}
                />
                <input
                    className="input"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max price"
                    style={{ width: "130px" }}
                />
                <button type="submit" className="button">
                    Filter
                </button>

                <select
                    className="input"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="">Sort by...</option>
                    <option value="price-asc">Price ↑</option>
                    <option value="price-desc">Price ↓</option>
                    <option value="title">Title A-Z</option>
                </select>
            </form>

            {filteredAndSorted.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <div className="products-grid">
                    {filteredAndSorted.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;


// import { useEffect, useState } from "react";
// import productService from "../services/productService";
// import ProductCard from "../components/ProductCard";

// const Products = () => {
//     const [products, setProducts] = useState([]);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [categoryId, setCategoryId] = useState("");
//     const [minPrice, setMinPrice] = useState("");
//     const [maxPrice, setMaxPrice] = useState("");
//     const [sortOption, setSortOption] = useState("");

//     const fetchProducts = async () => {
//         try {
//             const res = await productService.getAll({
//                 category_id: categoryId ? Number(categoryId) : undefined,
//                 min_price: minPrice ? Number(minPrice) : undefined,
//                 max_price: maxPrice ? Number(maxPrice) : undefined,
//                 limit: 100,
//             });
//             setProducts(res.data || []);
//         } catch (err) {
//             console.error("Failed to fetch products:", err);
//         }
//     };

//     useEffect(() => {
//         fetchProducts();
//     }, []);

//     const handleFilter = (e) => {
//         e.preventDefault();
//         fetchProducts();
//     };

//     const filteredAndSorted = products
//         .filter((p) =>
//             p.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
//         )
//         .sort((a, b) => {
//             if (sortOption === "price-asc") return a.price - b.price;
//             if (sortOption === "price-desc") return b.price - a.price;
//             if (sortOption === "title") return a.title.localeCompare(b.title);
//             return 0;
//         });

//     return (
//         <div className="page">
//             <h1>Products</h1>

//             <form
//                 onSubmit={handleFilter}
//                 className="search-bar"
//                 style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}
//             >
//                 <input
//                     className="input"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     placeholder="Search by title..."
//                 />
//                 <input
//                     className="input"
//                     type="number"
//                     value={categoryId}
//                     onChange={(e) => setCategoryId(e.target.value)}
//                     placeholder="Category ID"
//                     style={{ width: "140px" }}
//                 />
//                 <input
//                     className="input"
//                     type="number"
//                     value={minPrice}
//                     onChange={(e) => setMinPrice(e.target.value)}
//                     placeholder="Min price"
//                     style={{ width: "130px" }}
//                 />
//                 <input
//                     className="input"
//                     type="number"
//                     value={maxPrice}
//                     onChange={(e) => setMaxPrice(e.target.value)}
//                     placeholder="Max price"
//                     style={{ width: "130px" }}
//                 />
//                 <button type="submit" className="button">
//                     Filter
//                 </button>

//                 <select
//                     className="input"
//                     value={sortOption}
//                     onChange={(e) => setSortOption(e.target.value)}
//                 >
//                     <option value="">Sort by...</option>
//                     <option value="price-asc">Price ↑</option>
//                     <option value="price-desc">Price ↓</option>
//                     <option value="title">Title A-Z</option>
//                 </select>
//             </form>

//             {filteredAndSorted.length === 0 ? (
//                 <p>No products found.</p>
//             ) : (
//                 <div className="products-grid">
//                     {filteredAndSorted.map((product) => (
//                         <ProductCard key={product.id} product={product} />
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Products;