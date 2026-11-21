import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <p>© {new Date().getFullYear()} ElectroStore. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;