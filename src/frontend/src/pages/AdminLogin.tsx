import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, ShieldX } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

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
  outlineBorder: "oklch(75% 0.1 148)",
  outlineText: "oklch(42% 0.13 148)",
};

type LoginPhase =
  | "idle"
  | "verifying"
  | "checking"
  | "claiming"
  | "denied"
  | "error";

export default function AdminLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, loginStatus, isLoggingIn, identity, clear } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  const [phase, setPhase] = useState<LoginPhase>("idle");
  const claimingRef = useRef(false);

  useEffect(() => {
    if (!identity) {
      setPhase("idle");
      claimingRef.current = false;
      return;
    }
    if (actorFetching || !actor) {
      setPhase("verifying");
      return;
    }
    if (checkingAdmin) {
      setPhase("checking");
      return;
    }
    // Already confirmed admin — go to dashboard
    if (isAdmin === true) {
      navigate({ to: "/admin/dashboard" });
      return;
    }
    // isAdmin returned false — try to claim first admin slot
    if (isAdmin === false && !claimingRef.current) {
      claimingRef.current = true;
      setPhase("claiming");
      actor
        .claimFirstAdmin()
        .then(async (success: boolean) => {
          if (success) {
            await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
            navigate({ to: "/admin/dashboard" });
            return;
          }
          // Claim returned false (admin slot taken).
          // Re-check — maybe we ARE the admin but the first check failed.
          try {
            const recheckAdmin = await actor.isCallerAdmin();
            if (recheckAdmin) {
              await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
              navigate({ to: "/admin/dashboard" });
              return;
            }
          } catch {
            // re-check also failed — fall through to denied
          }
          setPhase("denied");
        })
        .catch(async () => {
          // Claim threw — re-check before giving up
          try {
            const recheckAdmin = await actor.isCallerAdmin();
            if (recheckAdmin) {
              await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
              navigate({ to: "/admin/dashboard" });
              return;
            }
          } catch {
            // ignore
          }
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          setPhase("error");
        });
    }
  }, [
    identity,
    actorFetching,
    actor,
    checkingAdmin,
    isAdmin,
    navigate,
    queryClient,
  ]);

  const isBusy =
    isLoggingIn ||
    phase === "verifying" ||
    phase === "checking" ||
    phase === "claiming";

  const busyLabel =
    phase === "verifying"
      ? "Verifying..."
      : phase === "checking"
        ? "Checking access..."
        : phase === "claiming"
          ? "Setting up access..."
          : "Signing in...";

  const handleSignOut = async () => {
    claimingRef.current = false;
    setPhase("idle");
    await clear();
    await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
  };

  const showError = phase === "denied" || phase === "error";
  const showLoginError = loginStatus === "loginError" && !identity;
  const showSignOutBtn =
    showError || (loginStatus === "loginError" && !!identity);

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
        <div
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
              Sign in to manage farewell photos &amp; videos
            </p>
          </div>

          {showLoginError && (
            <div
              data-ocid="login.error_state"
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: COLORS.errorBg,
                border: `1px solid ${COLORS.errorBorder}`,
                borderRadius: "0.5rem",
                color: COLORS.errorText,
                fontSize: "0.875rem",
              }}
            >
              Login failed. Please try again.
            </div>
          )}

          {showError && (
            <motion.div
              data-ocid="login.error_state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: COLORS.errorBg,
                border: `1px solid ${COLORS.errorBorder}`,
                borderRadius: "0.5rem",
                color: COLORS.errorText,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <ShieldX
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  marginTop: "0.125rem",
                  flexShrink: 0,
                }}
              />
              <span>
                {phase === "denied" ? (
                  <>
                    <strong>Access denied.</strong> An admin is already
                    registered. Contact the site admin for access.
                  </>
                ) : (
                  <>
                    <strong>Something went wrong.</strong> Please sign out and
                    try again.
                  </>
                )}
              </span>
            </motion.div>
          )}

          {!identity ? (
            <button
              type="button"
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isBusy}
              style={{
                width: "100%",
                background: COLORS.btnBg,
                color: COLORS.btnText,
                border: "none",
                borderRadius: "0.75rem",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isBusy) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                if (!isBusy) e.currentTarget.style.opacity = "1";
              }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2
                    className="animate-spin"
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn style={{ width: "1.25rem", height: "1.25rem" }} />
                  Sign In
                </>
              )}
            </button>
          ) : isBusy ? (
            <div
              data-ocid="login.loading_state"
              style={{
                width: "100%",
                background: COLORS.btnBg,
                color: COLORS.btnText,
                borderRadius: "0.75rem",
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: 0.8,
              }}
            >
              <Loader2
                className="animate-spin"
                style={{ width: "1.25rem", height: "1.25rem" }}
              />
              {busyLabel}
            </div>
          ) : null}

          {showSignOutBtn && (
            <button
              type="button"
              data-ocid="login.secondary_button"
              onClick={handleSignOut}
              style={{
                width: "100%",
                marginTop: "0.75rem",
                background: "transparent",
                border: `1px solid ${COLORS.outlineBorder}`,
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: COLORS.outlineText,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.75";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <LogOut style={{ width: "1rem", height: "1rem" }} />
              Sign Out &amp; Try Again
            </button>
          )}

          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.75rem",
              color: COLORS.mutedText,
            }}
          >
            {phase === "denied"
              ? "Only the registered admin can access the dashboard."
              : "The first person to sign in will become the admin."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
