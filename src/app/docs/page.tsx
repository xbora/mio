'use client';

import Link from 'next/link';
import styles from '../components/mio-landing.module.css';

export default function DocsPage() {
  return (
    <div className={styles.mioLanding}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.wordmark} style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
          Mio API Documentation
        </h1>
        <p className={styles.heroTagline}>
          Build powerful integrations with your personal AI assistant
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/api-playground" className={styles.ctaButton}>
            Try API Playground →
          </Link>
          <Link href="/chat" className={styles.ctaButton} style={{
            backgroundColor: 'rgba(193, 127, 89, 0.2)',
            color: '#c17f59',
            border: '2px solid #c17f59'
          }}>
            Start Using Mio
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Quick Links */}
        <section className={`${styles.section} ${styles.solutionSection}`}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              { title: 'Authentication', link: '#authentication' },
              { title: 'User API', link: '#user-api' },
              { title: 'Skills API', link: '#skills-api' },
              { title: 'Chat API', link: '#chat-api' }
            ].map((item) => (
              <a key={item.link} href={item.link} className={styles.featureItem} style={{
                textDecoration: 'none',
                transition: 'transform 0.2s',
              }}>
                <h3 style={{ 
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#c17f59',
                  marginBottom: '0'
                }}>
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </section>

        {/* Authentication Section */}
        <section id="authentication" className={`${styles.section} ${styles.howSection}`}>
          <h2 className={styles.sectionHeadline}>
            Authentication
          </h2>
          <div className={styles.featureItem}>
            <p style={{ marginBottom: '1rem', color: '#6b5c4c', lineHeight: '1.6' }}>
              All API requests require authentication using your WorkOS User ID as a Bearer token.
            </p>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.9rem'
            }}>
{`Authorization: Bearer user_01HXYZ123ABC...`}
            </pre>
            <p style={{ marginTop: '1rem', color: '#6b5c4c', fontSize: '0.9rem' }}>
              You can find your WorkOS User ID in your account settings.
            </p>
          </div>
        </section>

        {/* User API Section */}
        <section id="user-api" className={`${styles.section} ${styles.solutionSection}`}>
          <h2 className={styles.sectionHeadline}>
            User API
          </h2>

          {/* Get Current User */}
          <div className={styles.featureItem} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                GET
              </span>
              <code style={{ fontSize: '1.1rem', color: '#3d3530' }}>/api/user/current</code>
            </div>
            <p style={{ color: '#6b5c4c', marginBottom: '1.5rem' }}>
              Retrieve the currently authenticated user&apos;s information.
            </p>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Request</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`curl -X GET https://mio.fyi/api/user/current \\
  -H "Authorization: Bearer YOUR_WORKOS_USER_ID"`}
            </pre>
            <h4 style={{ fontWeight: '600', margin: '1.5rem 0 0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Response</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`{
  "workosUserId": "user_01HXYZ...",
  "aiName": "Mio",
  "aiUsername": "my_ai"
}`}
            </pre>
          </div>
        </section>

        {/* Skills API Section */}
        <section id="skills-api" className={`${styles.section} ${styles.howSection}`}>
          <h2 className={styles.sectionHeadline}>
            Skills API
          </h2>

          {/* Share Skill */}
          <div className={styles.featureItem} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                POST
              </span>
              <code style={{ fontSize: '1.1rem', color: '#3d3530' }}>/api/skills/share</code>
            </div>
            <p style={{ color: '#6b5c4c', marginBottom: '1.5rem' }}>
              Share a tabular or vector skill with another user.
            </p>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Request Body</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
{`{
  "skill_name": "todos",
  "shared_with_email": "friend@example.com"
}`}
            </pre>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Request</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`const response = await fetch('https://mio.fyi/api/skills/share', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_WORKOS_USER_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    skill_name: 'todos',
    shared_with_email: 'friend@example.com'
  })
});
const result = await response.json();`}
            </pre>
          </div>

          {/* Sync Skill */}
          <div className={styles.featureItem} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                POST
              </span>
              <code style={{ fontSize: '1.1rem', color: '#3d3530' }}>/api/skills/sync</code>
            </div>
            <p style={{ color: '#6b5c4c', marginBottom: '1.5rem' }}>
              Synchronize data between owner and recipient for a shared tabular skill.
            </p>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Request Body</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`{
  "shared_skill_id": "skill_123",
  "direction": "owner_to_recipient"
}`}
            </pre>
            <p style={{ color: '#6b5c4c', fontSize: '0.9rem', marginTop: '1rem' }}>
              <strong>Direction options:</strong> <code>owner_to_recipient</code> or <code>recipient_to_owner</code>
            </p>
          </div>
        </section>

        {/* Chat API Section */}
        <section id="chat-api" className={`${styles.section} ${styles.solutionSection}`}>
          <h2 className={styles.sectionHeadline}>
            Chat API
          </h2>

          <div className={styles.featureItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                POST
              </span>
              <code style={{ fontSize: '1.1rem', color: '#3d3530' }}>/api/chat</code>
            </div>
            <p style={{ color: '#6b5c4c', marginBottom: '1.5rem' }}>
              Send a message to Mio AI assistant and receive a streaming response.
            </p>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Request</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`const response = await fetch('https://mio.fyi/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_WORKOS_USER_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.JSON.stringify({
    messages: [
      { role: 'user', content: 'Add a todo: Buy groceries' }
    ]
  })
});

