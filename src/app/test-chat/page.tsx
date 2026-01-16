'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../chat/chat.module.css';

const QUICK_ACTIONS = [
  { label: 'Add skill for tracking todos', message: 'Add skill for tracking todos' },
  { label: 'Show calories burned this week', message: 'Show calories burned this week' },
  { label: 'Add new journal entry', message: 'Add new journal entry' },
];

interface DynamicToolPart {
  type: 'dynamic-tool';
  toolCallId: string;
  toolName: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: Record<string, unknown>;
  output?: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
    structuredContent?: unknown;
  };
}

function CodeBlock({ inline, className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  
  // Check if this is a chart code block
  if (language === 'chart' && !inline) {
    try {
      const data = JSON.parse(String(children));
      const yAxisDomain = data.yMin !== undefined && data.yMax !== undefined 
        ? [data.yMin, data.yMax] 
        : undefined;
      
      return (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2da" />
              <XAxis 
                dataKey="x" 
                stroke="#6b5c4c"
                style={{ fontSize: '0.85rem' }}
              />
              <YAxis 
                stroke="#6b5c4c"
                style={{ fontSize: '0.85rem' }}
                domain={yAxisDomain}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e8e2da',
                  borderRadius: '4px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#c17f59" 
                strokeWidth={2}
                dot={{ fill: '#c17f59', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {data.title && <p className={styles.chartTitle}>{data.title}</p>}
        </div>
      );
    } catch (e) {
      // If parsing fails, just show the code
      return (
        <pre className={className}>
          <code {...props}>{children}</code>
        </pre>
      );
    }
  }
  
  // Regular code block
  return (
    <pre className={className}>
      <code {...props}>{children}</code>
    </pre>
  );
}

function ToolCallDisplay({ part }: { part: DynamicToolPart }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isLoading = part.state === 'input-streaming' || part.state === 'input-available';
  const hasResult = part.state === 'output-available';
  const hasError = part.state === 'output-error' || part.output?.isError;
  
  const toolName = part.toolName || 'Unknown Tool';
  
  const formatToolName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const formatJson = (obj: unknown): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className={styles.toolCall}>
      <button 
        className={styles.toolCallHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.toolCallInfo}>
          <span className={`${styles.toolCallStatus} ${isLoading ? styles.toolCallLoading : hasError ? styles.toolCallError : styles.toolCallComplete}`}>
            {isLoading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            ) : hasError ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </span>
          <span className={styles.toolCallName}>{formatToolName(toolName)}</span>
        </div>
        <svg 
          className={`${styles.toolCallChevron} ${isExpanded ? styles.toolCallChevronExpanded : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isExpanded && (
        <div className={styles.toolCallDetails}>
          {part.input && Object.keys(part.input).length > 0 && (
            <div className={styles.toolCallSection}>
              <span className={styles.toolCallLabel}>Input</span>
              <pre className={styles.toolCallCode}>{String(formatJson(part.input))}</pre>
            </div>
          )}
          {hasResult && part.output?.structuredContent !== undefined ? (
            <div className={styles.toolCallSection}>
              <span className={styles.toolCallLabel}>Output</span>
              <pre className={styles.toolCallCode}>{String(formatJson(part.output.structuredContent))}</pre>
            </div>
          ) : null}
          {hasError && part.output?.content && (
            <div className={styles.toolCallSection}>
              <span className={styles.toolCallLabel}>Error</span>
              <pre className={styles.toolCallCode}>{part.output.content.map(c => c.text).join('\n')}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestChatPage() {
  const router = useRouter();
  
  // Redirect to home in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.push('/');
    }
  }, [router]);
  
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/test-chat',
    }),
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      if (input === '') {
        // Reset to single line height when empty
        textarea.style.height = '24px';
        textarea.style.overflowY = 'hidden';
      } else {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
        textarea.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
      }
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickAction = (message: string) => {
    sendMessage({ text: message });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <nav className={styles.navLinks}>
            <a href="/" className={styles.navButton}>Home</a>
            <a href="/account" className={styles.navButton}>Account</a>
          </nav>
          <form action="/api/auth/signout" method="POST" style={{ display: 'inline' }}>
            <button type="submit" className={styles.navButton}>Sign Out</button>
          </form>
        </header>
        <main className={styles.chatArea}>
            {isEmpty ? (
              <div className={styles.emptyState}>
                <div className={styles.mioAvatar}>M</div>
                <h2 className={styles.welcomeHeading}>Welcome to Mio!</h2>
                <p className={styles.welcomeText}>
                  The home for your personal AI. What would you like to log or check today?
                </p>
                <div className={styles.quickActions}>
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      className={styles.quickActionButton}
                      onClick={() => handleQuickAction(action.message)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messages}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.message} ${
                      message.role === 'user' ? styles.userMessage : styles.assistantMessage
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className={styles.messageAvatar}>M</div>
                    )}
                    <div className={styles.messageContent}>
                      {message.parts.map((part, index) => {
                        if (part.type === 'text') {
                          return (
                            <div key={index} className={styles.markdownContent}>
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code: CodeBlock
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        if (part.type === 'dynamic-tool') {
                          const toolPart = part as unknown as DynamicToolPart;
                          return (
                            <ToolCallDisplay 
                              key={toolPart.toolCallId} 
                              part={toolPart} 
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className={`${styles.message} ${styles.assistantMessage}`}>
                    <div className={styles.messageAvatar}>M</div>
                    <div className={styles.messageContent}>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={styles.input}
              rows={1}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
  );
}
