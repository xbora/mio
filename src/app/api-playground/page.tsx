'use client';

import dynamic from 'next/dynamic';
import '@scalar/api-reference-react/style.css';

const ApiReferenceReact = dynamic(
  () => import('@scalar/api-reference-react').then((mod) => mod.ApiReferenceReact),
  { ssr: false }
);

const apiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Mio API',
    version: '1.0.0',
    description: 'API for interacting with Mio - Your Personal AI Assistant'
  },
  servers: [
    {
      url: 'https://mio.fyi',
      description: 'Production'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'WorkOS User ID',
        description: 'Use your WorkOS User ID as the Bearer token'
      }
    },
    schemas: {
      SharedSkill: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier for the shared skill' },
          arca_table_name: { type: 'string', description: 'Name of the Arca table/skill' },
          skill_type: { type: 'string', enum: ['table', 'vector'], description: 'Type of skill' },
          owner_workos_user_id: { type: 'string', description: 'Owner\'s WorkOS user ID' },
          shared_with_workos_user_id: { type: 'string', description: 'Recipient\'s WorkOS user ID' },
          status: { type: 'string', enum: ['pending', 'accepted', 'rejected'], description: 'Share status' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      SyncRequest: {
        type: 'object',
        required: ['shared_skill_id', 'direction'],
        properties: {
          shared_skill_id: { type: 'string', description: 'ID of the shared skill to sync' },
          direction: {
            type: 'string',
            enum: ['owner_to_recipient', 'recipient_to_owner'],
            description: 'Direction of sync'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          workos_user_id: { type: 'string' },
          email: { type: 'string' },
          username: { type: 'string' },
          preferred_ai_name: { type: 'string' },
          phone_number: { type: 'string' },
          arca_api_key: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/api/user/current': {
      get: {
        summary: 'Get Current User',
        description: 'Retrieve the currently authenticated user\'s information',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User information retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - Invalid or missing authentication'
          }
        },
        'x-codeSamples': [
          {
            lang: 'TypeScript',
            label: 'Fetch',
            source: `const response = await fetch('https://mio.fyi/api/user/current', {
  headers: {
    'Authorization': 'Bearer YOUR_WORKOS_USER_ID'
  }
});
const user = await response.json();`
          },
          {
            lang: 'Shell',
            label: 'cURL',
            source: `curl -X GET https://mio.fyi/api/user/current \\
  -H "Authorization: Bearer YOUR_WORKOS_USER_ID"`
          }
        ]
      }
    },
    '/api/skills/share': {
      post: {
        summary: 'Share a Skill',
        description: 'Share a tabular or vector skill with another user',
        tags: ['Skills'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['arca_table_name', 'skill_type', 'shared_with_username'],
                properties: {
                  arca_table_name: { type: 'string', example: 'todos' },
                  skill_type: { type: 'string', enum: ['table', 'vector'], example: 'table' },
                  shared_with_username: { type: 'string', example: 'john_doe' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Skill shared successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    shared_skill_id: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        'x-codeSamples': [
          {
            lang: 'TypeScript',
            label: 'Fetch',
            source: `const response = await fetch('https://mio.fyi/api/skills/share', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_WORKOS_USER_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    arca_table_name: 'todos',
    skill_type: 'table',
    shared_with_username: 'john_doe'
  })
});
const result = await response.json();`
          }
        ]
      }
    },
    '/api/skills/sync': {
      post: {
        summary: 'Sync Tabular Skill',
        description: 'Synchronize data between owner and recipient for a shared tabular skill',
        tags: ['Skills'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Sync completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    synced_count: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        'x-codeSamples': [
          {
            lang: 'TypeScript',
            label: 'Fetch',
            source: `const response = await fetch('https://mio.fyi/api/skills/sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_WORKOS_USER_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shared_skill_id: 'skill_123',
    direction: 'owner_to_recipient'
  })
});
const result = await response.json();`
          }
        ]
      }
    },
    '/api/skills/sync-vector': {
      post: {
        summary: 'Sync Vector Skill',
        description: 'Synchronize data between owner and recipient for a shared vector skill',
        tags: ['Skills'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Vector sync completed successfully'
          }
        }
      }
    },
    '/api/chat': {
      post: {
        summary: 'Chat with Mio',
        description: 'Send a message to Mio AI assistant and receive a streaming response',
        tags: ['Chat'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Streaming chat response'
          }
        },
        'x-codeSamples': [
          {
            lang: 'TypeScript',
            label: 'Fetch',
            source: `const response = await fetch('https://mio.fyi/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_WORKOS_USER_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
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
}`
          }
        ]
      }
    },
    '/api/proactive-actions/list': {
      get: {
        summary: 'List Proactive Actions',
        description: 'Retrieve all proactive actions for the authenticated user',
        tags: ['Proactive Actions'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Successfully retrieved proactive actions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          user_id: { type: 'string' },
                          skill_names: { type: 'array', items: { type: 'string' } },
                          action_type: { type: 'string' },
                          schedule_config: { type: 'object' },
                          delivery_channel: { type: 'string' },
                          instruction_prompt: { type: 'string' },
                          is_active: { type: 'boolean' },
                          next_run_at: { type: 'string', format: 'date-time' },
                          last_run_at: { type: 'string', format: 'date-time', nullable: true },
                          success_count: { type: 'integer' },
                          failure_count: { type: 'integer' },
                          created_at: { type: 'string', format: 'date-time' },
                          updated_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Missing or invalid authorization',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Missing or invalid Authorization header' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/proactive-actions/create': {
      post: {
        summary: 'Create Proactive Action',
        description: 'Create a new proactive action that runs on a schedule using specified skills',
        tags: ['Proactive Actions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workos_user_id', 'skill_names', 'action_type', 'schedule_config', 'delivery_channel', 'instruction_prompt'],
                properties: {
                  workos_user_id: {
                    type: 'string',
                    description: 'User ID from WorkOS authentication',
                    example: 'user_01234567890abcdef'
                  },
                  skill_names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of skill names this action uses',
                    example: ['calendar', 'tasks']
                  },
                  action_type: {
                    type: 'string',
                    enum: ['reminder', 'analysis', 'summary', 'insight'],
                    description: 'Type of proactive action',
                    example: 'summary'
                  },
                  schedule_config: {
                    type: 'object',
                    description: 'Schedule configuration - supports daily times or interval-based',
                    oneOf: [
                      {
                        type: 'object',
                        required: ['times', 'days', 'timezone'],
                        properties: {
                          times: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Times to run (HH:MM format)',
                            example: ['09:00', '18:00']
                          },
                          days: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Days of week',
                            example: ['monday', 'wednesday', 'friday']
                          },
                          timezone: {
                            type: 'string',
                            example: 'America/New_York'
                          }
                        }
                      },
                      {
                        type: 'object',
                        required: ['interval_hours', 'timezone'],
                        properties: {
                          interval_hours: {
                            type: 'number',
                            description: 'Run every N hours',
                            example: 3
                          },
                          timezone: {
                            type: 'string',
                            example: 'America/New_York'
                          }
                        }
                      }
                    ]
                  },
                  delivery_channel: {
                    type: 'string',
                    enum: ['email', 'sms', 'whatsapp'],
                    description: 'How to deliver the action result',
                    example: 'email'
                  },
                  instruction_prompt: {
                    type: 'string',
                    description: 'Instructions for what the action should do',
                    example: 'Summarize my tasks for tomorrow and remind me of high priority items'
                  },
                  user_timezone: {
                    type: 'string',
                    description: 'User timezone (e.g., America/New_York). Takes priority over schedule_config.timezone for calculating next_run_at in UTC',
                    example: 'America/New_York'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Proactive action created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Proactive action created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        user_id: { type: 'string' },
                        skill_names: { type: 'array', items: { type: 'string' } },
                        action_type: { type: 'string' },
                        schedule_config: { type: 'object' },
                        delivery_channel: { type: 'string' },
                        instruction_prompt: { type: 'string' },
                        is_active: { type: 'boolean' },
                        next_run_at: { type: 'string', format: 'date-time' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Missing required fields or invalid data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Missing required fields: skill_names, action_type, schedule_config, delivery_channel, instruction_prompt' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/proactive-actions/{action_id}': {
      patch: {
        summary: 'Update Proactive Action',
        description: 'Update an existing proactive action. Allows modifying is_active, instruction_prompt, next_run_at, delivery_channel, skill_names, action_type, and schedule_config.',
        tags: ['Proactive Actions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'action_id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'The ID of the proactive action to update'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  is_active: {
                    type: 'boolean',
                    description: 'Whether the action is active',
                    example: false
                  },
                  instruction_prompt: {
                    type: 'string',
                    description: 'Instructions for what the action should do',
                    example: 'Updated instruction prompt'
                  },
                  next_run_at: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Override the next scheduled run time',
                    example: '2024-01-20T10:00:00Z'
                  },
                  delivery_channel: {
                    type: 'string',
                    enum: ['email', 'sms', 'whatsapp'],
                    description: 'How to deliver the action result',
                    example: 'sms'
                  },
                  skill_names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of skill names this action uses',
                    example: ['calendar', 'tasks']
                  },
                  action_type: {
                    type: 'string',
                    enum: ['reminder', 'analysis', 'summary', 'insight'],
                    description: 'Type of proactive action',
                    example: 'reminder'
                  },
                  schedule_config: {
                    type: 'object',
                    description: 'Schedule configuration - supports daily times or interval-based'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Proactive action updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Proactive action updated successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        user_id: { type: 'string' },
                        skill_names: { type: 'array', items: { type: 'string' } },
                        action_type: { type: 'string' },
                        schedule_config: { type: 'object' },
                        delivery_channel: { type: 'string' },
                        instruction_prompt: { type: 'string' },
                        is_active: { type: 'boolean' },
                        next_run_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid data or no valid fields provided',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'No valid fields provided for update' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Missing or invalid authorization',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Missing or invalid Authorization header' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Proactive action not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Proactive action not found or you do not have permission to edit it' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/proactive-actions/execute': {
      post: {
        summary: 'Execute Proactive Actions',
        description: 'Check and identify which proactive actions are ready to be executed based on their schedule',
        tags: ['Proactive Actions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['execution_time'],
                properties: {
                  execution_time: {
                    type: 'string',
                    format: 'date-time',
                    description: 'ISO 8601 timestamp to check actions against',
                    example: '2024-01-15T09:00:00Z'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Proactive actions executed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Executed 3 proactive actions' },
                    executed_actions: {
                      type: 'array',
                      items: { type: 'string', format: 'uuid' },
                      description: 'IDs of the executed actions'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid execution time format',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Invalid execution_time format. Please use ISO 8601 format.' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: 'User', description: 'User management endpoints' },
    { name: 'Skills', description: 'Skill sharing and synchronization' },
    { name: 'Chat', description: 'AI chat interface' },
    { name: 'Proactive Actions', description: 'Automated actions based on schedules and skills' }
  ]
};

export default function ApiPlayground() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ApiReferenceReact
        configuration={{
          spec: {
            content: apiSpec
          },
          theme: 'purple',
          layout: 'modern',
          defaultHttpClient: {
            targetKey: 'js',
            clientKey: 'fetch'
          },
          servers: [
            {
              url: 'https://mio.fyi',
              description: 'Production'
            }
          ]
        } as any}
      />
    </div>
  );
}