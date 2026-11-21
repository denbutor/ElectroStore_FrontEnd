import { useState, useContext } from "react";
import { ToastContext } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Register = () => {
    const { showToast } = useContext(ToastContext);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authService.register(formData);
            localStorage.setItem(
                "user_meta",
                JSON.stringify({
                    email: res.data.email,
                    full_name: res.data.full_name,
                })
            );
            showToast("Registration successful!", "success");
            navigate("/login");
        } catch (err) {
            showToast(
                err.response?.data?.detail || "Registration failed. Email may already exist.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <h1>Register</h1>
            <form className="form" onSubmit={handleSubmit}>
                <input
                    name="full_name"
                    placeholder="Full Name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <input
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input"
                />
                <button className="button" type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
};

export default Register;