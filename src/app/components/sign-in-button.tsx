"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { handleSignOutAction } from "../actions/signOut";
import styles from "./authenticated-layout.module.css";

export function SignInButton({ large }: { large?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ color: '#6b5c4c', fontSize: '0.9rem' }}>Loading...</div>;
  }

  if (user) {
    return (
      <form action={handleSignOutAction}>
        <button 
          type="submit" 
          className={large ? styles.ctaButton : styles.navButton}
        >
          Sign Out
        </button>
      </form>
    );
  }

  return (
    <a 
      href="/login" 
      className={large ? styles.ctaButton : styles.navButton}
    >
      Sign In{large && " with AuthKit"}
    </a>
  );
}
