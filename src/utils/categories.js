export const CATEGORY_LABELS = {
    1: "Processors",
    2: "Laptops",
    3: "Tablets",
    4: "Accessories",
    5: "Monitors",
};

export const getCategoryName = (categoryId) => {
    if (categoryId === null || categoryId === undefined || categoryId === "") {
        return "Uncategorized";
    }
    const id = Number(categoryId);
    return CATEGORY_LABELS[id] || `Category #${id}`;
};

export const getCategoryOptions = () =>
    Object.entries(CATEGORY_LABELS).map(([id, name]) => ({
        id: Number(id),
        name,
    }));