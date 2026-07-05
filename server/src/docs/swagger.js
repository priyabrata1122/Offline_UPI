import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import env from '../config/env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UPI Offline Mesh API',
      version: '1.0.0',
      description: 'REST API documentation for offline UPI transaction routing over Bluetooth Mesh.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        MeshPacket: {
          type: 'object',
          required: ['packetId', 'ttl', 'createdAt', 'ciphertext'],
          properties: {
            packetId: {
              type: 'string',
              format: 'uuid',
              description: 'Unique packet identifier.',
            },
            ttl: {
              type: 'integer',
              minimum: 0,
              description: 'Time to live (hops remaining).',
            },
            createdAt: {
              type: 'integer',
              description: 'Epoch timestamp in milliseconds.',
            },
            ciphertext: {
              type: 'string',
              description: 'Base64 hybrid encrypted PaymentInstruction.',
            },
          },
        },
        DemoSendRequest: {
          type: 'object',
          required: ['senderVpa', 'receiverVpa', 'amount', 'pin'],
          properties: {
            senderVpa: { type: 'string', example: 'alice@demo' },
            receiverVpa: { type: 'string', example: 'bob@demo' },
            amount: { type: 'number', example: 500 },
            pin: { type: 'string', example: '1234' },
            ttl: { type: 'integer', example: 5 },
            startDevice: { type: 'string', example: 'phone-alice' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

const paths = {
  '/api/server-key': {
    get: {
      summary: 'Get Server Public Key',
      description: "Returns the server's public key (RSA-2048 SPKI PEM representation) so mobile nodes can encrypt instructions.",
      responses: {
        200: {
          description: 'Key retrieved successfully',
        },
      },
    },
  },
  '/api/demo/send': {
    post: {
      summary: 'Simulate Payment and Inject into Mesh',
      description: 'Generates an encrypted payment instruction, wraps it in a MeshPacket, and injects it into a simulated device.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DemoSendRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Packet injected successfully',
        },
      },
    },
  },
  '/api/mesh/state': {
    get: {
      summary: 'Get Simulator Mesh State',
      description: 'Returns packet counts and contents for all active simulated phones.',
      responses: {
        200: {
          description: 'Mesh state returned successfully',
        },
      },
    },
  },
  '/api/mesh/gossip': {
    post: {
      summary: 'Run Gossip Round',
      description: 'Triggers one gossip exchange iteration across the simulated mesh nodes.',
      responses: {
        200: {
          description: 'Gossip round complete',
        },
      },
    },
  },
  '/api/mesh/flush': {
    post: {
      summary: 'Flush Bridge Nodes to Server',
      description: 'Bridge nodes with internet connections concurrently POST all their held packets to `/api/bridge/ingest`.',
      responses: {
        200: {
          description: 'Flush sequence executed',
        },
      },
    },
  },
  '/api/mesh/reset': {
    post: {
      summary: 'Reset Mesh and Server Cache',
      description: 'Resets all simulated device buffers and flushes the idempotency registry.',
      responses: {
        200: {
          description: 'Reset successfully',
        },
      },
    },
  },
  '/api/bridge/ingest': {
    post: {
      summary: 'Ingest Single Packet (Production API)',
      description: 'Ingests, verifies uniqueness (via Redis), decrypts, and settles a mesh payment.',
      parameters: [
        {
          in: 'header',
          name: 'X-Bridge-Node-Id',
          schema: { type: 'string' },
          required: false,
          description: 'ID of the uploading node',
        },
        {
          in: 'header',
          name: 'X-Hop-Count',
          schema: { type: 'integer' },
          required: false,
          description: 'Number of hops taken by the packet',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MeshPacket' },
          },
        },
      },
      responses: {
        200: {
          description: 'Packet processed',
        },
      },
    },
  },
  '/api/accounts': {
    get: {
      summary: 'List Accounts',
      description: 'Returns all system bank accounts and balances.',
      responses: {
        200: {
          description: 'Success',
        },
      },
    },
  },
  '/api/transactions': {
    get: {
      summary: 'List Transaction Ledger',
      description: 'Returns the 20 most recent transaction settlements.',
      responses: {
        200: {
          description: 'Success',
        },
      },
    },
  },
  '/api/auth/register': {
    post: {
      summary: 'Register User',
      description: 'Creates a user profile and seeds a default bank account.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username', 'password'],
              properties: {
                username: { type: 'string' },
                password: { type: 'string' },
                holderName: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'User created' },
      },
    },
  },
  '/api/auth/login': {
    post: {
      summary: 'Login User',
      description: 'Authenticates user credentials and returns a JWT.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username', 'password'],
              properties: {
                username: { type: 'string' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'JWT returned' },
      },
    },
  },
};

swaggerSpec.paths = paths;

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
