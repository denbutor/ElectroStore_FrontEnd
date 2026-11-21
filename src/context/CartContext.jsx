import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import cartService from "../services/cartService";
import productService from "../services/productService";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [cartLoading, setCartLoading] = useState(false);
    const { isAuthenticated } = useContext(AuthContext);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCartItems([]);
            return;
        }
        setCartLoading(true);
        try {
            const res = await cartService.getCart();
            // Формат бекенду: { "cart": { "5": 2, "8": 1 } }
            const cartMap = res.data?.cart || {};
            const entries = Object.entries(cartMap).filter(([, qty]) => qty > 0);

            if (entries.length === 0) {
                setCartItems([]);
                return;
            }

            const detailedItems = await Promise.all(
                entries.map(async ([productId, quantity]) => {
                    try {
                        const prodRes = await productService.getById(productId);
                        return {
                            product_id: Number(productId),
                            quantity: Number(quantity),
                            product: prodRes.data,
                        };
                    } catch {
                        return {
                            product_id: Number(productId),
                            quantity: Number(quantity),
                            product: {
                                id: Number(productId),
                                title: `Product #${productId}`,
                                price: 0,
                                image_url: null,
                            },
                        };
                    }
                })
            );

            setCartItems(detailedItems);
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setCartLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (productId, quantity = 1) => {
        await cartService.addToCart(productId, quantity);
        await fetchCart();
    };

    const removeFromCart = async (productId) => {
        // У Swagger є лише /add та /clear; якщо треба видалити 1 позицію, перезаписуємо інші
        const remaining = cartItems.filter((item) => item.product_id !== Number(productId));
        await cartService.clearCart();
        for (const item of remaining) {
            await cartService.addToCart(item.product_id, item.quantity);
        }
        await fetchCart();
    };

    const clearCart = async () => {
        await cartService.clearCart();
        setCartItems([]);
    };

    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartLoading,
                totalCount,
                fetchCart,
                addToCart,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };