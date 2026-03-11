/**
 * setup-local-model.js
 *
 * Runs automatically after `npm install` (postinstall hook).
 *
 * Checks whether Ollama is installed and, if so, pulls the default local
 * edge model (phi3:mini) that serves as the CPU-only redundancy for the
 * Mistral AI API inside AITrainingModule.
 *
 * The script is intentionally non-blocking: if Ollama is not installed or
 * the pull fails for any reason, the script exits cleanly with a helpful
 * message so that the rest of `npm install` is never interrupted.
 */

import { execSync, spawnSync } from 'node:child_process'

const DEFAULT_MODEL = 'phi3:mini'
const MODEL = process.env.LOCAL_AI_MODEL ?? DEFAULT_MODEL

const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function log(msg) {
  console.log(`${CYAN}[setup-local-model]${RESET} ${msg}`)
}

function warn(msg) {
  console.warn(`${YELLOW}[setup-local-model]${RESET} ${msg}`)
}

// ── 1. Check that Ollama CLI is available ──────────────────────────────────

let ollamaVersion
try {
  ollamaVersion = execSync('ollama --version', { stdio: 'pipe' }).toString().trim()
} catch {
  warn('Ollama is not installed or not on PATH.')
  warn('To enable the local edge-model fallback in AI Training Studio:')
  warn('  1. Install Ollama from https://ollama.ai')
  warn(`  2. Run: ollama pull ${MODEL}`)
  warn('The app will work normally with the Mistral AI cloud API in the meantime.')
  process.exit(0)
}

log(`Ollama detected (${ollamaVersion})`)

// ── 2. Check whether the model is already present ─────────────────────────

let alreadyPulled = false
try {
  const list = execSync('ollama list', { stdio: 'pipe' }).toString()
  // Each line from `ollama list` is: "<name>  <id>  <size>  <modified>"
  // Split on whitespace so "phi3:mini" doesn't match "phi3:mini-instruct".
  alreadyPulled = list.split('\n').some(line => line.split(/\s+/)[0] === MODEL)
} catch {
  // If `ollama list` fails, proceed with the pull attempt anyway.
}

if (alreadyPulled) {
  log(`${GREEN}Model ${MODEL} is already available — skipping pull.${RESET}`)
  process.exit(0)
}

// ── 3. Pull the model ──────────────────────────────────────────────────────

log(`Pulling local edge model "${MODEL}" (CPU-only, no GPU required)…`)
log('This download runs once and may take a few minutes depending on your connection.')

const result = spawnSync('ollama', ['pull', MODEL], {
  stdio: 'inherit', // stream Ollama's progress output directly to the terminal
  shell: false,
})

if (result.status === 0) {
  log(`${GREEN}✓ Model "${MODEL}" pulled successfully.${RESET}`)
  log('You can now use it as a local fallback in AI Training Studio → Local Model.')
} else {
  warn(`ollama pull exited with code ${result.status ?? 'unknown'}.`)
  warn('Common causes: insufficient disk space, network connectivity issues, or Ollama not running.')
  warn(`You can pull the model manually at any time: ollama pull ${MODEL}`)
  warn('Disk space needed: ~2.3 GB for phi3:mini. Run `df -h` to check available space.')
}
