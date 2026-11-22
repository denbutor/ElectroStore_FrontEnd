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

// import { useContext, useEffect, useState } from "react";
// import { Link, NavLink } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";
// import { CartContext } from "../context/CartContext";
// import { LanguageContext } from "../context/LanguageContext";
// import { UI_LANGUAGES } from "../config/languages";
// import "./Header.css";

// const Header = ({ isChatOpen, onToggleChat }) => {
//     const { isAuthenticated, user, logout } = useContext(AuthContext);
//     const { totalCount } = useContext(CartContext);
//     const { language, setManualLanguage, t } = useContext(LanguageContext);
//     const [drawerOpen, setDrawerOpen] = useState(false);

//     const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

//     useEffect(() => {
//         if (!drawerOpen) return;
//         const handleKeyDown = (e) => {
//             if (e.key === "Escape") {
//                 setDrawerOpen(false);
//             }
//         };
//         window.addEventListener("keydown", handleKeyDown);
//         return () => window.removeEventListener("keydown", handleKeyDown);
//     }, [drawerOpen]);

//     useEffect(() => {
//         const prevOverflow = document.body.style.overflow;
//         if (drawerOpen) {
//             document.body.style.overflow = "hidden";
//         }
//         return () => {
//             document.body.style.overflow = prevOverflow;
//         };
//     }, [drawerOpen]);

//     const closeDrawer = () => setDrawerOpen(false);

//     const handleLogoutClick = () => {
//         closeDrawer();
//         logout();
//     };

//     const renderNavLinks = (onItemClick) => (
//         <>
//             <NavLink to="/" end className="nav-link" onClick={onItemClick}>
//                 {t.nav.home}
//             </NavLink>
//             <NavLink to="/products" className="nav-link" onClick={onItemClick}>
//                 {t.nav.products}
//             </NavLink>

//             {isAuthenticated ? (
//                 <>
//                     <NavLink to="/cart" className="nav-link" onClick={onItemClick}>
//                         {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
//                     </NavLink>
//                     <NavLink to="/orders" className="nav-link" onClick={onItemClick}>
//                         {t.nav.myOrders}
//                     </NavLink>
//                     <NavLink to="/profile" className="nav-link" onClick={onItemClick}>
//                         {t.nav.profile}
//                     </NavLink>
//                     {isAdminOrManager && (
//                         <NavLink
//                             to="/admin/products"
//                             className="nav-link"
//                             onClick={onItemClick}
//                         >
//                             {t.nav.adminProducts}
//                         </NavLink>
//                     )}
//                 </>
//             ) : (
//                 <>
//                     <NavLink to="/login" className="nav-link" onClick={onItemClick}>
//                         {t.nav.login}
//                     </NavLink>
//                     <NavLink to="/register" className="nav-link" onClick={onItemClick}>
//                         {t.nav.register}
//                     </NavLink>
//                 </>
//             )}
//         </>
//     );

//     return (
//         <>
//             <header className="header">
//                 <div className="container header-container">
//                     <div className="header-left">
//                         <button
//                             type="button"
//                             className="mobile-menu-btn"
//                             onClick={() => setDrawerOpen(true)}
//                             aria-label="Open navigation menu"
//                             aria-expanded={drawerOpen}
//                         >
//                             ☰
//                         </button>

//                         <div className="logo">
//                             <Link to="/" onClick={closeDrawer}>
//                                 <span className="logo-dot" aria-hidden="true" />
//                                 <span>ElectroStore</span>
//                             </Link>
//                         </div>

//                         <nav className="nav nav-desktop" aria-label="Main navigation">
//                             {renderNavLinks()}
//                         </nav>
//                     </div>

//                     <div className="header-right">
//                         <select
//                             aria-label="Language switcher"
//                             value={language}
//                             onChange={(e) => setManualLanguage(e.target.value)}
//                             className="lang-select"
//                         >
//                             {UI_LANGUAGES.map((lang) => (
//                                 <option key={lang.code} value={lang.code}>
//                                     {lang.shortLabel} · {lang.nativeName}
//                                 </option>
//                             ))}
//                         </select>

//                         <button
//                             type="button"
//                             onClick={onToggleChat}
//                             className={`ai-toggle-btn ${isChatOpen ? "is-open" : ""}`}
//                         >
//                             {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
//                         </button>

//                         {isAuthenticated && (
//                             <button
//                                 type="button"
//                                 onClick={logout}
//                                 className="nav-link nav-logout-btn header-logout-desktop"
//                             >
//                                 {t.nav.logout}
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </header>

//             {drawerOpen && (
//                 <div
//                     className="drawer-backdrop"
//                     onClick={closeDrawer}
//                     aria-hidden="true"
//                 />
//             )}

//             <aside
//                 className={`mobile-drawer ${drawerOpen ? "is-open" : ""}`}
//                 aria-label="Mobile navigation drawer"
//             >
//                 <div className="mobile-drawer-top">
//                     <div className="logo">
//                         <Link to="/" onClick={closeDrawer}>
//                             <span className="logo-dot" aria-hidden="true" />
//                             <span>ElectroStore</span>
//                         </Link>
//                     </div>
//                     <button
//                         type="button"
//                         className="drawer-close-btn"
//                         onClick={closeDrawer}
//                         aria-label="Close navigation menu"
//                     >
//                         ✕
//                     </button>
//                 </div>

//                 <nav className="nav mobile-drawer-nav" aria-label="Drawer navigation">
//                     {renderNavLinks(closeDrawer)}
//                 </nav>

