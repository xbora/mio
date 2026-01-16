'use client'

import { useState, useEffect } from 'react'
import { PhoneVerification } from './phone-verification'
import styles from '../app/components/authenticated-layout.module.css'

interface AccountPhoneSectionProps {
  workosUserId: string
}

export function AccountPhoneSection({ workosUserId }: AccountPhoneSectionProps) {
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/phone')
        if (response.ok) {
          const data = await response.json()
          setCurrentPhoneNumber(data.whatsapp_number)
        } else {
          console.error('Failed to fetch user phone data:', response.status)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [workosUserId])

  const handleVerificationSuccess = (phoneNumber: string) => {
    setCurrentPhoneNumber(phoneNumber)
  }

  if (loading) {
    return (
      <div style={{ color: '#6b5c4c', fontSize: '0.95rem' }}>
        Loading phone verification...
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div style={{ 
        borderTop: '1px solid #e8e2da', 
        paddingTop: '1.5rem',
        marginTop: '0.5rem'
      }}>
        <h2 className={styles.sectionHeading} style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Phone Verification
        </h2>
        <p style={{ 
          fontSize: '0.95rem', 
          color: '#6b5c4c', 
          marginBottom: '1.25rem',
          lineHeight: '1.6'
        }}>
          Connect your phone to communicate with your AI via phone calls, SMS and WhatsApp messages. You&apos;ll receive a verification code to confirm your number.
        </p>

        <PhoneVerification 
          onVerificationSuccess={handleVerificationSuccess}
          currentPhoneNumber={currentPhoneNumber || undefined}
        />
      </div>
    </div>
  )
}
