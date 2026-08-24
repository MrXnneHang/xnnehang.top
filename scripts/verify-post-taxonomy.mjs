import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const POSTS_DIR = resolve(ROOT, 'src/content/posts')
const ASSIGNMENTS_PATH = resolve(ROOT, 'src/data/post-taxonomy-assignments.json')
const CATEGORY_KEYS = new Set(['technology', 'culture', 'thought', 'life'])
const KIND_KEYS = new Set(['tutorial', 'review', 'reflection', 'learning-note', 'resource', 'note'])
const FORBIDDEN_TAGS = new Set([
  '教程',
  'Tutorials',
  '观后',
  'Reviews',
  '思考',
  'Reflections',
  '边写边学',
  'Learning as I Build',
  '技术',
  'Technology',
  '读书',
  'Reading',
  '游戏',
  'Games',
  '资源',
  'Resources',
])

function leadingFrontmatter(text, filename) {
  const match = text.match(/^---\r?\n(.*?)\r?\n---\r?\n/s)
  if (!match) throw new Error(`${filename}: missing leading frontmatter`)
  return match[1]
}

function scalar(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''
}

function list(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:[^\\n]*(?:\\n  - [^\\n]*)*`, 'm'))
  if (!match) return []
  return [...match[0].matchAll(/^  -\s*(.+)$/gm)].map((item) => item[1].trim())
}

function metadata(frontmatter) {
  return {
    category: scalar(frontmatter, 'category'),
    kind: scalar(frontmatter, 'kind'),
    tags: list(frontmatter, 'tags'),
  }
}

const assignments = JSON.parse(await readFile(ASSIGNMENTS_PATH, 'utf8'))
const filenames = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md')).sort()
const chinese = filenames.filter((name) => !name.endsWith('.en.md'))
const english = filenames.filter((name) => name.endsWith('.en.md'))
const errors = []

if (filenames.length !== 144 || chinese.length !== 72 || english.length !== 72) {
  errors.push(
    `expected 72 bilingual pairs / 144 files, got ${chinese.length} Chinese, ${english.length} English, ${filenames.length} total`
  )
}

const slugs = new Set(chinese.map((name) => name.slice(0, -3)))
if (
  slugs.size !== Object.keys(assignments).length ||
  [...slugs].some((slug) => !assignments[slug])
) {
  errors.push('assignment fixture does not exactly cover Chinese source slugs')
}

for (const slug of slugs) {
  const zh = metadata(
    leadingFrontmatter(await readFile(resolve(POSTS_DIR, `${slug}.md`), 'utf8'), `${slug}.md`)
  )
  const en = metadata(
    leadingFrontmatter(await readFile(resolve(POSTS_DIR, `${slug}.en.md`), 'utf8'), `${slug}.en.md`)
  )
  const expected = assignments[slug]

  for (const [locale, data] of [
    ['zh', zh],
    ['en', en],
  ]) {
    if (!CATEGORY_KEYS.has(data.category)) {
      errors.push(`${slug} ${locale}: invalid category ${JSON.stringify(data.category)}`)
    }
    if (!KIND_KEYS.has(data.kind)) {
      errors.push(`${slug} ${locale}: invalid kind ${JSON.stringify(data.kind)}`)
    }
    const forbidden = data.tags.filter((tag) => FORBIDDEN_TAGS.has(tag))
    if (forbidden.length > 0) {
      errors.push(`${slug} ${locale}: forbidden structural tags ${forbidden.join(', ')}`)
    }
  }

  if (zh.category !== expected.category || zh.kind !== expected.kind) {
    errors.push(`${slug}: frontmatter differs from assignment fixture`)
  }
  if (
    zh.category !== en.category ||
    zh.kind !== en.kind ||
    JSON.stringify(zh.tags) !== JSON.stringify(en.tags)
  ) {
    errors.push(`${slug}: bilingual taxonomy fields differ`)
  }
}

if (errors.length > 0) {
  throw new Error(errors.map((error) => `- ${error}`).join('\n'))
}

console.log('Validated 72 bilingual taxonomy pairs (144 frontmatter blocks).')
