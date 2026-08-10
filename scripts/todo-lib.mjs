import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

export const TODO_REPOSITORY = {
  owner: 'MrXnneHang',
  name: 'xnnehang.top',
  nodeId: 'R_kgDOSusWYQ',
}

export const ALLOWED_AUTHOR_IDS = new Set([150757813, 260583610])
export const TODO_WORKSPACE_LABEL_ID = Number.parseInt(
  process.env.TODO_WORKSPACE_LABEL_ID ?? '0',
  10
)

const MAX_TITLE_LENGTH = 240
const MAX_BODY_LENGTH = 40000
const MAX_TAGS = 20
const markdown = new MarkdownIt({ html: false, linkify: false, breaks: true })

function nonEmptyString(value, maxLength = Infinity) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function isoDate(value) {
  return nonEmptyString(value, 40) && Number.isFinite(Date.parse(value)) ? value : null
}

function sanitizeHtmlDescription(html) {
  if (!html) return ''
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'del',
      'code',
      'pre',
      'blockquote',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'h4',
      'a',
    ],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  })
}

function sanitizeDescription(body) {
  return sanitizeHtmlDescription(body ? markdown.render(body) : '')
}

function normalizeTags(labels) {
  if (!Array.isArray(labels) || labels.length > MAX_TAGS + 1) return null
  const tags = []
  let hasWorkspaceLabel = false

  for (const label of labels) {
    if (!Number.isSafeInteger(label?.id) || !nonEmptyString(label?.name, 100)) return null
    if (label.id === TODO_WORKSPACE_LABEL_ID) {
      hasWorkspaceLabel = true
      continue
    }
    if (!/^[0-9a-f]{6}$/i.test(label.color ?? '')) return null
    tags.push({
      id: label.id,
      name: label.name.trim(),
      color: label.color.toLowerCase(),
    })
  }

  return hasWorkspaceLabel ? tags.sort((left, right) => left.name.localeCompare(right.name)) : null
}

export function normalizeIssue(issue) {
  if (!issue || typeof issue !== 'object' || issue.pull_request) return null
  if (!Number.isSafeInteger(issue.number) || issue.number <= 0) return null
  if (!nonEmptyString(issue.title, MAX_TITLE_LENGTH)) return null
  if (typeof issue.body !== 'string' && issue.body !== null) return null
  if (issue.body && issue.body.length > MAX_BODY_LENGTH) return null
  if (!ALLOWED_AUTHOR_IDS.has(issue.user?.id)) return null

  const tags = normalizeTags(issue.labels)
  if (!tags) return null

  const state = issue.state?.toLowerCase()
  if (state !== 'open' && state !== 'closed') return null
  const createdAt = isoDate(issue.created_at)
  const updatedAt = isoDate(issue.updated_at)
  const closedAt = issue.closed_at === null ? null : isoDate(issue.closed_at)
  if (
    !createdAt ||
    !updatedAt ||
    (state === 'closed' && !closedAt) ||
    (state === 'open' && closedAt)
  )
    return null

  return {
    number: issue.number,
    title: issue.title.trim(),
    descriptionHtml: sanitizeDescription(issue.body ?? ''),
    issueUrl: `https://github.com/${TODO_REPOSITORY.owner}/${TODO_REPOSITORY.name}/issues/${issue.number}`,
    state,
    tags,
    createdAt,
    updatedAt,
    closedAt,
  }
}

export function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    if (left.state !== right.state) return left.state === 'open' ? -1 : 1
    const leftDate = left.closedAt ?? left.updatedAt
    const rightDate = right.closedAt ?? right.updatedAt
    return rightDate.localeCompare(leftDate) || right.number - left.number
  })
}

export function createSnapshot(
  tasks,
  { generatedAt = new Date().toISOString(), status = 'live' } = {}
) {
  const sortedTasks = sortTasks(tasks)
  return {
    version: 1,
    generatedAt,
    status,
    source: 'github-issues',
    counts: {
      active: sortedTasks.filter((task) => task.state === 'open').length,
      completed: sortedTasks.filter((task) => task.state === 'closed').length,
    },
    tasks: sortedTasks,
  }
}

export function isTodoSnapshot(value) {
  if (!value || typeof value !== 'object') return false
  if (
    value.version !== 1 ||
    !['live', 'fallback'].includes(value.status) ||
    value.source !== 'github-issues'
  )
    return false
  if (!isoDate(value.generatedAt) || !value.counts || !Array.isArray(value.tasks)) return false
  if (!Number.isSafeInteger(value.counts.active) || value.counts.active < 0) return false
  if (!Number.isSafeInteger(value.counts.completed) || value.counts.completed < 0) return false

  const tasks = value.tasks.map(normalizePublishedTask)
  if (tasks.some((task) => task === null)) return false
  const computed = createSnapshot(tasks, { generatedAt: value.generatedAt, status: value.status })
  return (
    computed.counts.active === value.counts.active &&
    computed.counts.completed === value.counts.completed
  )
}

function normalizePublishedTask(task) {
  if (!task || typeof task !== 'object') return null
  if (!Number.isSafeInteger(task.number) || task.number <= 0) return null
  if (!nonEmptyString(task.title, MAX_TITLE_LENGTH) || typeof task.descriptionHtml !== 'string')
    return null
  if (
    task.descriptionHtml.length > MAX_BODY_LENGTH ||
    sanitizeHtmlDescription(task.descriptionHtml) !== task.descriptionHtml
  )
    return null
  if (
    task.issueUrl !==
    `https://github.com/${TODO_REPOSITORY.owner}/${TODO_REPOSITORY.name}/issues/${task.number}`
  )
    return null
  if (
    !['open', 'closed'].includes(task.state) ||
    !Array.isArray(task.tags) ||
    task.tags.length > MAX_TAGS
  )
    return null
  if (!isoDate(task.createdAt) || !isoDate(task.updatedAt)) return null
  if (task.closedAt !== null && !isoDate(task.closedAt)) return null
  if (
    (task.state === 'open' && task.closedAt !== null) ||
    (task.state === 'closed' && !task.closedAt)
  )
    return null

  for (const tag of task.tags) {
    if (
      !Number.isSafeInteger(tag?.id) ||
      !nonEmptyString(tag?.name, 100) ||
      !/^[0-9a-f]{6}$/.test(tag?.color ?? '')
    )
      return null
  }
  return task
}
