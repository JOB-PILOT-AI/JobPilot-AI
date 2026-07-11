#!/usr/bin/env node
import { fileURLToPath } from 'url'
import path from 'path'
import Module from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Add backend's node_modules to module search paths
const backendNodeModules = path.join(__dirname, 'node_modules')
Module.globalPaths.push(backendNodeModules)

// Import and start the server
const projectRoot = path.resolve(__dirname, '..')
const serverPath = path.join(projectRoot, 'server', 'src', 'index.js')

try {
  const serverUrl = new URL(`file://${serverPath}`)
  await import(serverUrl.href)
} catch (err) {
  console.error('Failed to start server:', err.message)
  process.exit(1)
}

