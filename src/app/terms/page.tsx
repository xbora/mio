
import NextLink from "next/link";
import { Button, Flex, Heading, Text, Card, Container, Box, Theme } from "@radix-ui/themes";
import { Footer } from "../components/footer";

export default function TermsPage() {
  return (
    <Theme accentColor="iris" panelBackground="solid">
      <div style={{ backgroundColor: "var(--gray-1)" }}>
        <Container style={{ backgroundColor: "var(--gray-1)" }}>
          <Flex direction="column" gap="5" p="5" minHeight="100vh">
            <Box asChild flexGrow="1">
              <Card size="4">
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="4" style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <Heading size="8">Terms of Service</Heading>
                    <Text size="2" color="gray">Last Updated: January 2025</Text>

                    <Flex direction="column" gap="3" mt="4">
                      <Heading size="5">1. Acceptance of Terms</Heading>
                      <Text>
                        By accessing or using Mio&apos;s services, you agree to be bound by these Terms of Service. 
                        If you do not agree to these terms, please do not use our service.
                      </Text>

                      <Heading size="5" mt="4">2. Description of Service</Heading>
                      <Text>
                        Mio is an AI-powered personal assistant that provides information, assistance, and task support 
                        through SMS messages, phone calls, and WhatsApp. Our service uses artificial intelligence to 
                        respond to your queries and requests.
                      </Text>

                      <Heading size="5" mt="4">3. User Responsibilities</Heading>
                      <Text>You agree to:</Text>
                      <ul style={{ marginLeft: "1.5rem" }}>
                        <li><Text>Provide accurate information when registering for the service</Text></li>
                        <li><Text>Use the service only for lawful purposes</Text></li>
                        <li><Text>Not attempt to harm, disrupt, or misuse the service</Text></li>
                        <li><Text>Maintain the confidentiality of your account credentials</Text></li>
                      </ul>

                      <Heading size="5" mt="4">4. SMS Messaging Terms</Heading>
                      <Text>
                        By providing your phone number, you consent to receive SMS messages from Mio. Message frequency 
                        varies based on your usage. Message and data rates may apply based on your carrier&apos;s plan. 
                        You can opt out at any time by replying STOP to any message. Reply HELP for assistance.
                      </Text>

                      <Heading size="5" mt="4">5. AI-Generated Content</Heading>
                      <Text>
                        Mio uses artificial intelligence to generate responses. While we strive for accuracy, 
                        AI-generated content may contain errors or inaccuracies. You should verify important information 
                        from authoritative sources. Mio is not a substitute for professional advice (medical, legal, 
                        financial, etc.).
                      </Text>

                      <Heading size="5" mt="4">6. Privacy</Heading>
                      <Text>
                        Your use of Mio is also governed by our Privacy Policy. Please review our{" "}
                        <NextLink href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "var(--accent-9)" }}>
                          Privacy Policy
                        </NextLink>
                        {" "}to understand how we collect and use your information.
                      </Text>

                      <Heading size="5" mt="4">7. Limitation of Liability</Heading>
                      <Text>
                        Mio is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages 
                        arising from your use of the service, including but not limited to indirect, incidental, 
                        or consequential damages.
                      </Text>

                      <Heading size="5" mt="4">8. Termination</Heading>
                      <Text>
                        We reserve the right to suspend or terminate your access to Mio at any time, with or without 
                        cause. You may terminate your account at any time by contacting us or ceasing to use the service.
                      </Text>

                      <Heading size="5" mt="4">9. Changes to Terms</Heading>
                      <Text>
                        We may update these Terms of Service from time to time. Continued use of the service after 
                        changes constitutes acceptance of the updated terms.
                      </Text>

                      <Heading size="5" mt="4">10. Contact</Heading>
                      <Text>
                        If you have questions about these Terms of Service, please contact us through our website 
                        at mio.fyi.
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            </Box>
            <Footer />
          </Flex>
        </Container>
      </div>
    </Theme>
  );
}