//                 {isAuthenticated && (
//                     <div className="mobile-drawer-footer">
//                         <button
//                             type="button"
//                             onClick={handleLogoutClick}
//                             className="nav-link nav-logout-btn mobile-drawer-logout"
//                         >
//                             {t.nav.logout}
//                         </button>
//                     </div>
//                 )}
//             </aside>
//         </>
//     );
// };

// export default Header;

// // import { useContext } from "react";
// // import { Link, NavLink } from "react-router-dom";
// // import { AuthContext } from "../context/AuthContext";
// // import { CartContext } from "../context/CartContext";
// // import { LanguageContext } from "../context/LanguageContext";
// // import { UI_LANGUAGES } from "../config/languages";
// // import "./Header.css";

// // const Header = ({ isChatOpen, onToggleChat }) => {
// //     const { isAuthenticated, user, logout } = useContext(AuthContext);
// //     const { totalCount } = useContext(CartContext);
// //     const { language, setManualLanguage, t } = useContext(LanguageContext);

// //     const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

// //     return (
// //         <header className="header">
// //             <div className="container header-container">
// //                 <div className="header-left">
// //                     <div className="logo">
// //                         <Link to="/">
// //                             <span className="logo-dot" aria-hidden="true" />
// //                             <span>ElectroStore</span>
// //                         </Link>
// //                     </div>

// //                     <nav className="nav" aria-label="Main navigation">
// //                         <NavLink to="/" className="nav-link">
// //                             {t.nav.home}
// //                         </NavLink>
// //                         <NavLink to="/products" className="nav-link">
// //                             {t.nav.products}
// //                         </NavLink>

// //                         {isAuthenticated ? (
// //                             <>
// //                                 <NavLink to="/cart" className="nav-link">
// //                                     {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
// //                                 </NavLink>
// //                                 <NavLink to="/orders" className="nav-link">
// //                                     {t.nav.myOrders}
// //                                 </NavLink>
// //                                 <NavLink to="/profile" className="nav-link">
// //                                     {t.nav.profile}
// //                                 </NavLink>
// //                                 {isAdminOrManager && (
// //                                     <NavLink to="/admin/products" className="nav-link">
// //                                         {t.nav.adminProducts}
// //                                     </NavLink>
// //                                 )}
// //                                 <button
// //                                     type="button"
// //                                     onClick={logout}
// //                                     className="nav-link nav-logout-btn"
// //                                 >
// //                                     {t.nav.logout}
// //                                 </button>
// //                             </>
// //                         ) : (
// //                             <>
// //                                 <NavLink to="/login" className="nav-link">
// //                                     {t.nav.login}
// //                                 </NavLink>
// //                                 <NavLink to="/register" className="nav-link">
// //                                     {t.nav.register}
// //                                 </NavLink>
// //                             </>
// //                         )}
// //                     </nav>
// //                 </div>

// //                 <div className="header-right">
// //                     <select
// //                         aria-label="Language switcher"
// //                         value={language}
// //                         onChange={(e) => setManualLanguage(e.target.value)}
// //                         className="lang-select"
// //                     >
// //                         {UI_LANGUAGES.map((lang) => (
// //                             <option key={lang.code} value={lang.code}>
// //                                 {lang.shortLabel} · {lang.nativeName}
// //                             </option>
// //                         ))}
// //                     </select>

// //                     <button
// //                         type="button"
// //                         onClick={onToggleChat}
// //                         className={`ai-toggle-btn ${isChatOpen ? "is-open" : ""}`}
// //                     >
// //                         {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
// //                     </button>
// //                 </div>
// //             </div>
// //         </header>
// //     );
// // };

// // export default Header;

// // // import { useEffect, useState } from "react";

// // // const NAV_ITEMS = [
// // //   { label: "Головна", href: "/" },
// // //   { label: "Каталог", href: "/catalog" },
// // //   { label: "Кошик", href: "/cart" },
// // //   { label: "Мої замовлення", href: "/orders" },
// // //   { label: "Профіль", href: "/profile" },
// // //   { label: "Адмін: Товари", href: "/admin/products" },
// // // ];

// // // export function Header({
// // //   currentPath = "/",
// // //   lang = "UA",
// // //   onLangChange,
// // //   onNavigate,
// // //   isAiVisible = true,
// // //   onToggleAi,
// // //   onLogout,
// // // }) {
// // //   const [menuOpen, setMenuOpen] = useState(false);

// // //   useEffect(() => {
// // //     if (!menuOpen) return;
// // //     const handleKeyDown = (e) => {
// // //       if (e.key === "Escape") setMenuOpen(false);
// // //     };
// // //     window.addEventListener("keydown", handleKeyDown);
// // //     return () => window.removeEventListener("keydown", handleKeyDown);
// // //   }, [menuOpen]);

// // //   useEffect(() => {
// // //     const prevOverflow = document.body.style.overflow;
// // //     if (menuOpen) {
// // //       document.body.style.overflow = "hidden";
// // //     }
// // //     return () => {
// // //       document.body.style.overflow = prevOverflow;
// // //     };
// // //   }, [menuOpen]);

// // //   const handleNavClick = (e, href) => {
// // //     setMenuOpen(false);
// // //     if (typeof onNavigate === "function") {
// // //       e.preventDefault();
// // //       onNavigate(href);
// // //     }
// // //   };

// // //   const activePath =
// // //     typeof window !== "undefined" && !currentPath ? window.location.pathname : currentPath;

