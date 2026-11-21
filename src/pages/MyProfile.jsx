import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const MyProfile = () => {
    const { user, logout } = useContext(AuthContext);

    if (!user) return null;

    return (
        <div className="page">
            <h1>My Profile</h1>
            <div className="admin-item" style={{ maxWidth: "500px", margin: "0 auto" }}>
                <p><strong>User ID:</strong> {user.id}</p>
                {user.full_name && <p><strong>Full Name:</strong> {user.full_name}</p>}
                {user.email && <p><strong>Email:</strong> {user.email}</p>}
                <p><strong>Role:</strong> {user.role}</p>
                <button
                    className="button"
                    onClick={logout}
                    style={{ backgroundColor: "#dc3545", marginTop: "15px" }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default MyProfile;