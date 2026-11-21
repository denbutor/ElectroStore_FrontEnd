import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import "./Footer.css";

const Footer = () => {
    const { t } = useContext(LanguageContext);

    return (
        <footer className="footer">
            <div className="container footer-container">
                <p>© {new Date().getFullYear()} ElectroStore. {t.footer.rights}</p>
            </div>
        </footer>
    );
};

export default Footer;
