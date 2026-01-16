'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, ExclamationTriangleIcon, PaperPlaneIcon } from '@radix-ui/react-icons'
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js'
import styles from '../app/components/authenticated-layout.module.css'

interface PhoneVerificationProps {
  onVerificationSuccess: (phoneNumber: string) => void
  currentPhoneNumber?: string
}

export function PhoneVerification({ onVerificationSuccess, currentPhoneNumber }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber || '')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code' | 'verified'>(currentPhoneNumber ? 'verified' : 'phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentPhoneNumber) {
      setPhoneNumber(currentPhoneNumber)
      setStep('verified')
    }
  }, [currentPhoneNumber])

  const validatePhoneNumber = (phone: string) => {
    if (!phone.trim()) {
      return 'Please enter a phone number'
    }

    if (!isValidPhoneNumber(phone)) {
      return 'Please enter a valid phone number'
    }

    return null
  }

  const handlePhoneChange = (value: string) => {
    let cleanValue = value.replace(/^\+/, '')
    
    if (cleanValue && /^\d/.test(cleanValue) && !cleanValue.startsWith('1')) {
      cleanValue = '1' + cleanValue
    }
    
    const valueWithPlus = '+' + cleanValue
    
    const formatter = new AsYouType()
    const formatted = formatter.input(valueWithPlus)
    setPhoneNumber(formatted)
    
    if (error) {
      setError(null)
    }
  }

  const sendVerificationCode = async () => {
    const validationError = validatePhoneNumber(phoneNumber)
    if (validationError) {
      setError(validationError)
      return
    }

    let formattedPhone: string
    try {
      const parsedPhone = parsePhoneNumber(phoneNumber)
      if (!parsedPhone) {
        setError('Invalid phone number format')
        return
      }
      formattedPhone = parsedPhone.format('E.164')
    } catch (err) {
      setError('Invalid phone number format')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/verify/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep('code')
        console.log('Verification code sent')
      } else {
        setError(data.error || 'Failed to send verification code')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error sending verification code:', err)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    let formattedPhone: string
    try {
      const parsedPhone = parsePhoneNumber(phoneNumber)
      if (!parsedPhone) {
        setError('Invalid phone number format')
        return
      }
      formattedPhone = parsedPhone.format('E.164')
    } catch (err) {
      setError('Invalid phone number format')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/verify/check-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedPhone, code: verificationCode }),
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        setStep('verified')
        onVerificationSuccess(formattedPhone)
        console.log('Phone number verified and saved')
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error verifying code:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetVerification = () => {
    setStep('phone')
    setVerificationCode('')
    setError(null)
  }

  if (step === 'verified') {
    return (
      <div>
        <div style={{
          background: 'rgba(90, 138, 90, 0.1)',
          border: '1px solid rgba(90, 138, 90, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <CheckIcon style={{ color: '#5a8a5a', marginTop: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem', color: '#3d3530', lineHeight: '1.5' }}>
            Phone number {phoneNumber} has been verified and saved successfully! You may now call, text or WhatsApp message your AI at{' '}
            <a href="tel:+14013605868" style={{ color: '#5a8a5a', textDecoration: 'underline' }}>+1 (401) 360-5868</a>
          </span>
        </div>
        <button 
          onClick={resetVerification} 
          className={styles.secondaryButton}
          style={{ marginTop: '1rem' }}
        >
          Update Phone Number
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {step === 'phone' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#6b5c4c', 
            lineHeight: '1.6',
            marginBottom: '0.5rem'
          }}>
            By providing your phone number, you consent to receive Whatsapp messages from <strong>Mio</strong>, your personal AI.
            <br/><br/>
            For more information, see our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#c17f59', textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#c17f59', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>

          <div className={styles.formRow}>
            <span className={styles.formLabel}>Phone Number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="212 322 1143"
              disabled={loading}
              className={styles.formInput}
              style={{ background: '#fff' }}
            />
          </div>
          
          <button 
            onClick={sendVerificationCode}
            disabled={loading || !phoneNumber.trim()}
            className={styles.ctaButton}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading || !phoneNumber.trim() ? 0.6 : 1,
              cursor: loading || !phoneNumber.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            <PaperPlaneIcon />
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      )}

      {step === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#6b5c4c' }}>
            We sent a verification code to {phoneNumber}
          </p>
          
          <div className={styles.formRow}>
            <span className={styles.formLabel}>Verification Code</span>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={loading}
              className={styles.formInput}
              style={{ background: '#fff' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={verifyCode}
              disabled={loading || !verificationCode.trim()}
              className={styles.ctaButton}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading || !verificationCode.trim() ? 0.6 : 1,
                cursor: loading || !verificationCode.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              <CheckIcon />
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button 
              onClick={resetVerification}
              disabled={loading}
              className={styles.secondaryButton}
            >
              Change Number
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(196, 90, 90, 0.1)',
          border: '1px solid rgba(196, 90, 90, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ExclamationTriangleIcon style={{ color: '#c45a5a', flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem', color: '#c45a5a' }}>{error}</span>
        </div>
      )}
    </div>
  )
}
