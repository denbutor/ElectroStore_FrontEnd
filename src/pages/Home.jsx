import { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";

const Home = () => {
    const { t } = useContext(LanguageContext);

    return (
        <div className="page">
            <section className="hero-section">
                <span className="hero-badge">ElectroStore · Marketplace</span>
                <h1>{t.home.title}</h1>
                <p>{t.home.subtitle}</p>
                <div className="hero-actions">
                    <Link to="/products" className="button hero-cta">
                        {t.home.browseCatalog}
                    </Link>
                </div>
            </section>

            <section className="marketplace-highlights" aria-label="Platform capabilities">
                <div className="highlight-card">
                    <strong>{t.nav.products}</strong>
                    <span>{t.products.searchPlaceholder}</span>
                </div>
                <div className="highlight-card">
                    <strong>{t.nav.aiAssistant}</strong>
                    <span>{t.chat.placeholder}</span>
                </div>
                <div className="highlight-card">
                    <strong>{t.nav.myOrders}</strong>
                    <span>{t.checkout.orderSummary}</span>
                </div>
            </section>
        </div>
    );
};

export default Home;