// // //   return (
// // //     <>
// // //       <style>{`
// // //         .es-header {
// // //           position: sticky;
// // //           top: 0;
// // //           z-index: 100;
// // //           height: 56px;
// // //           width: 100%;
// // //           box-sizing: border-box;
// // //           background: #182235;
// // //           color: #ffffff;
// // //           border-bottom: 1px solid rgba(255, 255, 255, 0.12);
// // //           padding: 0 16px;
// // //           display: flex;
// // //           align-items: center;
// // //           justify-content: space-between;
// // //           gap: 12px;
// // //           font-family: inherit;
// // //         }
// // //         .es-header-left {
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 12px;
// // //           min-width: 0;
// // //         }
// // //         .es-menu-btn {
// // //           display: inline-flex;
// // //           align-items: center;
// // //           justify-content: center;
// // //           width: 36px;
// // //           height: 36px;
// // //           border-radius: 8px;
// // //           border: 1px solid rgba(255, 255, 255, 0.16);
// // //           background: rgba(255, 255, 255, 0.08);
// // //           color: #ffffff;
// // //           cursor: pointer;
// // //           font-size: 18px;
// // //           line-height: 1;
// // //           flex-shrink: 0;
// // //         }
// // //         .es-brand {
// // //           display: inline-flex;
// // //           align-items: center;
// // //           gap: 8px;
// // //           color: #ffffff;
// // //           text-decoration: none;
// // //           font-weight: 700;
// // //           font-size: 18px;
// // //           white-space: nowrap;
// // //           flex-shrink: 0;
// // //         }
// // //         .es-brand-dot {
// // //           width: 10px;
// // //           height: 10px;
// // //           border-radius: 999px;
// // //           background: #38bdf8;
// // //           flex-shrink: 0;
// // //         }
// // //         .es-nav-desktop {
// // //           display: none;
// // //           align-items: center;
// // //           gap: 6px;
// // //           margin-left: 12px;
// // //         }
// // //         .es-nav-link {
// // //           color: #e2e8f0;
// // //           text-decoration: none;
// // //           font-size: 14px;
// // //           font-weight: 500;
// // //           padding: 6px 10px;
// // //           border-radius: 8px;
// // //           white-space: nowrap;
// // //         }
// // //         .es-nav-link:hover,
// // //         .es-nav-link.active {
// // //           background: #2b3c5c;
// // //           color: #ffffff;
// // //         }
// // //         .es-header-right {
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 8px;
// // //           flex-shrink: 0;
// // //         }
// // //         .es-lang-select {
// // //           height: 34px;
// // //           padding: 0 8px;
// // //           border-radius: 8px;
// // //           border: 1px solid rgba(255, 255, 255, 0.18);
// // //           background: #24324b;
// // //           color: #ffffff;
// // //           font-size: 13px;
// // //           font-weight: 600;
// // //           cursor: pointer;
// // //         }
// // //         .es-ai-btn {
// // //           height: 34px;
// // //           padding: 0 12px;
// // //           border-radius: 8px;
// // //           border: none;
// // //           background: #ffffff;
// // //           color: #182235;
// // //           font-size: 13px;
// // //           font-weight: 700;
// // //           cursor: pointer;
// // //           white-space: nowrap;
// // //         }
// // //         .es-logout-desktop {
// // //           display: none;
// // //           height: 34px;
// // //           padding: 0 10px;
// // //           border-radius: 8px;
// // //           border: none;
// // //           background: transparent;
// // //           color: #e2e8f0;
// // //           font-size: 13px;
// // //           cursor: pointer;
// // //           white-space: nowrap;
// // //         }
// // //         .es-logout-desktop:hover {
// // //           background: rgba(255, 255, 255, 0.08);
// // //           color: #ffffff;
// // //         }
// // //         .es-backdrop {
// // //           position: fixed;
// // //           inset: 0;
// // //           z-index: 140;
// // //           background: rgba(15, 23, 42, 0.55);
// // //         }
// // //         .es-drawer {
// // //           position: fixed;
// // //           top: 0;
// // //           left: 0;
// // //           z-index: 150;
// // //           width: 280px;
// // //           max-width: 82vw;
// // //           height: 100vh;
// // //           box-sizing: border-box;
// // //           background: #182235;
// // //           color: #ffffff;
// // //           border-right: 1px solid rgba(255, 255, 255, 0.12);
// // //           box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
// // //           transform: translateX(-100%);
// // //           transition: transform 0.2s ease;
// // //           display: flex;
// // //           flex-direction: column;
// // //           justify-content: space-between;
// // //         }
// // //         .es-drawer.open {
// // //           transform: translateX(0);
// // //         }
// // //         .es-drawer-top {
// // //           height: 56px;
// // //           padding: 0 16px;
// // //           border-bottom: 1px solid rgba(255, 255, 255, 0.12);
// // //           display: flex;
// // //           align-items: center;
// // //           justify-content: space-between;
// // //         }
// // //         .es-close-btn {
// // //           width: 32px;
// // //           height: 32px;
// // //           border-radius: 8px;
// // //           border: 1px solid rgba(255, 255, 255, 0.16);
// // //           background: rgba(255, 255, 255, 0.08);
// // //           color: #ffffff;
// // //           cursor: pointer;
// // //           font-size: 14px;
// // //         }
// // //         .es-drawer-nav {
// // //           padding: 12px;
// // //           display: flex;
// // //           flex-direction: column;
// // //           gap: 4px;
// // //         }
// // //         .es-drawer-link {
// // //           display: block;
// // //           padding: 10px 12px;
// // //           border-radius: 8px;
// // //           color: #e2e8f0;
// // //           text-decoration: none;
// // //           font-size: 14px;
// // //           font-weight: 500;
// // //         }
// // //         .es-drawer-link:hover,
// // //         .es-drawer-link.active {
// // //           background: #2b3c5c;
// // //           color: #ffffff;
// // //         }
// // //         .es-drawer-footer {
// // //           padding: 12px;
// // //           border-top: 1px solid rgba(255, 255, 255, 0.12);
// // //         }
// // //         .es-drawer-logout {
// // //           width: 100%;
// // //           padding: 10px 12px;
// // //           border-radius: 8px;
// // //           border: none;
// // //           background: transparent;
// // //           color: #fda4af;
// // //           text-align: left;
// // //           font-size: 14px;
// // //           font-weight: 600;
// // //           cursor: pointer;
// // //         }
// // //         @media (min-width: 1024px) {
// // //           .es-menu-btn {
// // //             display: none;
// // //           }
// // //           .es-nav-desktop {
// // //             display: flex;
// // //           }
// // //           .es-logout-desktop {
// // //             display: inline-flex;
// // //             align-items: center;
// // //           }
// // //         }
// // //       `}</style>

