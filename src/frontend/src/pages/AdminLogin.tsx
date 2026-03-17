import { useNavigate } from "@tanstack/react-router";
import { KeyRound, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const COLORS = {
  pageBg: "oklch(96% 0.018 145)",
  cardBg: "oklch(99% 0.005 145 / 0.9)",
  cardBorder: "1px solid oklch(85% 0.04 145 / 0.6)",
  cardShadow:
    "0 8px 40px oklch(52% 0.13 148 / 0.2), 0 2px 12px oklch(52% 0.13 148 / 0.08)",
  headingItsr: "oklch(42% 0.13 148)",
  headingAdmin: "oklch(25% 0.06 155)",
  bodyText: "oklch(45% 0.07 148)",
  mutedText: "oklch(52% 0.08 148)",
  errorBg: "oklch(92% 0.05 25 / 0.15)",
  errorBorder: "oklch(60% 0.18 25 / 0.3)",
  errorText: "oklch(35% 0.15 25)",
  btnBg: "oklch(42% 0.13 148)",
  btnText: "oklch(99% 0.005 145)",
  inputBorder: "oklch(75% 0.08 148)",
  inputFocus: "oklch(52% 0.13 148)",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "pazhampori") {
      sessionStorage.setItem("adminLoggedIn", "true");
      navigate({ to: "/admin/dashboard" });
    } else {
      setError(true);
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(65% 0.15 148 / 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "28rem",
        }}
      >
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          style={{
            background: COLORS.cardBg,
            border: COLORS.cardBorder,
            borderRadius: "1rem",
            padding: "2.5rem",
            boxShadow: COLORS.cardShadow,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.875rem",
                color: COLORS.headingItsr,
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              ITSR
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: COLORS.headingAdmin,
                marginBottom: "0.5rem",
              }}
            >
              Admin Access
            </h1>
            <p style={{ fontSize: "0.875rem", color: COLORS.bodyText }}>
              Enter the admin password to continue
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ position: "relative" }}>
              <KeyRound
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "1.125rem",
                  height: "1.125rem",
                  color: COLORS.mutedText,
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Password"
                style={{
                  width: "100%",
                  paddingLeft: "2.75rem",
                  paddingRight: "1rem",
                  paddingTop: "0.875rem",
                  paddingBottom: "0.875rem",
                  fontSize: "1rem",
                  borderRadius: "0.75rem",
                  border: `1.5px solid ${error ? COLORS.errorBorder : COLORS.inputBorder}`,
                  background: "oklch(100% 0 0 / 0.7)",
                  color: COLORS.headingAdmin,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.inputFocus;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error
                    ? COLORS.errorBorder
                    : COLORS.inputBorder;
                }}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: "0.875rem",
                  color: COLORS.errorText,
                  textAlign: "center",
                  margin: 0,
                  padding: "0.5rem 0.75rem",
                  background: COLORS.errorBg,
                  border: `1px solid ${COLORS.errorBorder}`,
                  borderRadius: "0.5rem",
                }}
              >
                Incorrect password. Please try again.
              </motion.p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                background: COLORS.btnBg,
                color: COLORS.btnText,
                border: "none",
                borderRadius: "0.75rem",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <LogIn style={{ width: "1.25rem", height: "1.25rem" }} />
              Enter Dashboard
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
