import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Game state API (for potential future use with multiplayer)
  app.get('/api/game/:id', (req, res) => {
    res.json({ message: 'Game state would be retrieved here in a multiplayer implementation' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