// // //       <header className="es-header">
// // //         <div className="es-header-left">
// // //           <button
// // //             type="button"
// // //             className="es-menu-btn"
// // //             onClick={() => setMenuOpen(true)}
// // //             aria-label="Відкрити меню сторінок"
// // //             aria-expanded={menuOpen}
// // //           >
// // //             ☰
// // //           </button>

// // //           <a
// // //             href="/"
// // //             className="es-brand"
// // //             onClick={(e) => handleNavClick(e, "/")}
// // //           >
// // //             <span className="es-brand-dot" />
// // //             <span>ElectroStore</span>
// // //           </a>

// // //           <nav className="es-nav-desktop" aria-label="Основна навігація">
// // //             {NAV_ITEMS.map((item) => (
// // //               <a
// // //                 key={item.href}
// // //                 href={item.href}
// // //                 onClick={(e) => handleNavClick(e, item.href)}
// // //                 className={`es-nav-link ${activePath === item.href ? "active" : ""}`}
// // //               >
// // //                 {item.label}
// // //               </a>
// // //             ))}
// // //           </nav>
// // //         </div>

// // //         <div className="es-header-right">
// // //           <select
// // //             aria-label="Вибір мови"
// // //             className="es-lang-select"
// // //             value={lang}
// // //             onChange={(e) => onLangChange?.(e.target.value)}
// // //           >
// // //             <option value="UA">UA</option>
// // //             <option value="EN">EN</option>
// // //             <option value="DE">DE</option>
// // //           </select>

// // //           <button type="button" className="es-ai-btn" onClick={onToggleAi}>
// // //             {isAiVisible ? "Сховати AI" : "Показати AI"}
// // //           </button>

// // //           <button type="button" className="es-logout-desktop" onClick={onLogout}>
// // //             Вийти
// // //           </button>
// // //         </div>
// // //       </header>

// // //       {menuOpen && (
// // //         <div className="es-backdrop" onClick={() => setMenuOpen(false)} />
// // //       )}

// // //       <aside
// // //         aria-label="Виповзаюче меню сторінок"
// // //         className={`es-drawer ${menuOpen ? "open" : ""}`}
// // //       >
// // //         <div>
// // //           <div className="es-drawer-top">
// // //             <div className="es-brand">
// // //               <span className="es-brand-dot" />
// // //               <span>ElectroStore</span>
// // //             </div>
// // //             <button
// // //               type="button"
// // //               className="es-close-btn"
// // //               onClick={() => setMenuOpen(false)}
// // //               aria-label="Закрити меню"
// // //             >
// // //               ✕
// // //             </button>
// // //           </div>

// // //           <nav className="es-drawer-nav">
// // //             {NAV_ITEMS.map((item) => (
// // //               <a
// // //                 key={item.href}
// // //                 href={item.href}
// // //                 onClick={(e) => handleNavClick(e, item.href)}
// // //                 className={`es-drawer-link ${activePath === item.href ? "active" : ""}`}
// // //               >
// // //                 {item.label}
// // //               </a>
// // //             ))}
// // //           </nav>
// // //         </div>

// // //         <div className="es-drawer-footer">
// // //           <button
// // //             type="button"
// // //             className="es-drawer-logout"
// // //             onClick={() => {
// // //               setMenuOpen(false);
// // //               onLogout?.();
// // //             }}
// // //           >
// // //             Вийти
// // //           </button>
// // //         </div>
// // //       </aside>
// // //     </>
// // //   );
// // // }

// // // export default Header;

// // // // import { useEffect, useState } from "react";

// // // // const NAV_ITEMS = [
// // // //   { label: "Головна", href: "/" },
// // // //   { label: "Каталог", href: "/catalog" },
// // // //   { label: "Кошик", href: "/cart" },
// // // //   { label: "Мої замовлення", href: "/orders" },
// // // //   { label: "Профіль", href: "/profile" },
// // // //   { label: "Адмін: Товари", href: "/admin/products" },
// // // // ];

// // // // export function Header({
// // // //   currentPath = "/",
// // // //   lang = "UA",
// // // //   onLangChange,
// // // //   isAiVisible = true,
// // // //   onToggleAi,
// // // //   onLogout,
// // // // }) {
// // // //   const [menuOpen, setMenuOpen] = useState(false);

// // // //   useEffect(() => {
// // // //     if (!menuOpen) return;
// // // //     const handleKeyDown = (e) => {
// // // //       if (e.key === "Escape") setMenuOpen(false);
// // // //     };
// // // //     window.addEventListener("keydown", handleKeyDown);
// // // //     return () => window.removeEventListener("keydown", handleKeyDown);
// // // //   }, [menuOpen]);

