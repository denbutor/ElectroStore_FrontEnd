import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="page" style={{ textAlign: "center", paddingTop: "60px" }}>
            <h1>Welcome to ElectroStore!</h1>
            <p style={{ maxWidth: "600px", margin: "0 auto 30px" }}>
                Modern electronics store powered by microservices. Browse our catalog or ask our AI Assistant in the top bar for personalized recommendations.
            </p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <Link to="/products" className="button">
                    Browse Catalog
                </Link>
            </div>
        </div>
    );
};

export default Home;