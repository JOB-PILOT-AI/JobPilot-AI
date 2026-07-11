#!/usr/bin/env node
/**
 * Start script for JobPilot Backend
 * Loads the backend server entry point with proper module resolution
 */

// Direct import of the backend entry point
// This ensures all modules are resolved from backend/node_modules
import('./src/index.js').catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

