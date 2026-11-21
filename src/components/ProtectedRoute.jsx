import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";

const ProtectedRoute = ({ children, roles }) => {
    const { user, isAuthenticated, loading } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    if (loading) {
        return <div className="page"><p>{t.common.loading}</p></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
