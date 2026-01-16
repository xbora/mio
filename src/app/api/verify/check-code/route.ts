import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js'
import { updateSupabaseUser } from '@/lib/supabase-users'
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

    const { phoneNumber, code } = await req.json()

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
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

    // Check verification code using Twilio Verify
    const client = getTwilioClient()
    const verificationCheck = await client.verify.v2
      .services(verificationServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code: code
      })

    console.log(`🔍 Verification check for ${formattedPhone}, status: ${verificationCheck.status}`)

    if (verificationCheck.status === 'approved') {
      // Remove the "+" prefix before storing in Supabase
      const phoneWithoutPlus = formattedPhone.startsWith('+') ? formattedPhone.slice(1) : formattedPhone
      
      // Update the user's whatsapp_number in Supabase
      const updatedUser = await updateSupabaseUser(user.id, {
        whatsapp_number: phoneWithoutPlus
      })

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to save phone number' },
          { status: 500 }
        )
      }

      console.log(`✅ Phone number verified and saved for user ${user.id}`)

      return NextResponse.json({
        success: true,
        verified: true,
        phoneNumber: phoneWithoutPlus
      })
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        error: 'Invalid verification code'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}