// // // //   useEffect(() => {
// // // //     document.body.style.overflow = menuOpen ? "hidden" : "";
// // // //     return () => {
// // // //       document.body.style.overflow = "";
// // // //     };
// // // //   }, [menuOpen]);

// // // //   return (
// // // //     <>
// // // //       <style>{`
// // // //         .es-header {
// // // //           position: sticky;
// // // //           top: 0;
// // // //           z-index: 100;
// // // //           height: 56px;
// // // //           width: 100%;
// // // //           box-sizing: border-box;
// // // //           background: #182235;
// // // //           color: #ffffff;
// // // //           border-bottom: 1px solid rgba(255, 255, 255, 0.12);
// // // //           padding: 0 16px;
// // // //           display: flex;
// // // //           align-items: center;
// // // //           justify-content: space-between;
// // // //           gap: 12px;
// // // //           font-family: inherit;
// // // //         }
// // // //         .es-header-left {
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 12px;
// // // //           min-width: 0;
// // // //         }
// // // //         .es-menu-btn {
// // // //           display: inline-flex;
// // // //           align-items: center;
// // // //           justify-content: center;
// // // //           width: 36px;
// // // //           height: 36px;
// // // //           border-radius: 8px;
// // // //           border: 1px solid rgba(255, 255, 255, 0.16);
// // // //           background: rgba(255, 255, 255, 0.08);
// // // //           color: #ffffff;
// // // //           cursor: pointer;
// // // //           font-size: 18px;
// // // //           line-height: 1;
// // // //           flex-shrink: 0;
// // // //         }
// // // //         .es-brand {
// // // //           display: inline-flex;
// // // //           align-items: center;
// // // //           gap: 8px;
// // // //           color: #ffffff;
// // // //           text-decoration: none;
// // // //           font-weight: 700;
// // // //           font-size: 18px;
// // // //           white-space: nowrap;
// // // //           flex-shrink: 0;
// // // //         }
// // // //         .es-brand-dot {
// // // //           width: 10px;
// // // //           height: 10px;
// // // //           border-radius: 999px;
// // // //           background: #38bdf8;
// // // //           flex-shrink: 0;
// // // //         }
// // // //         .es-nav-desktop {
// // // //           display: none;
// // // //           align-items: center;
// // // //           gap: 6px;
// // // //           margin-left: 12px;
// // // //         }
// // // //         .es-nav-link {
// // // //           color: #e2e8f0;
// // // //           text-decoration: none;
// // // //           font-size: 14px;
// // // //           font-weight: 500;
// // // //           padding: 6px 10px;
// // // //           border-radius: 8px;
// // // //           white-space: nowrap;
// // // //         }
// // // //         .es-nav-link:hover,
// // // //         .es-nav-link.active {
// // // //           background: #2b3c5c;
// // // //           color: #ffffff;
// // // //         }
// // // //         .es-header-right {
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 8px;
// // // //           flex-shrink: 0;
// // // //         }
// // // //         .es-lang-select {
// // // //           height: 34px;
// // // //           padding: 0 8px;
// // // //           border-radius: 8px;
// // // //           border: 1px solid rgba(255, 255, 255, 0.18);
// // // //           background: #24324b;
// // // //           color: #ffffff;
// // // //           font-size: 13px;
// // // //           font-weight: 600;
// // // //           cursor: pointer;
// // // //         }
// // // //         .es-ai-btn {
// // // //           height: 34px;
// // // //           padding: 0 12px;
// // // //           border-radius: 8px;
// // // //           border: none;
// // // //           background: #ffffff;
// // // //           color: #182235;
// // // //           font-size: 13px;
// // // //           font-weight: 700;
// // // //           cursor: pointer;
// // // //           white-space: nowrap;
// // // //         }
// // // //         .es-logout-desktop {
// // // //           display: none;
// // // //           height: 34px;
// // // //           padding: 0 10px;
// // // //           border-radius: 8px;
// // // //           border: none;
// // // //           background: transparent;
// // // //           color: #e2e8f0;
// // // //           font-size: 13px;
// // // //           cursor: pointer;
// // // //           white-space: nowrap;
// // // //         }
// // // //         .es-logout-desktop:hover {
// // // //           background: rgba(255, 255, 255, 0.08);
// // // //           color: #ffffff;
// // // //         }
// // // //         .es-backdrop {
// // // //           position: fixed;
// // // //           inset: 0;
// // // //           z-index: 140;
// // // //           background: rgba(15, 23, 42, 0.55);
// // // //         }
// // // //         .es-drawer {
// // // //           position: fixed;
// // // //           top: 0;
// // // //           left: 0;
// // // //           z-index: 150;
// // // //           width: 280px;
// // // //           max-width: 82vw;
// // // //           height: 100vh;
// // // //           box-sizing: border-box;
// // // //           background: #182235;
// // // //           color: #ffffff;
// // // //           border-right: 1px solid rgba(255, 255, 255, 0.12);
// // // //           box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
// // // //           transform: translateX(-100%);
// // // //           transition: transform 0.2s ease;
// // // //           display: flex;
// // // //           flex-direction: column;
// // // //           justify-content: space-between;
// // // //         }
// // // //         .es-drawer.open {
// // // //           transform: translateX(0);
// // // //         }
// // // //         .es-drawer-top {
// // // //           height: 56px;
// // // //           padding: 0 16px;
// // // //           border-bottom: 1px solid rgba(255, 255, 255, 0.12);
// // // //           display: flex;
// // // //           align-items: center;
// // // //           justify-content: space-between;
// // // //         }
// // // //         .es-close-btn {
// // // //           width: 32px;
// // // //           height: 32px;
// // // //           border-radius: 8px;
// // // //           border: 1px solid rgba(255, 255, 255, 0.16);
// // // //           background: rgba(255, 255, 255, 0.08);
// // // //           color: #ffffff;
// // // //           cursor: pointer;
// // // //           font-size: 14px;
// // // //         }
// // // //         .es-drawer-nav {
// // // //           padding: 12px;
// // // //           display: flex;
// // // //           flex-direction: column;
// // // //           gap: 4px;
// // // //         }
// // // //         .es-drawer-link {
// // // //           display: block;
// // // //           padding: 10px 12px;
// // // //           border-radius: 8px;
// // // //           color: #e2e8f0;
// // // //           text-decoration: none;
// // // //           font-size: 14px;
// // // //           font-weight: 500;
// // // //         }
// // // //         .es-drawer-link:hover,
// // // //         .es-drawer-link.active {
// // // //           background: #2b3c5c;
// // // //           color: #ffffff;
// // // //         }
// // // //         .es-drawer-footer {
// // // //           padding: 12px;
// // // //           border-top: 1px solid rgba(255, 255, 255, 0.12);
// // // //         }
// // // //         .es-drawer-logout {
// // // //           width: 100%;
// // // //           padding: 10px 12px;
// // // //           border-radius: 8px;
// // // //           border: none;
// // // //           background: transparent;
// // // //           color: #fda4af;
// // // //           text-align: left;
// // // //           font-size: 14px;
// // // //           font-weight: 600;
// // // //           cursor: pointer;
// // // //         }
// // // //         @media (min-width: 1024px) {
// // // //           .es-menu-btn {
// // // //             display: none;
// // // //           }
// // // //           .es-nav-desktop {
// // // //             display: flex;
// // // //           }
// // // //           .es-logout-desktop {
// // // //             display: inline-flex;
// // // //             align-items: center;
// // // //           }
// // // //         }
// // // //       `}</style>

