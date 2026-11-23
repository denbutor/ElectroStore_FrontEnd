import { useEffect, useState, useContext } from "react";
import productService from "../services/productService";
import ProductCard from "../components/ProductCard";
import { LanguageContext } from "../context/LanguageContext";

const Products = () => {
    const { t } = useContext(LanguageContext);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
        setIsMobileFiltersOpen(false);
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setCategoryId(value);
        fetchProducts(value);
    };

    const activeFiltersCount = [
        categoryId,
        minPrice,
        maxPrice,
        sortOption,
    ].filter(Boolean).length;

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
            <div className="page-header">
                <h1>{t.products.title}</h1>
            </div>

            <form onSubmit={handleFilter} className="search-bar">
                <div className="catalog-mobile-bar">
                    <input
                        className="input search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.products.searchPlaceholder}
                    />
                    <button
                        type="button"
                        className="button button-secondary mobile-filter-toggle-btn"
                        onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
                        aria-expanded={isMobileFiltersOpen}
                    >
                        <span>
                            {isMobileFiltersOpen
                                ? (t.products.hideFilters || "Сховати фільтри")
                                : (t.products.openFilters || "Фільтри")}
                        </span>
                        {activeFiltersCount > 0 && (
                            <span className="filter-count-badge">{activeFiltersCount}</span>
                        )}
                    </button>
                </div>

                <div
                    className={`catalog-filters-collapsible ${
                        isMobileFiltersOpen ? "is-open" : ""
                    }`}
                >
                    <select
                        className="input"
                        value={categoryId}
                        onChange={handleCategoryChange}
                    >
                        <option value="">{t.products.allCategories}</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <input
                        className="input price-input"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder={t.products.minPrice}
                    />

                    <input
                        className="input price-input"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder={t.products.maxPrice}
                    />

                    <select
                        className="input"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option value="">{t.products.sortBy}</option>
                        <option value="price-asc">{t.products.priceAsc}</option>
                        <option value="price-desc">{t.products.priceDesc}</option>
                        <option value="title">{t.products.titleAsc}</option>
                    </select>

                    <button type="submit" className="button">
                        {t.products.filter}
                    </button>
                </div>
            </form>

            {filteredAndSorted.length === 0 ? (
                <p>{t.products.notFound}</p>
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
