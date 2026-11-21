import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminProducts from "./pages/AdminProducts";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import MyOrders from "./pages/MyOrders.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import AiChatDrawer from "./components/AiChatDrawer.jsx";

const App = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="app">
            <Header
                isChatOpen={isChatOpen}
                onToggleChat={() => setIsChatOpen((prev) => !prev)}
            />
            <AiChatDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/cart"
                        element={
                            <ProtectedRoute>
                                <Cart />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <ProtectedRoute>
                                <MyOrders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <MyProfile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute>
                                <Checkout />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <ProtectedRoute roles={["admin", "manager"]}>
                                <AdminProducts />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

export default App;