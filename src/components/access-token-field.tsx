'use client';

import { useState } from 'react';
import { EyeOpenIcon, EyeClosedIcon, CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import styles from '../app/components/authenticated-layout.module.css';

interface AccessTokenFieldProps {
  token: string;
}

export function AccessTokenField({ token }: AccessTokenFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const maskedToken = token.replace(/./g, '•');

  return (
    <div className={styles.formRow}>
      <span className={styles.formLabel}>Api Key</span>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <input
          type="text"
          value={isVisible ? token : maskedToken}
          readOnly
          className={styles.formInput}
          style={{
            paddingRight: '72px',
            fontFamily: isVisible ? 'monospace' : 'inherit',
          }}
        />
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            onClick={() => setIsVisible(!isVisible)}
            type="button"
            title={isVisible ? 'Hide token' : 'Show token'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              color: '#6b5c4c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e8e2da'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {isVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </button>
          <button
            onClick={handleCopy}
            type="button"
            title="Copy token"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              color: copied ? '#5a8a5a' : '#6b5c4c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e8e2da'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
