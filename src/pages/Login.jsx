import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";

const Login = () => {
    const { login } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            showToast("Login successful!", "success");
        } catch (err) {
            showToast(err.response?.data?.detail || "Invalid credentials.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <h1>Login</h1>
            <form className="form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="input"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="input"
                    required
                />
                <button type="submit" className="button" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
};

export default Login;