// // // //       <header className="es-header">
// // // //         <div className="es-header-left">
// // // //           <button
// // // //             type="button"
// // // //             className="es-menu-btn"
// // // //             onClick={() => setMenuOpen(true)}
// // // //             aria-label="Відкрити меню сторінок"
// // // //             aria-expanded={menuOpen}
// // // //           >
// // // //             ☰
// // // //           </button>

// // // //           <a href="/" className="es-brand">
// // // //             <span className="es-brand-dot" />
// // // //             <span>ElectroStore</span>
// // // //           </a>

// // // //           <nav className="es-nav-desktop" aria-label="Основна навігація">
// // // //             {NAV_ITEMS.map((item) => (
// // // //               <a
// // // //                 key={item.href}
// // // //                 href={item.href}
// // // //                 className={`es-nav-link ${currentPath === item.href ? "active" : ""}`}
// // // //               >
// // // //                 {item.label}
// // // //               </a>
// // // //             ))}
// // // //           </nav>
// // // //         </div>

// // // //         <div className="es-header-right">
// // // //           <select
// // // //             aria-label="Вибір мови"
// // // //             className="es-lang-select"
// // // //             value={lang}
// // // //             onChange={(e) => onLangChange?.(e.target.value)}
// // // //           >
// // // //             <option value="UA">UA</option>
// // // //             <option value="EN">EN</option>
// // // //             <option value="DE">DE</option>
// // // //           </select>

// // // //           <button type="button" className="es-ai-btn" onClick={onToggleAi}>
// // // //             {isAiVisible ? "Сховати AI" : "Показати AI"}
// // // //           </button>

// // // //           <button type="button" className="es-logout-desktop" onClick={onLogout}>
// // // //             Вийти
// // // //           </button>
// // // //         </div>
// // // //       </header>

// // // //       {menuOpen && (
// // // //         <div className="es-backdrop" onClick={() => setMenuOpen(false)} />
// // // //       )}

// // // //       <aside
// // // //         aria-label="Виповзаюче меню сторінок"
// // // //         className={`es-drawer ${menuOpen ? "open" : ""}`}
// // // //       >
// // // //         <div>
// // // //           <div className="es-drawer-top">
// // // //             <div className="es-brand">
// // // //               <span className="es-brand-dot" />
// // // //               <span>ElectroStore</span>
// // // //             </div>
// // // //             <button
// // // //               type="button"
// // // //               className="es-close-btn"
// // // //               onClick={() => setMenuOpen(false)}
// // // //               aria-label="Закрити меню"
// // // //             >
// // // //               ✕
// // // //             </button>
// // // //           </div>

// // // //           <nav className="es-drawer-nav">
// // // //             {NAV_ITEMS.map((item) => (
// // // //               <a
// // // //                 key={item.href}
// // // //                 href={item.href}
// // // //                 onClick={() => setMenuOpen(false)}
// // // //                 className={`es-drawer-link ${currentPath === item.href ? "active" : ""}`}
// // // //               >
// // // //                 {item.label}
// // // //               </a>
// // // //             ))}
// // // //           </nav>
// // // //         </div>

// // // //         <div className="es-drawer-footer">
// // // //           <button
// // // //             type="button"
// // // //             className="es-drawer-logout"
// // // //             onClick={() => {
// // // //               setMenuOpen(false);
// // // //               onLogout?.();
// // // //             }}
// // // //           >
// // // //             Вийти
// // // //           </button>
// // // //         </div>
// // // //       </aside>
// // // //     </>
// // // //   );
// // // // }

