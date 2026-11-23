import { useEffect, useState } from "react";
import "./ToastNotify.css";

const ToastNotify = ({ message, type = "success", duration = 3000 }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(timer);
    }, [message, type, duration]);

    if (!visible || !message) return null;

    return (
        <div className={`toast ${type}`} role="status" aria-live="polite">
            {message}
        </div>
    );
};

export default ToastNotify;
