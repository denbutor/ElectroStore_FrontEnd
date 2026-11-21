import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";

const MyProfile = () => {
    const { user, logout } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    if (!user) return null;

    const localizedRole = t.profile.roles?.[user.role] || user.role;

    return (
        <div className="page">
            <h1>{t.profile.title}</h1>
            <div className="admin-item" style={{ maxWidth: "500px", margin: "0 auto" }}>
                <p><strong>{t.profile.userId}:</strong> {user.id}</p>
                {user.full_name && <p><strong>{t.profile.fullName}:</strong> {user.full_name}</p>}
                {user.email && <p><strong>{t.profile.email}:</strong> {user.email}</p>}
                <p><strong>{t.profile.role}:</strong> {localizedRole}</p>
                <button
                    className="button"
                    onClick={logout}
                    style={{ backgroundColor: "#dc3545", marginTop: "15px" }}
                >
                    {t.profile.logout}
                </button>
            </div>
        </div>
    );
};

export default MyProfile;
