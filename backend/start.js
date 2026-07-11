#!/usr/bin/env node
import { fileURLToPath } from 'url'
import path from 'path'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve the path to server from backend folder
const serverPath = path.join(__dirname, '..', 'server', 'src', 'index.js')

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: __dirname
})

process.on('SIGTERM', () => {
  child.kill('SIGTERM')
})

process.on('SIGINT', () => {
  child.kill('SIGINT')
})

child.on('exit', (code) => {
  process.exit(code)
})
