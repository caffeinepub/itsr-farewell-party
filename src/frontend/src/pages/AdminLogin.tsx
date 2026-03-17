import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, ShieldX } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export default function AdminLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, loginStatus, isLoggingIn, isLoginSuccess, identity, clear } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  const [claiming, setClaiming] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const claimAttempted = useRef(false);

  useEffect(() => {
    const hasIdentity =
      (isLoginSuccess || !!identity) && !actorFetching && actor;
    if (hasIdentity && !claimAttempted.current) {
      claimAttempted.current = true;
      setClaiming(true);
      actor
        .claimFirstAdmin()
        .catch(() => null)
        .finally(async () => {
          await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          setClaiming(false);
        });
    }
  }, [isLoginSuccess, identity, actor, actorFetching, queryClient]);

  useEffect(() => {
    if (claimAttempted.current && !claiming && !checkingAdmin) {
      if (isAdmin) {
        navigate({ to: "/admin/dashboard" });
      } else if (isAdmin === false) {
        setAccessDenied(true);
      }
    }
  }, [claiming, checkingAdmin, isAdmin, navigate]);

  const isBusy = isLoggingIn || claiming || checkingAdmin;
  const showLoginError =
    loginStatus === "loginError" && !accessDenied && !identity;

  const handleSignOut = async () => {
    claimAttempted.current = false;
    setAccessDenied(false);
    await clear();
    await queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(75% 0.17 75 / 0.06) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-10 shadow-xl">
          <div className="text-center mb-10">
            <div className="font-display font-bold text-3xl text-primary mb-2">
              ITSR
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              Admin Access
            </h1>
            <p className="font-body text-muted-foreground text-sm">
              Sign in to manage farewell photos &amp; videos
            </p>
          </div>

          {showLoginError && (
            <div
              data-ocid="login.error_state"
              className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-body"
            >
              Login failed. Please try again.
            </div>
          )}

          {accessDenied && (
            <motion.div
              data-ocid="login.error_state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-body flex items-start gap-3"
            >
              <ShieldX className="w-5 h-5 mt-0.5 shrink-0" />
              <span>
                <strong>Access denied.</strong> An admin is already registered.
                Contact the site admin for access.
              </span>
            </motion.div>
          )}

          {!identity ? (
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isBusy}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-body font-semibold py-6 rounded-xl text-base"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          ) : (
            <Button
              data-ocid="login.primary_button"
              disabled={isBusy}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-body font-semibold py-6 rounded-xl text-base"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : null}
            </Button>
          )}

          {(accessDenied || (loginStatus === "loginError" && !!identity)) && (
            <Button
              data-ocid="login.secondary_button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full mt-3 font-body"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out &amp; Try Again
            </Button>
          )}

          <p className="mt-6 text-center font-body text-xs text-muted-foreground">
            {accessDenied
              ? "Only the registered admin can access the dashboard."
              : "The first person to sign in will become the admin."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
