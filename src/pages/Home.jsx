import { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";

const Home = () => {
    const { t } = useContext(LanguageContext);

    return (
        <div className="page" style={{ textAlign: "center", paddingTop: "60px" }}>
            <h1>{t.home.title}</h1>
            <p style={{ maxWidth: "600px", margin: "0 auto 30px" }}>
                {t.home.subtitle}
            </p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <Link to="/products" className="button">
                    {t.home.browseCatalog}
                </Link>
            </div>
        </div>
    );
};

export default Home;
