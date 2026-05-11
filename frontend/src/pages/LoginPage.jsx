import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import AuthLayout from "../components/Auth/AuthLayout";
import { UserContext } from "../context/userContext";
import API_BASE_URL from "../config/api";

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
      fill="#4285F4"
    />
    <path
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] },
    },
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/google-sign-in`,
          {
            googleToken: tokenResponse.access_token,
          },
          { withCredentials: true },
        );

        setUser(response.data.user || null);
        toast.success("Welcome back, adventurer!", {
          style: { background: "#321B22", color: "#fff", borderRadius: "12px" },
        });
        navigate("/");
      } catch (err) {
        const message = err.response?.data?.message || "Google Sign-in failed.";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Google Sign-in failed."),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          identifier,
          password,
        },
        { withCredentials: true },
      );

      setUser(response.data.user || null);
      toast.success("Welcome back, adventurer!", {
        style: { background: "#321B22", color: "#fff", borderRadius: "12px" },
      });
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Invalid credentials.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast("Password recovery coming soon!", {
      icon: "🧭",
      style: { background: "#321B22", color: "#fff", borderRadius: "12px" },
    });
  };

  return (
    <AuthLayout subtitle="Welcome back, adventurer!" onSubmit={handleSubmit}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <div className="input-group-rose">
            <label className="label-rose" htmlFor="login-identifier">
              Email or Username
            </label>
            <div className="input-container-rose">
              <Mail className="input-icon-rose" size={18} />
              <input
                id="login-identifier"
                type="text"
                className="input-rose"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="account-id"
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="input-group-rose">
            <label className="label-rose" htmlFor="login-password">
              Password
            </label>
            <div className="input-container-rose">
              <Lock className="input-icon-rose" size={18} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="input-rose"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-rose"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <a
            href="#"
            onClick={handleForgotPassword}
            className="forgot-password-link"
          >
            Forgot password?
          </a>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            className="btn-primary-rose"
            disabled={isLoading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="divider-rose">
            <span className="divider-line-rose"></span>
            <span>or</span>
            <span className="divider-line-rose"></span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="button"
            className="google-btn-rose"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            whileHover={{ scale: 1.01, backgroundColor: "#fdf8f9" }}
            whileTap={{ scale: 0.99 }}
          >
            <GoogleIcon /> Continue with Google
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
