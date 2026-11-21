import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";
import { LanguageContext } from "../context/LanguageContext";

const Login = () => {
    const { login } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    const { t } = useContext(LanguageContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            showToast(t.auth.loginSuccess, "success");
        } catch (err) {
            showToast(err.response?.data?.detail || t.auth.loginFailed, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <h1>{t.auth.loginTitle}</h1>
            <form className="form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.email}
                    className="input"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.password}
                    className="input"
                    required
                />
                <button type="submit" className="button" disabled={loading}>
                    {loading ? t.auth.loggingIn : t.auth.loginBtn}
                </button>
            </form>
        </div>
    );
};

export default Login;
