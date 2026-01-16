import { createAnthropic } from '@ai-sdk/anthropic';
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { getMioSystemPrompt } from '@/lib/mio-system-prompt';
import { withAuth } from '@workos-inc/authkit-nextjs';

export const maxDuration = 60;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getMcpTools(userApiKey: string) {
  const mcpClient = await createMCPClient({
    transport: {
      type: 'http',
      url: 'https://m.mio.fyi/',
      headers: {
        Authorization: `Bearer ${userApiKey}`,
      },
    },
  });

  const tools = await mcpClient.tools();
  console.log('MCP tools loaded:', Object.keys(tools));
  return { mcpClient, tools };
}

export async function POST(req: Request) {
  const { user } = await withAuth();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const filteredMessages = messages.filter(msg => {
    if (Array.isArray(msg.parts)) {
      return msg.parts.some(part => {
        if (part.type === 'text') {
          const textPart = part as { type: 'text'; text: string };
          return textPart.text && textPart.text.trim().length > 0;
        }
        return true;
      });
    }
    return true;
  });

  if (filteredMessages.length === 0) {
    return new Response('No valid messages provided', { status: 400 });
  }

  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
  let tools = {};
  let mcpError: string | null = null;

  try {
    const mcpResult = await getMcpTools(user.id);
    mcpClient = mcpResult.mcpClient;
    tools = mcpResult.tools;
  } catch (error) {
    console.error('Failed to connect to MCP server:', error);
    mcpError = error instanceof Error ? error.message : 'Unknown MCP connection error';
  }

  const systemPrompt = mcpError 
    ? `CRITICAL: The MCP tools server is currently unavailable (Error: ${mcpError}). You MUST NOT pretend to use tools or make up tool results. Simply tell the user: "I'm sorry, I can't access my tools right now due to a technical issue. Please try again in a moment." Do not attempt to answer questions that require tool access.`
    : getMioSystemPrompt();

  const result = streamText({
    model: anthropic('claude-opus-4-5-20251101'),
    system: systemPrompt,
    messages: convertToModelMessages(filteredMessages),
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      if (mcpClient) {
        await mcpClient.close();
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
