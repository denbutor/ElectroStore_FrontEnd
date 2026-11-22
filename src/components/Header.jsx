import { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { LanguageContext } from "../context/LanguageContext";
import { UI_LANGUAGES } from "../config/languages";
import "./Header.css";

const Header = ({ isChatOpen, onToggleChat }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const { totalCount } = useContext(CartContext);
    const { language, setManualLanguage, t } = useContext(LanguageContext);

    const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

    return (
        <header className="header">
            <div
                className="container header-container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                }}
            >
                {/* Ліва частина: логотип + основна навігація */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                        minWidth: 0,
                    }}
                >
                    <div className="logo" style={{ flexShrink: 0 }}>
                        <Link to="/" style={{ whiteSpace: "nowrap" }}>
                            ElectroStore
                        </Link>
                    </div>

                    <nav
                        className="nav"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            flexWrap: "wrap",
                        }}
                    >
                        <NavLink to="/" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                            {t.nav.home}
                        </NavLink>
                        <NavLink to="/products" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                            {t.nav.products}
                        </NavLink>

                        {isAuthenticated ? (
                            <>
                                <NavLink to="/cart" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                                    {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
                                </NavLink>
                                <NavLink to="/orders" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                                    {t.nav.myOrders}
                                </NavLink>
                                <NavLink to="/profile" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                                    {t.nav.profile}
                                </NavLink>
                                {isAdminOrManager && (
                                    <NavLink
                                        to="/admin/products"
                                        className="nav-link"
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        {t.nav.adminProducts}
                                    </NavLink>
                                )}
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="nav-link"
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {t.nav.logout}
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                                    {t.nav.login}
                                </NavLink>
                                <NavLink to="/register" className="nav-link" style={{ whiteSpace: "nowrap" }}>
                                    {t.nav.register}
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>

                {/* Права частина: закріплені вибір мови та кнопка AI-асистента */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexShrink: 0,
                        marginLeft: "auto",
                    }}
                >
                    <select
                        aria-label="Language switcher"
                        value={language}
                        onChange={(e) => setManualLanguage(e.target.value)}
                        style={{
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.8)",
                            backgroundColor: "rgba(255,255,255,0.18)",
                            color: "#ffffff",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        {UI_LANGUAGES.map((lang) => (
                            <option
                                key={lang.code}
                                value={lang.code}
                                style={{ color: "#222222", backgroundColor: "#ffffff" }}
                            >
                                {lang.shortLabel} · {lang.nativeName}
                            </option>
                        ))}
                    </select>

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
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;