// // // // export default Header;



// // // // // import { useContext } from "react";
// // // // // import { Link, NavLink } from "react-router-dom";
// // // // // import { AuthContext } from "../context/AuthContext";
// // // // // import { CartContext } from "../context/CartContext";
// // // // // import { LanguageContext } from "../context/LanguageContext";
// // // // // import { UI_LANGUAGES } from "../config/languages";
// // // // // import "./Header.css";

// // // // // const Header = ({ isChatOpen, onToggleChat }) => {
// // // // //     const { isAuthenticated, user, logout } = useContext(AuthContext);
// // // // //     const { totalCount } = useContext(CartContext);
// // // // //     const { language, setManualLanguage, t } = useContext(LanguageContext);

// // // // //     const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

// // // // //     return (
// // // // //         <header className="header">
// // // // //             <div className="container header-container">
// // // // //                 <div className="header-left">
// // // // //                     <div className="logo">
// // // // //                         <Link to="/">
// // // // //                             <span className="logo-dot" aria-hidden="true" />
// // // // //                             <span>ElectroStore</span>
// // // // //                         </Link>
// // // // //                     </div>

// // // // //                     <nav className="nav" aria-label="Main navigation">
// // // // //                         <NavLink to="/" className="nav-link">
// // // // //                             {t.nav.home}
// // // // //                         </NavLink>
// // // // //                         <NavLink to="/products" className="nav-link">
// // // // //                             {t.nav.products}
// // // // //                         </NavLink>

// // // // //                         {isAuthenticated ? (
// // // // //                             <>
// // // // //                                 <NavLink to="/cart" className="nav-link">
// // // // //                                     {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
// // // // //                                 </NavLink>
// // // // //                                 <NavLink to="/orders" className="nav-link">
// // // // //                                     {t.nav.myOrders}
// // // // //                                 </NavLink>
// // // // //                                 <NavLink to="/profile" className="nav-link">
// // // // //                                     {t.nav.profile}
// // // // //                                 </NavLink>
// // // // //                                 {isAdminOrManager && (
// // // // //                                     <NavLink to="/admin/products" className="nav-link">
// // // // //                                         {t.nav.adminProducts}
// // // // //                                     </NavLink>
// // // // //                                 )}
// // // // //                                 <button
// // // // //                                     type="button"
// // // // //                                     onClick={logout}
// // // // //                                     className="nav-link nav-logout-btn"
// // // // //                                 >
// // // // //                                     {t.nav.logout}
// // // // //                                 </button>
// // // // //                             </>
// // // // //                         ) : (
// // // // //                             <>
// // // // //                                 <NavLink to="/login" className="nav-link">
// // // // //                                     {t.nav.login}
// // // // //                                 </NavLink>
// // // // //                                 <NavLink to="/register" className="nav-link">
// // // // //                                     {t.nav.register}
// // // // //                                 </NavLink>
// // // // //                             </>
// // // // //                         )}
// // // // //                     </nav>
// // // // //                 </div>

// // // // //                 <div className="header-right">
// // // // //                     <select
// // // // //                         aria-label="Language switcher"
// // // // //                         value={language}
// // // // //                         onChange={(e) => setManualLanguage(e.target.value)}
// // // // //                         className="lang-select"
// // // // //                     >
// // // // //                         {UI_LANGUAGES.map((lang) => (
// // // // //                             <option key={lang.code} value={lang.code}>
// // // // //                                 {lang.shortLabel} · {lang.nativeName}
// // // // //                             </option>
// // // // //                         ))}
// // // // //                     </select>

// // // // //                     <button
// // // // //                         type="button"
// // // // //                         onClick={onToggleChat}
// // // // //                         className={`ai-toggle-btn ${isChatOpen ? "is-open" : ""}`}
// // // // //                     >
// // // // //                         {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
// // // // //                     </button>
// // // // //                 </div>
// // // // //             </div>
// // // // //         </header>
// // // // //     );
// // // // // };

// // // // // export default Header;

// // // // // // import { useContext } from "react";
// // // // // // import { Link, NavLink } from "react-router-dom";
// // // // // // import { AuthContext } from "../context/AuthContext";
// // // // // // import { CartContext } from "../context/CartContext";
// // // // // // import { LanguageContext } from "../context/LanguageContext";
// // // // // // import { UI_LANGUAGES } from "../config/languages";
// // // // // // import "./Header.css";

// // // // // // const Header = ({ isChatOpen, onToggleChat }) => {
// // // // // //     const { isAuthenticated, user, logout } = useContext(AuthContext);
// // // // // //     const { totalCount } = useContext(CartContext);
// // // // // //     const { language, setManualLanguage, t } = useContext(LanguageContext);

// // // // // //     const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

// // // // // //     return (
// // // // // //         <header className="header">
// // // // // //             <div
// // // // // //                 className="container header-container"
// // // // // //                 style={{
// // // // // //                     display: "flex",
// // // // // //                     alignItems: "center",
// // // // // //                     justifyContent: "space-between",
// // // // // //                     gap: "16px",
// // // // // //                 }}
// // // // // //             >
// // // // // //                 {/* Ліва частина: логотип + основна навігація */}
// // // // // //                 <div
// // // // // //                     style={{
// // // // // //                         display: "flex",
// // // // // //                         alignItems: "center",
// // // // // //                         gap: "20px",
// // // // // //                         flexWrap: "wrap",
// // // // // //                         minWidth: 0,
// // // // // //                     }}
// // // // // //                 >
// // // // // //                     <div className="logo" style={{ flexShrink: 0 }}>
// // // // // //                         <Link to="/" style={{ whiteSpace: "nowrap" }}>
// // // // // //                             ElectroStore
// // // // // //                         </Link>
// // // // // //                     </div>

