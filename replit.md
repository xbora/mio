# Mio — Your Personal AI

## Overview
Mio is a personal AI you name, teach, and own. This is the landing page and user management application for Mio, part of the Andea family of AI products.

**URL**: mio.fyi  
**Parent Company**: Andea (https://andea.ai)

## Project Setup
- **Framework**: Next.js 15.2.3 with App Router
- **Authentication**: WorkOS AuthKit for user management
- **Database**: Supabase PostgreSQL with automatic user synchronization
- **UI Library**: Radix UI themes and components
- **TypeScript**: Full TypeScript support

## Environment Configuration
The application requires the following secrets to be configured in Replit Secrets:
- `WORKOS_CLIENT_ID`: Your WorkOS Client ID
- `WORKOS_API_KEY`: Your WorkOS API Key 
- `WORKOS_COOKIE_PASSWORD`: Secure password for session cookies (must be 32+ characters)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public API key

## Replit Configuration
- **Development Server**: Runs on port 5000 with host 0.0.0.0
- **Deployment**: Configured for autoscale deployment with proper build and start commands
- **Security**: Environment variables managed through Replit Secrets (not committed to repo)

## WorkOS Setup Required
1. Configure redirect URI in WorkOS dashboard to match your deployed Replit domain + `/callback`
2. Set `NEXT_PUBLIC_WORKOS_REDIRECT_URI` secret to your deployed domain + `/callback`

## Supabase Integration
- **Automatic User Creation**: When WorkOS users sign in, corresponding Supabase user records are automatically created
- **User Synchronization**: The app syncs WorkOS user data (ID, email, name) to Supabase users table
- **API Route**: `/api/sync-user` handles user synchronization via REST API
- **Database Schema**: Uses Supabase users table with workos_user_id, email, name, first_name, last_name fields

## Recent Changes
- **November 2025**: Complete rebrand from Cloe to Mio
  - New landing page with warm minimalist design
  - Elegant "Mio" wordmark using Fraunces serif font
  - Terracotta accent color (#c17f59) with warm off-white background (#faf8f5)
  - Page sections: Hero, Problem, Solution, How It Works, Philosophy, Features, CTA
  - Updated footer with Andea branding and links to andea.ai
  - All Cloe references replaced with Mio throughout codebase
- **September 2024**: Added phone number verification with Twilio Verify API for WhatsApp notifications
  - Secure phone verification flow with SMS codes
  - Server-side API routes for sending and verifying codes
  - Client-side components with proper UX for verification states
  - Integration with Supabase users table for storing verified phone numbers
- **December 2024**: Added Supabase integration with automatic user creation
- **Setup**: Configured Next.js for Replit proxy compatibility
- Set up proper environment variable management
- Configured deployment settings for production
- Removed committed secrets and secured configuration

## Architecture
- `/src/app/page.tsx`: Home page with authentication check
- `/src/app/components/mio-landing.tsx`: Public landing page with warm minimalist design
- `/src/app/components/footer.tsx`: Footer with Andea branding
- `/src/app/account/`: Protected user account pages with automatic user sync
- `/src/app/chat/`: Chat interface with Claude Opus 4 for skill-building conversations
- `/src/app/api/chat/`: Streaming chat API using Vercel AI SDK with Anthropic
- `/src/middleware.ts`: WorkOS authentication middleware
- `/src/lib/supabase.ts`: Supabase configuration and types
- `/src/lib/supabase-users.ts`: User management functions (create, get, update)
- `/src/app/api/sync-user/`: API endpoint for WorkOS to Supabase user synchronization

## Chat Feature
- **AI Model**: Anthropic Claude Opus 4.5 (claude-opus-4-5-20251101)
- **System Prompt**: Located in `/src/lib/mio-system-prompt.ts`
- **Streaming**: Real-time streaming responses using Vercel AI SDK v5
- **MCP Integration**: Connected to Arca MCP server (https://mcp.arca.fyi) for tool access
- **Quick Actions**: Pre-built prompts for tracking todos, meals, exercises
- **UI**: Warm minimalist design with docked input at bottom of page
- **Auth**: Currently accessible without login for testing (auth wall to be added later)
- **Note**: MCP Bearer token currently uses static token; will be replaced with user's API key once login is required