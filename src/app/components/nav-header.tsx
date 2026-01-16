'use client';

import NextLink from 'next/link';
import { SignInButton } from './sign-in-button';
import styles from './authenticated-layout.module.css';

// Temporary import for example, replace with your actual Link component
import Link from 'next/link';

interface NavHeaderProps {
  activePage?: 'home' | 'account' | 'chat';
}

export function NavHeader({ activePage }: NavHeaderProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.navLinks}>
        <NextLink
          href="/"
          className={`${styles.navButton} ${activePage === 'home' ? styles.navButtonActive : ''}`}
        >
          Home
        </NextLink>
        <NextLink
          href="/account"
          className={`${styles.navButton} ${activePage === 'account' ? styles.navButtonActive : ''}`}
        >
          Account
        </NextLink>
      </nav>
      <SignInButton />
    </header>
  );
}