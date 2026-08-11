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
const MAX_DESCRIPTION_HTML_LENGTH = 400000
const MAX_TAGS = 20
const GITHUB_REPOSITORY_URL = `https://github.com/${TODO_REPOSITORY.owner}/${TODO_REPOSITORY.name}`
const RAW_REPOSITORY_URL = `https://raw.githubusercontent.com/${TODO_REPOSITORY.owner}/${TODO_REPOSITORY.name}/HEAD`
const MARKDOWN_ALERT_CLASSES = [
  'markdown-alert',
  'markdown-alert-title',
  'markdown-alert-note',
  'markdown-alert-tip',
  'markdown-alert-important',
  'markdown-alert-warning',
  'markdown-alert-caution',
]

function nonEmptyString(value, maxLength = Infinity) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function isoDate(value) {
  return nonEmptyString(value, 40) && Number.isFinite(Date.parse(value)) ? value : null
}

function safeRepositoryPath(value) {
  if (!value || value.startsWith('/')) return null
  const match = value.match(/^([^?#]*)(.*)$/)
  const path = match?.[1] ?? ''
  const suffix = match?.[2] ?? ''
  const segments = []
  for (const segment of path.replace(/^\.?\//, '').split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      if (!segments.length) return null
      segments.pop()
      continue
    }
    segments.push(segment)
  }
  return segments.length ? `${segments.map(encodeURIComponent).join('/')}${suffix}` : null
}

function normalizeMarkdownUrl(value, kind) {
  if (!value || value.startsWith('//')) return null
  if (value.startsWith('#')) return kind === 'link' ? value : null
  try {
    const url = new URL(value)
    if (kind === 'image' && !['http:', 'https:'].includes(url.protocol)) return null
    if (kind === 'link' && !['http:', 'https:', 'mailto:'].includes(url.protocol)) return null
    return value
  } catch {
    const path = safeRepositoryPath(value)
    if (!path) return null
    const [pathname, suffix = ''] = path.split(/(?=[?#])/, 2)
    const encodedPath = pathname
      .split('/')
      .map((segment) => {
        try {
          return encodeURIComponent(decodeURIComponent(segment))
        } catch {
          return encodeURIComponent(segment)
        }
      })
      .join('/')
    return kind === 'image'
      ? `${RAW_REPOSITORY_URL}/${encodedPath}${suffix}`
      : `${GITHUB_REPOSITORY_URL}/blob/HEAD/${encodedPath}${suffix}`
  }
}

function normalizeImageSrcset(value) {
  if (!value) return null
  const normalized = []
  for (const candidate of value.split(',')) {
    const match = candidate.trim().match(/^(\S+?)(?:\s+(\d+(?:\.\d+)?x|\d+w))?$/)
    if (!match) return null
    const url = normalizeMarkdownUrl(match[1], 'image')
    if (!url) return null
    normalized.push(`${url}${match[2] ? ` ${match[2]}` : ''}`)
  }
  return normalized.join(', ')
}

function sanitizeHtmlDescription(html) {
  if (!html) return ''
  return sanitizeHtml(html, {
    allowedTags: [
      'a',
      'blockquote',
      'br',
      'code',
      'del',
      'details',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'img',
      'input',
      'kbd',
      'li',
      'mark',
      'markdown-accessiblity-table',
      'math',
      'math-renderer',
      'ol',
      'p',
      'picture',
      'pre',
      's',
      'section',
      'source',
      'span',
      'strong',
      'sub',
      'summary',
      'sup',
      'table',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'themed-picture',
      'tr',
      'tt',
      'ul',
    ],
    allowedAttributes: {
      '*': ['aria-label', 'dir'],
      a: [
        'aria-describedby',
        'aria-label',
        'data-footnote-backref',
        'data-footnote-ref',
        'href',
        'id',
        'rel',
        'target',
        'title',
      ],
      img: ['alt', 'data-canonical-src', 'decoding', 'height', 'loading', 'src', 'title', 'width'],
      input: ['aria-label', 'checked', 'disabled', 'type'],
      li: ['id'],
      math: ['display', 'xmlns'],
      'math-renderer': ['aria-label'],
      ol: ['start'],
      section: ['data-footnotes'],
      source: ['data-canonical-src', 'media', 'srcset'],
      'themed-picture': ['data-catalyst-inline'],
      table: ['role'],
      td: ['align'],
      th: ['align'],
    },
    allowedClasses: {
      '*': MARKDOWN_ALERT_CLASSES,
      a: ['data-footnote-backref', 'issue-link', 'user-mention', 'notranslate'],
      code: ['notranslate'],
      div: [
        ...MARKDOWN_ALERT_CLASSES,
        'highlight',
        /^highlight-source-[a-z0-9-]+$/,
        'notranslate',
        'render-plaintext-hidden',
      ],
      input: ['task-list-item-checkbox'],
      li: ['task-list-item'],
      'math-renderer': ['js-display-math', 'js-inline-math'],
      pre: ['notranslate'],
      section: ['footnotes'],
      span: [/^pl-[a-z0-9-]+$/, 'notranslate', 'sr-only'],
      ul: ['contains-task-list'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const { href: sourceHref, rel: _rel, target: _target, ...safeAttribs } = attribs
        const href = normalizeMarkdownUrl(sourceHref, 'link')
        const external = /^https?:\/\//i.test(href ?? '')
        return {
          tagName,
          attribs: href
            ? {
                ...safeAttribs,
                href,
                ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
              }
            : safeAttribs,
        }
      },
      img: (tagName, attribs) => {
        const { src: sourceSrc, loading: _loading, decoding: _decoding, ...safeAttribs } = attribs
        return {
          tagName,
          attribs: {
            ...safeAttribs,
            src: normalizeMarkdownUrl(sourceSrc, 'image') ?? undefined,
            loading: 'lazy',
            decoding: 'async',
          },
        }
      },
      source: (tagName, attribs) => {
        const srcset = normalizeImageSrcset(attribs.srcset)
        return {
          tagName,
          attribs: srcset ? { ...attribs, srcset } : { media: attribs.media },
        }
      },
      input: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...(attribs.checked !== undefined ? { checked: '' } : {}),
          type: 'checkbox',
          disabled: '',
          class: 'task-list-item-checkbox',
          'aria-label': attribs['aria-label'] ?? 'Task list item',
        },
      }),
    },
    exclusiveFilter(frame) {
      if (frame.tag === 'a' && !frame.attribs.href) return 'excludeTag'
      if (frame.tag === 'img' && !frame.attribs.src) return true
      if (frame.tag === 'source' && !frame.attribs.srcset) return true
      return false
    },
  })
}

function sanitizeDescription(bodyHtml) {
  return sanitizeHtmlDescription(bodyHtml ?? '')
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
  if (typeof issue.body_html !== 'string' && issue.body_html !== null) return null
  if (issue.body_html && issue.body_html.length > MAX_DESCRIPTION_HTML_LENGTH) return null
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
    descriptionHtml: sanitizeDescription(issue.body_html),
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
    task.descriptionHtml.length > MAX_DESCRIPTION_HTML_LENGTH ||
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
