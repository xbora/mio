import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js'
import twilio from 'twilio'

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio configuration')
  }
  return twilio(accountSid, authToken)
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from WorkOS
    const { user } = await withAuth()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Please provide a valid phone number with country code (e.g., +1234567890)' },
        { status: 400 }
      )
    }

    // Parse and ensure E.164 format
    let formattedPhone: string
    try {
      const parsedPhone = parsePhoneNumber(phoneNumber)
      if (!parsedPhone) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
      formattedPhone = parsedPhone.format('E.164')
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Validate that we have the required Twilio configuration
    const verificationServiceSid = process.env.VERIFICATION_SERVICE_SID
    if (!verificationServiceSid) {
      console.error('Missing Twilio configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Send verification code using Twilio Verify
    const client = getTwilioClient()
    const verification = await client.verify.v2
      .services(verificationServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms'
      })

    console.log(`📱 Verification code sent to ${formattedPhone}, status: ${verification.status}`)

    return NextResponse.json({
      success: true,
      status: verification.status,
      to: formattedPhone
    })

  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}