import { redirect } from 'next/navigation'
import { Button, Flex, Heading, Text, Card, Container, Theme } from "@radix-ui/themes"
import { Footer } from "../components/footer"
import { getSharedSkillByToken } from '@/lib/supabase-shared-skills'
import { SUPABASE_URL, HEADERS } from '@/lib/supabase'

export default async function AcceptSharePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const { token } = params

  if (!token) {
    return (
      <Theme accentColor="iris" panelBackground="solid">
        <div style={{ backgroundColor: "var(--gray-1)", minHeight: "100vh" }}>
          <Container>
            <Flex direction="column" gap="5" p="5" align="center" justify="center" style={{ minHeight: "100vh" }}>
              <Card size="4" style={{ maxWidth: "500px" }}>
                <Flex direction="column" gap="4" align="center">
                  <Heading size="6">Invalid Invitation</Heading>
                  <Text align="center">This invitation link is invalid or incomplete.</Text>
                  <Button asChild>
                    <a href="/">Go Home</a>
                  </Button>
                </Flex>
              </Card>
            </Flex>
          </Container>
          <Footer />
        </div>
      </Theme>
    )
  }

  // Get the shared skill by token
  const sharedSkill = await getSharedSkillByToken(token)

  if (!sharedSkill) {
    return (
      <Theme accentColor="iris" panelBackground="solid">
        <div style={{ backgroundColor: "var(--gray-1)", minHeight: "100vh" }}>
          <Container>
            <Flex direction="column" gap="5" p="5" align="center" justify="center" style={{ minHeight: "100vh" }}>
              <Card size="4" style={{ maxWidth: "500px" }}>
                <Flex direction="column" gap="4" align="center">
                  <Heading size="6">Invitation Not Found</Heading>
                  <Text align="center">This invitation token is invalid or has expired.</Text>
                  <Button asChild>
                    <a href="/">Go Home</a>
                  </Button>
                </Flex>
              </Card>
            </Flex>
          </Container>
          <Footer />
        </div>
      </Theme>
    )
  }

  // Check if already accepted
  if (sharedSkill.status === 'accepted') {
    // Get recipient user to show their AI name
    const recipientResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${sharedSkill.shared_with_workos_user_id}`,
      {
        method: 'GET',
        headers: HEADERS
      }
    )

    let aiName = 'your AI'
    if (recipientResponse.ok) {
      const recipientData = await recipientResponse.json()
      if (Array.isArray(recipientData) && recipientData.length > 0) {
        aiName = recipientData[0].ai_name || 'your AI'
      }
    }

    return (
      <Theme accentColor="iris" panelBackground="solid">
        <div style={{ backgroundColor: "var(--gray-1)", minHeight: "100vh" }}>
          <Container>
            <Flex direction="column" gap="5" p="5" align="center" justify="center" style={{ minHeight: "100vh" }}>
              <Card size="4" style={{ maxWidth: "500px" }}>
                <Flex direction="column" gap="4" align="center">
                  <Heading size="6">✅ Already Accepted</Heading>
                  <Text align="center">
                    This skill share invitation for <strong>{sharedSkill.skill_name}</strong> has already been accepted and is syncing with {aiName}.
                  </Text>
                  <Button asChild>
                    <a href="/login">Log In to Your Account</a>
                  </Button>
                </Flex>
              </Card>
            </Flex>
          </Container>
          <Footer />
        </div>
      </Theme>
    )
  }

  // Accept the invitation (no auth required - token validation is sufficient)
  const acceptResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_skills?id=eq.${sharedSkill.id}`,
    {
      method: 'PATCH',
      headers: {
        ...HEADERS,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'accepted',
        invite_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  )

  if (!acceptResponse.ok) {
    return (
      <Theme accentColor="iris" panelBackground="solid">
        <div style={{ backgroundColor: "var(--gray-1)", minHeight: "100vh" }}>
          <Container>
            <Flex direction="column" gap="5" p="5" align="center" justify="center" style={{ minHeight: "100vh" }}>
              <Card size="4" style={{ maxWidth: "500px" }}>
                <Flex direction="column" gap="4" align="center">
                  <Heading size="6">❌ Error</Heading>
                  <Text align="center">
                    Failed to accept the invitation. Please try again or contact support.
                  </Text>
                  <Button asChild>
                    <a href="/">Go Home</a>
                  </Button>
                </Flex>
              </Card>
            </Flex>
          </Container>
          <Footer />
        </div>
      </Theme>
    )
  }

  // Get recipient user to show their AI name
  const recipientResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${sharedSkill.shared_with_workos_user_id}`,
    {
      method: 'GET',
      headers: HEADERS
    }
  )

  let aiName = 'your AI'
  if (recipientResponse.ok) {
    const recipientData = await recipientResponse.json()
    if (Array.isArray(recipientData) && recipientData.length > 0) {
      aiName = recipientData[0].ai_name || 'your AI'
    }
  }

  // Trigger initial sync in background (don't await - let it run async)
  // Use MCP trigger with owner's workos_user_id to initiate the first sync
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mio.fyi'
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')

  fetch(`${cleanBaseUrl}/api/skills/mcp-trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workos_user_id: sharedSkill.owner_workos_user_id,
      skill_name: sharedSkill.arca_table_name
    })
  }).catch(error => {
    console.error('Background sync failed:', error)
  })

  // Success! Now redirect to login so they can access their account
  return (
    <Theme accentColor="iris" panelBackground="solid">
      <div style={{ backgroundColor: "var(--gray-1)", minHeight: "100vh" }}>
        <Container>
          <Flex direction="column" gap="5" p="5" align="center" justify="center" style={{ minHeight: "100vh" }}>
            <Card size="4" style={{ maxWidth: "500px" }}>
              <Flex direction="column" gap="4" align="center">
                <Heading size="6">✅ Invitation Accepted!</Heading>
                <Text align="center">
                  You&apos;ve successfully accepted the shared skill <strong>{sharedSkill.skill_name}</strong>.
                </Text>
                <Text size="2" color="gray" align="center">
                  This skill and its data will now sync with your AI, {aiName}.
                </Text>
                <Text size="2" align="center" style={{ marginTop: '10px' }}>
                  Click below to log in and start using your shared skill:
                </Text>
                <Button asChild size="3">
                  <a href="/login">Log In to Your Account</a>
                </Button>
              </Flex>
            </Card>
          </Flex>
        </Container>
        <Footer />
      </div>
    </Theme>
  )
}