// Handle streaming response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}`}
            </pre>
          </div>
        </section>

        {/* Proactive Actions Section */}
        <section id="proactive-actions" className={`${styles.section} ${styles.solutionSection}`}>
          <h2 className={styles.sectionHeadline}>
            Proactive Actions
          </h2>

          {/* List Proactive Actions */}
          <div className={styles.featureItem} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                GET
              </span>
              <code style={{ fontSize: '1.1rem', color: '#3d3530' }}>/api/proactive-actions/list</code>
            </div>
            <p style={{ color: '#6b5c4c', marginBottom: '1.5rem' }}>
              Retrieve all proactive actions for the authenticated user.
            </p>
            
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Request</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
{`curl -X GET https://mio.fyi/api/proactive-actions/list \\
  -H "Authorization: Bearer YOUR_WORKOS_USER_ID"`}
            </pre>

            <h4 style={{ fontWeight: '600', margin: '1.5rem 0 0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Response</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user_01234567890abcdef",
      "skill_names": ["calendar", "tasks"],
      "action_type": "summary",
      "schedule_config": {
        "times": ["09:00", "18:00"],
        "days": ["monday", "wednesday", "friday"],
        "timezone": "America/New_York"
      },
      "delivery_channel": "email",
      "instruction_prompt": "Summarize my tasks for tomorrow",
      "is_active": true,
      "next_run_at": "2024-01-15T09:00:00Z",
      "last_run_at": null,
      "success_count": 0,
      "failure_count": 0,
      "created_at": "2024-01-14T10:00:00Z",
      "updated_at": "2024-01-14T10:00:00Z"
    }
  ]
}`}
            </pre>
          </div>

          {/* Create Proactive Action */}
          <div className={styles.featureItem} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                POST
              </span>
              <code style={{ fontSize: '1.1rem', color: '#3d3530' }}>/api/proactive-actions/create</code>
            </div>
            <p style={{ color: '#6b5c4c', marginBottom: '1.5rem' }}>
              Create a new proactive action that runs on a schedule using specified skills.
            </p>
            
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Request Body</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
{`{
  "workos_user_id": "user_01234567890abcdef",
  "user_timezone": "America/New_York",
  "skill_names": ["calendar", "tasks"],
  "action_type": "summary",
  "schedule_config": {
    "times": ["09:00", "18:00"],
    "days": ["monday", "wednesday", "friday"],
    "timezone": "America/New_York"
  },
  "delivery_channel": "email",
  "instruction_prompt": "Summarize my tasks for tomorrow"
}`}
            </pre>

            <p style={{ color: '#6b5c4c', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <strong>Note:</strong> <code>user_timezone</code> takes priority over <code>schedule_config.timezone</code> when calculating the <code>next_run_at</code> timestamp in UTC.
            </p>

            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Schedule Config Options</h4>
            <p style={{ color: '#6b5c4c', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Daily schedule:
            </p>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
{`{
  "times": ["09:00", "18:00"],
  "days": ["monday", "tuesday", "friday"],
  "timezone": "America/New_York"
}`}
            </pre>

            <p style={{ color: '#6b5c4c', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Interval schedule (every N hours):
            </p>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
{`{
  "interval_hours": 3,
  "timezone": "America/New_York"
}`}
            </pre>

            <h4 style={{ fontWeight: '600', margin: '1.5rem 0 0.5rem', fontFamily: "'Fraunces', Georgia, serif" }}>Example Response</h4>
            <pre style={{
              backgroundColor: '#3d3530',
              color: '#f5f2ed',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
{`{
  "success": true,
  "message": "Proactive action created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user_01234567890abcdef",
    "skill_names": ["calendar", "tasks"],
    "action_type": "summary",
    "is_active": true,
    "next_run_at": "2024-01-15T09:00:00Z"
  }
}`}
            </pre>
          </div>
        </section>

        {/* Best Practices */}
        <section className={`${styles.section} ${styles.howSection}`}>
          <h2 className={styles.sectionHeadline}>
            Best Practices
          </h2>
          <div className={styles.featureItem}>
            <ul style={{ color: '#6b5c4c', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>Always check the response status and handle errors appropriately</li>
              <li>Use HTTPS for all API requests</li>
              <li>Store your WorkOS User ID securely and never expose it in client-side code</li>
              <li>Implement proper error handling for all API calls</li>
              <li>Use the interactive API playground to test endpoints before integrating</li>
            </ul>
          </div>
        </section>

        {/* Footer CTA */}
        <section className={`${styles.section} ${styles.finalCta}`}>
          <h2 className={styles.sectionHeadline}>
            Ready to get started?
          </h2>
          <p className={styles.sectionBody}>
            Try out the interactive API playground or start chatting with Mio
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/api-playground" className={styles.ctaButton}>
              API Playground →
            </Link>
            <Link href="/chat" className={styles.ctaButton} style={{
              backgroundColor: 'rgba(193, 127, 89, 0.2)',
              color: '#c17f59',
              border: '2px solid #c17f59'
            }}>
              Try Mio
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}