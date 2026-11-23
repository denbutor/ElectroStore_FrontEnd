import { useContext, useEffect, useState } from "react";
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
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isCompactViewport, setIsCompactViewport] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth <= 992 : false
    );

    const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

    useEffect(() => {
        const updateViewport = () => {
            setIsCompactViewport(window.innerWidth <= 992);
        };
        updateViewport();
        window.addEventListener("resize", updateViewport);
        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    useEffect(() => {
        if (!isCompactViewport) {
            setDrawerOpen(false);
        }
    }, [isCompactViewport]);

    useEffect(() => {
        if (!drawerOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setDrawerOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [drawerOpen]);

    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [drawerOpen]);

    const closeDrawer = () => setDrawerOpen(false);

    const handleLogoutClick = () => {
        closeDrawer();
        logout();
    };

    const renderNavLinks = (onItemClick) => (
        <>
            <NavLink to="/" end className="nav-link" onClick={onItemClick}>
                {t.nav.home}
            </NavLink>
            <NavLink to="/products" className="nav-link" onClick={onItemClick}>
                {t.nav.products}
            </NavLink>

            {isAuthenticated ? (
                <>
                    <NavLink to="/cart" className="nav-link" onClick={onItemClick}>
                        {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
                    </NavLink>
                    <NavLink to="/orders" className="nav-link" onClick={onItemClick}>
                        {t.nav.myOrders}
                    </NavLink>
                    <NavLink to="/profile" className="nav-link" onClick={onItemClick}>
                        {t.nav.profile}
                    </NavLink>
                    {isAdminOrManager && (
                        <NavLink
                            to="/admin/products"
                            className="nav-link"
                            onClick={onItemClick}
                        >
                            {t.nav.adminProducts}
                        </NavLink>
                    )}
                </>
            ) : (
                <>
                    <NavLink to="/login" className="nav-link" onClick={onItemClick}>
                        {t.nav.login}
                    </NavLink>
                    <NavLink to="/register" className="nav-link" onClick={onItemClick}>
                        {t.nav.register}
                    </NavLink>
                </>
            )}
        </>
    );

    return (
        <>
            <header className="header">
                <div className="container header-container">
                    <div className="header-left">
                        {isCompactViewport && (
                            <button
                                type="button"
                                className="mobile-menu-btn"
                                onClick={() => setDrawerOpen(true)}
                                aria-label="Open navigation menu"
                                aria-expanded={drawerOpen}
                            >
                                ☰
                            </button>
                        )}

                        <div className="logo">
                            <Link to="/" onClick={closeDrawer}>
                                <span className="logo-dot" aria-hidden="true" />
                                <span>ElectroStore</span>
                            </Link>
                        </div>

                        {!isCompactViewport && (
                            <nav className="nav nav-desktop" aria-label="Main navigation">
                                {renderNavLinks()}
                            </nav>
                        )}
                    </div>

                    <div className="header-right">
                        <select
                            aria-label="Language switcher"
                            value={language}
                            onChange={(e) => setManualLanguage(e.target.value)}
                            className="lang-select"
                        >
                            {UI_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {isCompactViewport
                                        ? lang.shortLabel
                                        : `${lang.shortLabel} · ${lang.nativeName}`}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={onToggleChat}
                            className={`ai-toggle-btn ${isChatOpen ? "is-open" : ""}`}
                        >
                            {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
                        </button>

                        {!isCompactViewport && isAuthenticated && (
                            <button
                                type="button"
                                onClick={logout}
                                className="nav-link nav-logout-btn header-logout-desktop"
                            >
                                {t.nav.logout}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {drawerOpen && (
                <div
                    className="drawer-backdrop"
                    onClick={closeDrawer}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`mobile-drawer ${drawerOpen ? "is-open" : ""}`}
                aria-label="Mobile navigation drawer"
            >
                <div className="mobile-drawer-top">
                    <div className="logo">
                        <Link to="/" onClick={closeDrawer}>
                            <span className="logo-dot" aria-hidden="true" />
                            <span>ElectroStore</span>
                        </Link>
                    </div>
                    <button
                        type="button"
                        className="drawer-close-btn"
                        onClick={closeDrawer}
                        aria-label="Close navigation menu"
                    >
                        ✕
                    </button>
                </div>

                <nav className="nav mobile-drawer-nav" aria-label="Drawer navigation">
                    {renderNavLinks(closeDrawer)}
                </nav>

                {isAuthenticated && (
                    <div className="mobile-drawer-footer">
                        <button
                            type="button"
                            onClick={handleLogoutClick}
                            className="nav-link nav-logout-btn mobile-drawer-logout"
                        >
                            {t.nav.logout}
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Header;
