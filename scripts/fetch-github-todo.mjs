import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  TODO_REPOSITORY,
  TODO_WORKSPACE_LABEL_ID,
  createSnapshot,
  isTodoSnapshot,
  normalizeIssue,
} from './todo-lib.mjs'

const DIST_DIR = resolve('dist')
const OUTPUT_FILE = resolve(DIST_DIR, 'todo.json')
const BASELINE_FILE = resolve('public/todo.json')
const FALLBACK_URL = 'https://xnnehang.top/todo.json'
const API_BASE_URL = `https://api.github.com/repos/${TODO_REPOSITORY.owner}/${TODO_REPOSITORY.name}`

function headers() {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured')
  return {
    Accept: 'application/vnd.github.full+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function nextPage(response) {
  const link = response.headers.get('link')
  if (!link) return null
  return (
    link
      .split(',')
      .map((part) => part.trim())
      .find((part) => part.endsWith('rel="next"'))
      ?.match(/<([^>]+)>/)?.[1] ?? null
  )
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
  return response
}

async function fetchLiveSnapshot() {
  if (!Number.isSafeInteger(TODO_WORKSPACE_LABEL_ID) || TODO_WORKSPACE_LABEL_ID <= 0) {
    throw new Error('TODO_WORKSPACE_LABEL_ID is not configured')
  }

  const repositoryResponse = await fetchJson(API_BASE_URL)
  const repository = await repositoryResponse.json()
  if (repository.node_id !== TODO_REPOSITORY.nodeId)
    throw new Error('Repository identity did not match')

  const issues = []
  let page = `${API_BASE_URL}/issues?state=all&per_page=100`
  while (page) {
    const response = await fetchJson(page)
    const payload = await response.json()
    if (!Array.isArray(payload)) throw new Error('Issues response is not an array')
    issues.push(...payload)
    page = nextPage(response)
  }

  const tasks = issues.map(normalizeIssue).filter(Boolean)
  return createSnapshot(tasks)
}

async function readSnapshot(file) {
  const snapshot = JSON.parse(await readFile(file, 'utf8'))
  if (!isTodoSnapshot(snapshot)) throw new Error('Snapshot schema is invalid')
  return snapshot
}

async function fetchPublishedSnapshot() {
  const response = await fetch(FALLBACK_URL, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`Published fallback returned ${response.status}`)
  const snapshot = await response.json()
  if (!isTodoSnapshot(snapshot)) throw new Error('Published fallback schema is invalid')
  return { ...snapshot, status: 'fallback' }
}

async function fallbackSnapshot() {
  try {
    return await fetchPublishedSnapshot()
  } catch (error) {
    console.warn(`Published Todo fallback unavailable: ${error.message}`)
    const baseline = await readSnapshot(OUTPUT_FILE).catch(() => readSnapshot(BASELINE_FILE))
    return { ...baseline, status: 'fallback' }
  }
}

async function main() {
  let snapshot
  try {
    snapshot = await fetchLiveSnapshot()
    console.log(`Generated Todo snapshot with ${snapshot.tasks.length} task(s)`)
  } catch (error) {
    console.warn(`GitHub Todo data unavailable: ${error.message}`)
    snapshot = await fallbackSnapshot()
    console.log(`Reused ${snapshot.tasks.length} Todo task(s) from a validated fallback`)
  }

  await mkdir(DIST_DIR, { recursive: true })
  await writeFile(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`)
}

await main()
