import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import http from 'http';
import schema from './schema';
import db from './db';
import { io } from './index';

jest.mock('apollo-server-express');
jest.mock('./db');
jest.mock('./socket', () => ({
  addSocketToServer: jest.fn(() => ({
    sendGlobalMessage: jest.fn(),
  })),
  loadChatCache: jest.fn(),
}));

describe('Server Startup', () => {
  let server: ApolloServer;
  let app: express.Application;
  let httpServer: http.Server;

  beforeEach(async () => {
    app = express();
    httpServer = http.createServer(app);
    server = new ApolloServer({
      schema,
      plugins: [
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await new Promise<void>((resolve) => httpServer.close(() => resolve()));
              },
            };
          },
        },
      ],
      context: async ({ req }) => ({
        db,
        io,
        client: null,
      }),
    });

    await server.start();
    db.start();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the database on startup', async () => {
    expect(db.start).toHaveBeenCalled();
  });

  it('should create a properly configured Apollo Server', () => {
    expect(server.start).toBeDefined();
    expect(server.applyMiddleware).toBeDefined();
  });

  it('should have the correct schema', () => {
    expect(schema).toBeDefined();
  });

  it('should have socket.io configured', () => {
    expect(io).toBeDefined();
    expect(io.sendGlobalMessage).toBeDefined();
  });
}); 