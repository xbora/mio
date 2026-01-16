
'use client';

import { useState } from 'react';
import styles from '../app/components/authenticated-layout.module.css';

interface AccountAINameSectionProps {
  workosUserId: string;
  initialAiName: string | null;
}

export function AccountAINameSection({ workosUserId, initialAiName }: AccountAINameSectionProps) {
  const [aiName, setAiName] = useState(initialAiName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    if (!aiName.trim()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/user/update-ai-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workosUserId,
          aiName: aiName.trim(),
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error updating AI name:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionHeading}>Your AI</h2>
      <div className={styles.formGroup}>
        <div className={styles.formRow}>
          <label className={styles.formLabel}>Your AI&apos;s Name</label>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
            <input
              type="text"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              placeholder="e.g., James's AI, Sage, Friday"
              className={styles.formInput}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleSave}
              disabled={!aiName.trim() || isSaving}
              className={styles.formButton}
              style={{
                padding: '0.5rem 1rem',
                background: aiName.trim() ? '#c17f59' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: aiName.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {saveStatus === 'success' && (
              <span style={{ color: '#4CAF50', fontSize: '0.9rem' }}>✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ color: '#f44336', fontSize: '0.9rem' }}>Error saving</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
