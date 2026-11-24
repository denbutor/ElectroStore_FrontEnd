import { createContext, useState, useCallback } from "react";
import { resolveImageUrl } from "../utils/image";

export const MAX_CHAT_PRODUCTS = 4;

const AiProductsContext = createContext();

const buildProductUrl = (productId) => {
    if (typeof window === "undefined") return `/products/${productId}`;
    return `${window.location.origin}/products/${productId}`;
};

export const AiProductsProvider = ({ children }) => {
    const [attachedProducts, setAttachedProducts] = useState([]);

    const attachProduct = useCallback((product, onOpenChat) => {
        if (!product || product.id === undefined || product.id === null) {
            return { added: false, limitReached: false, alreadyAttached: false };
        }

        const productId = Number(product.id);
        let outcome = { added: false, limitReached: false, alreadyAttached: false };

        setAttachedProducts((prev) => {
            if (prev.some((item) => Number(item.id) === productId)) {
                outcome = { added: false, limitReached: false, alreadyAttached: true };
                return prev;
            }
            if (prev.length >= MAX_CHAT_PRODUCTS) {
                outcome = { added: false, limitReached: true, alreadyAttached: false };
                return prev;
            }

            const normalized = {
                id: productId,
                title: product.title || `Product #${productId}`,
                price: product.price,
                category_name: product.category_name || "",
                imageUrl: resolveImageUrl(product.image_url, "https://placehold.co/120x120?text=No+Image"),
                url: buildProductUrl(productId),
                specifications:
                    product.specifications && typeof product.specifications === "object"
                        ? product.specifications
                        : null,
            };

            outcome = { added: true, limitReached: false, alreadyAttached: false };
            return [...prev, normalized];
        });

        onOpenChat?.();
        return outcome;
    }, []);

    const detachProduct = useCallback((productId) => {
        setAttachedProducts((prev) => prev.filter((item) => Number(item.id) !== Number(productId)));
    }, []);

    const clearAttachedProducts = useCallback(() => {
        setAttachedProducts([]);
    }, []);

    return (
        <AiProductsContext.Provider
            value={{
                attachedProducts,
                attachProduct,
                detachProduct,
                clearAttachedProducts,
            }}
        >
            {children}
        </AiProductsContext.Provider>
    );
};

export { AiProductsContext };