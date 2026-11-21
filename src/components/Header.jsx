import { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import "./Header.css";

const Header = ({ isChatOpen, onToggleChat }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const { totalCount } = useContext(CartContext);

    const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

    return (
        <header className="header">
            <div className="container header-container">
                <div className="logo">
                    <Link to="/">ElectroStore</Link>
                </div>

                <nav className="nav" style={{ alignItems: "center", flexWrap: "wrap" }}>
                    <NavLink to="/" className="nav-link">
                        Home
                    </NavLink>
                    <NavLink to="/products" className="nav-link">
                        Products
                    </NavLink>

                    {isAuthenticated ? (
                        <>
                            <NavLink to="/cart" className="nav-link">
                                Cart {totalCount > 0 ? `(${totalCount})` : ""}
                            </NavLink>
                            <NavLink to="/orders" className="nav-link">
                                My orders
                            </NavLink>
                            <NavLink to="/profile" className="nav-link">
                                Profile
                            </NavLink>
                            {isAdminOrManager && (
                                <NavLink to="/admin/products" className="nav-link">
                                    Admin Products
                                </NavLink>
                            )}
                            <button
                                type="button"
                                onClick={logout}
                                className="nav-link"
                                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px" }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="nav-link">
                                Login
                            </NavLink>
                            <NavLink to="/register" className="nav-link">
                                Register
                            </NavLink>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={onToggleChat}
                        style={{
                            backgroundColor: isChatOpen ? "#ffffff" : "rgba(255,255,255,0.2)",
                            color: isChatOpen ? "#0d6efd" : "#ffffff",
                            border: "1px solid #ffffff",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontWeight: "600",
                        }}
                    >
                        {isChatOpen ? "Hide AI" : "AI Assistant"}
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default Header;