// // // // // //                     <nav
// // // // // //                         className="nav"
// // // // // //                         style={{
// // // // // //                             display: "flex",
// // // // // //                             alignItems: "center",
// // // // // //                             gap: "14px",
// // // // // //                             flexWrap: "wrap",
// // // // // //                         }}
// // // // // //                     >
// // // // // //                         <NavLink to="/" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                             {t.nav.home}
// // // // // //                         </NavLink>
// // // // // //                         <NavLink to="/products" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                             {t.nav.products}
// // // // // //                         </NavLink>

// // // // // //                         {isAuthenticated ? (
// // // // // //                             <>
// // // // // //                                 <NavLink to="/cart" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                                     {t.nav.cart} {totalCount > 0 ? `(${totalCount})` : ""}
// // // // // //                                 </NavLink>
// // // // // //                                 <NavLink to="/orders" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                                     {t.nav.myOrders}
// // // // // //                                 </NavLink>
// // // // // //                                 <NavLink to="/profile" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                                     {t.nav.profile}
// // // // // //                                 </NavLink>
// // // // // //                                 {isAdminOrManager && (
// // // // // //                                     <NavLink
// // // // // //                                         to="/admin/products"
// // // // // //                                         className="nav-link"
// // // // // //                                         style={{ whiteSpace: "nowrap" }}
// // // // // //                                     >
// // // // // //                                         {t.nav.adminProducts}
// // // // // //                                     </NavLink>
// // // // // //                                 )}
// // // // // //                                 <button
// // // // // //                                     type="button"
// // // // // //                                     onClick={logout}
// // // // // //                                     className="nav-link"
// // // // // //                                     style={{
// // // // // //                                         background: "transparent",
// // // // // //                                         border: "none",
// // // // // //                                         cursor: "pointer",
// // // // // //                                         fontSize: "16px",
// // // // // //                                         whiteSpace: "nowrap",
// // // // // //                                     }}
// // // // // //                                 >
// // // // // //                                     {t.nav.logout}
// // // // // //                                 </button>
// // // // // //                             </>
// // // // // //                         ) : (
// // // // // //                             <>
// // // // // //                                 <NavLink to="/login" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                                     {t.nav.login}
// // // // // //                                 </NavLink>
// // // // // //                                 <NavLink to="/register" className="nav-link" style={{ whiteSpace: "nowrap" }}>
// // // // // //                                     {t.nav.register}
// // // // // //                                 </NavLink>
// // // // // //                             </>
// // // // // //                         )}
// // // // // //                     </nav>
// // // // // //                 </div>

// // // // // //                 {/* Права частина: закріплені вибір мови та кнопка AI-асистента */}
// // // // // //                 <div
// // // // // //                     style={{
// // // // // //                         display: "flex",
// // // // // //                         alignItems: "center",
// // // // // //                         gap: "10px",
// // // // // //                         flexShrink: 0,
// // // // // //                         marginLeft: "auto",
// // // // // //                     }}
// // // // // //                 >
// // // // // //                     <select
// // // // // //                         aria-label="Language switcher"
// // // // // //                         value={language}
// // // // // //                         onChange={(e) => setManualLanguage(e.target.value)}
// // // // // //                         style={{
// // // // // //                             padding: "6px 8px",
// // // // // //                             borderRadius: "6px",
// // // // // //                             border: "1px solid rgba(255,255,255,0.8)",
// // // // // //                             backgroundColor: "rgba(255,255,255,0.18)",
// // // // // //                             color: "#ffffff",
// // // // // //                             fontWeight: "600",
// // // // // //                             fontSize: "13px",
// // // // // //                             cursor: "pointer",
// // // // // //                             whiteSpace: "nowrap",
// // // // // //                             flexShrink: 0,
// // // // // //                         }}
// // // // // //                     >
// // // // // //                         {UI_LANGUAGES.map((lang) => (
// // // // // //                             <option
// // // // // //                                 key={lang.code}
// // // // // //                                 value={lang.code}
// // // // // //                                 style={{ color: "#222222", backgroundColor: "#ffffff" }}
// // // // // //                             >
// // // // // //                                 {lang.shortLabel} · {lang.nativeName}
// // // // // //                             </option>
// // // // // //                         ))}
// // // // // //                     </select>

// // // // // //                     <button
// // // // // //                         type="button"
// // // // // //                         onClick={onToggleChat}
// // // // // //                         style={{
// // // // // //                             backgroundColor: isChatOpen ? "#ffffff" : "rgba(255,255,255,0.2)",
// // // // // //                             color: isChatOpen ? "#0d6efd" : "#ffffff",
// // // // // //                             border: "1px solid #ffffff",
// // // // // //                             borderRadius: "6px",
// // // // // //                             padding: "6px 12px",
// // // // // //                             cursor: "pointer",
// // // // // //                             fontWeight: "600",
// // // // // //                             whiteSpace: "nowrap",
// // // // // //                             flexShrink: 0,
// // // // // //                         }}
// // // // // //                     >
// // // // // //                         {isChatOpen ? t.nav.hideAi : t.nav.aiAssistant}
// // // // // //                     </button>
// // // // // //                 </div>
// // // // // //             </div>
// // // // // //         </header>
// // // // // //     );
// // // // // // };

// // // // // // export default Header;