
import NextLink from "next/link";
import { Button, Flex, Heading, Text, Card, Container, Box, Theme } from "@radix-ui/themes";
import { Footer } from "../components/footer";

export default function PrivacyPage() {
  return (
    <Theme accentColor="iris" panelBackground="solid">
      <div style={{ backgroundColor: "var(--gray-1)" }}>
        <Container style={{ backgroundColor: "var(--gray-1)" }}>
          <Flex direction="column" gap="5" p="5" minHeight="100vh">
            <Box asChild flexGrow="1">
              <Card size="4">
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="4" style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <Heading size="8">Privacy Policy</Heading>
                    <Text size="2" color="gray">Last Updated: January 2025</Text>

                    <Flex direction="column" gap="3" mt="4">
                      <Heading size="5">1. Information We Collect</Heading>
                      <Text>We collect the following types of information:</Text>
                      <ul style={{ marginLeft: "1.5rem" }}>
                        <li><Text><strong>Account Information:</strong> Name, email address, and phone number when you register</Text></li>
                        <li><Text><strong>Communication Data:</strong> Messages and conversations you have with Mio via SMS, phone, or WhatsApp</Text></li>
                        <li><Text><strong>Usage Information:</strong> How you interact with our service, including timestamps and frequency of use</Text></li>
                        <li><Text><strong>Technical Data:</strong> Device information, IP address, and browser type</Text></li>
                      </ul>

                      <Heading size="5" mt="4">2. How We Use Your Information</Heading>
                      <Text>We use your information to:</Text>
                      <ul style={{ marginLeft: "1.5rem" }}>
                        <li><Text>Provide and improve the Mio AI assistant service</Text></li>
                        <li><Text>Process and respond to your queries and requests</Text></li>
                        <li><Text>Send you service-related communications (verification codes, responses to your messages)</Text></li>
                        <li><Text>Analyze usage patterns to improve our AI models and service quality</Text></li>
                        <li><Text>Ensure security and prevent fraud or abuse</Text></li>
                      </ul>

                      <Heading size="5" mt="4">3. SMS Messaging</Heading>
                      <Text>
                        When you provide your phone number, we use it to send SMS messages including verification codes 
                        and responses to your queries. We use Twilio as our SMS service provider. Message and data rates 
                        may apply based on your carrier. You can opt out of SMS messages at any time by replying STOP.
                      </Text>

                      <Heading size="5" mt="4">4. Data Sharing and Third Parties</Heading>
                      <Text>We share your information with:</Text>
                      <ul style={{ marginLeft: "1.5rem" }}>
                        <li><Text><strong>Service Providers:</strong> Third-party services that help us operate (e.g., Twilio for SMS, authentication providers)</Text></li>
                        <li><Text><strong>AI Processing:</strong> Your messages may be processed by AI service providers to generate responses</Text></li>
                        <li><Text><strong>Legal Requirements:</strong> When required by law or to protect our rights</Text></li>
                      </ul>
                      <Text mt="2">We do not sell your personal information to third parties.</Text>

                      <Heading size="5" mt="4">5. Data Retention</Heading>
                      <Text>
                        We retain your information for as long as your account is active or as needed to provide services. 
                        We may retain certain information after account closure for legal compliance, fraud prevention, 
                        and service improvement purposes.
                      </Text>

                      <Heading size="5" mt="4">6. Data Security</Heading>
                      <Text>
                        We implement reasonable security measures to protect your information from unauthorized access, 
                        disclosure, or destruction. However, no method of transmission over the internet is 100% secure, 
                        and we cannot guarantee absolute security.
                      </Text>

                      <Heading size="5" mt="4">7. Your Rights</Heading>
                      <Text>You have the right to:</Text>
                      <ul style={{ marginLeft: "1.5rem" }}>
                        <li><Text>Access the personal information we hold about you</Text></li>
                        <li><Text>Request correction of inaccurate information</Text></li>
                        <li><Text>Request deletion of your information</Text></li>
                        <li><Text>Opt out of SMS communications by replying STOP</Text></li>
                        <li><Text>Close your account at any time</Text></li>
                      </ul>

                      <Heading size="5" mt="4">8. Children&apos;s Privacy</Heading>
                      <Text>
                        Mio is not intended for children under 13 years of age. We do not knowingly collect personal 
                        information from children under 13. If we learn that we have collected information from a child 
                        under 13, we will delete it promptly.
                      </Text>

                      <Heading size="5" mt="4">9. Changes to This Policy</Heading>
                      <Text>
                        We may update this Privacy Policy from time to time. We will notify you of significant changes 
                        by posting the new policy on this page with an updated &quot;Last Updated&quot; date.
                      </Text>

                      <Heading size="5" mt="4">10. Contact Us</Heading>
                      <Text>
                        If you have questions about this Privacy Policy or how we handle your information, please 
                        contact us through our website at mio.fyi.
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
