import { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { LanguageContext } from "../context/LanguageContext";
import "./Header.css";

const Header = ({ isChatOpen, onToggleChat }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const { totalCount } = useContext(CartContext);
    const { language, setManualLanguage, t } = useContext(LanguageContext);

    const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

    return (
        <header className="header">
            <div className="container header-container">
                <div className="logo">
                    <Link to="/">ElectroStore</Link>
                </div>

                <nav className="nav" style={{ alignItems: "center", flexWrap: "wrap" }}>
                    <NavLink to="/" className="nav-link">
                        {t.nav.home}
                    </NavLink>
                    <NavLink to="/products" className="nav-link">
                        {t.nav.products}
                    </NavLink>

                    {isAuthenticated ? (
                        <>
                            <NavLink to="/cart" className="nav-link">
                                {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
                            </NavLink>
                            <NavLink to="/orders" className="nav-link">
                                {t.nav.myOrders}
                            </NavLink>
                            <NavLink to="/profile" className="nav-link">
                                {t.nav.profile}
                            </NavLink>
                            {isAdminOrManager && (
                                <NavLink to="/admin/products" className="nav-link">
                                    {t.nav.adminProducts}
                                </NavLink>
                            )}
                            <button
                                type="button"
                                onClick={logout}
                                className="nav-link"
                                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px" }}
                            >
                                {t.nav.logout}
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="nav-link">
                                {t.nav.login}
                            </NavLink>
                            <NavLink to="/register" className="nav-link">
                                {t.nav.register}
                            </NavLink>
                        </>
                    )}

                    {/* Ручний перемикач мови в хедері */}
                    <div
                        role="group"
                        aria-label="Language switcher"
                        style={{
                            display: "inline-flex",
                            border: "1px solid rgba(255,255,255,0.7)",
                            borderRadius: "6px",
                            overflow: "hidden",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setManualLanguage("uk")}
                            style={{
                                padding: "4px 8px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                                backgroundColor: language === "uk" ? "#ffffff" : "transparent",
                                color: language === "uk" ? "#0d6efd" : "#ffffff",
                            }}
                        >
                            UA
                        </button>
                        <button
                            type="button"
                            onClick={() => setManualLanguage("en")}
                            style={{
                                padding: "4px 8px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                                backgroundColor: language === "en" ? "#ffffff" : "transparent",
                                color: language === "en" ? "#0d6efd" : "#ffffff",
                            }}
                        >
                            EN
                        </button>
                    </div>

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
                        {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
                    </button>
                </nav>
            </div>
        </header>
    );
};

export default Header;
