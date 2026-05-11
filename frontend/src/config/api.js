/**
 * Centralized API configuration.
 * In production, set VITE_API_URL to your Render backend URL.
 * e.g.  https://triptogether-backend.onrender.com
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_BASE_URL;
