
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendSkillInviteEmailParams {
  recipientEmail: string
  recipientName?: string
  recipientAiName?: string
  ownerName: string
  skillName: string
  acceptUrl: string
}

export async function sendSkillInviteEmail({
  recipientEmail,
  recipientName,
  recipientAiName,
  ownerName,
  skillName,
  acceptUrl
}: SendSkillInviteEmailParams) {
  try {
    const aiName = recipientAiName || 'your AI'
    
    const { data, error } = await resend.emails.send({
      from: 'Mio <ai@mio.fyi>',
      to: recipientEmail,
      subject: `${ownerName} shared "${skillName}" skill with your AI`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
            ${ownerName} shared a skill with you
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            <strong>${ownerName}</strong> is sharing the <strong>"${skillName}"</strong> skill and its data with your AI, ${aiName}.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Click the button below to accept this invitation and start syncing this skill:
          </p>
          
          <a href="${acceptUrl}" 
             style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
          
          <p style="color: #999; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${acceptUrl}" style="color: #666; word-break: break-all;">${acceptUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px; line-height: 1.5;">
            This is an automated message from Mio. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email sent successfully:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
