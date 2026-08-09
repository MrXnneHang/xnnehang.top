import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dist = resolve('dist')
const indexPath = resolve(dist, 'sitemap-index.xml')
const robotsPath = resolve(dist, 'robots.txt')

function getLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value.trim())
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const [index, robots] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(robotsPath, 'utf8'),
])

const sitemapUrl = robots.match(/^Sitemap:\s*(\S+)$/m)?.[1]
assert(sitemapUrl, 'robots.txt must declare a sitemap URL')
assert(sitemapUrl.endsWith('/sitemap-index.xml'), 'robots.txt must reference sitemap-index.xml')

const sitemapOrigin = new URL(sitemapUrl).origin
const childSitemaps = getLocs(index)
assert(childSitemaps.length > 0, 'sitemap-index.xml must reference at least one sitemap')

for (const childSitemapUrl of childSitemaps) {
  const childUrl = new URL(childSitemapUrl)
  assert(childUrl.origin === sitemapOrigin, `Sitemap must use ${sitemapOrigin}: ${childSitemapUrl}`)

  const childPath = resolve(dist, `.${childUrl.pathname}`)
  const relativeChildPath = childPath.slice(dist.length + 1)
  assert(relativeChildPath && !relativeChildPath.startsWith('..'), `Invalid sitemap path: ${childSitemapUrl}`)

  const sitemap = await readFile(childPath, 'utf8')
  const pageUrls = getLocs(sitemap)
  assert(pageUrls.length > 0, `Sitemap has no URLs: ${childSitemapUrl}`)

  for (const pageUrl of pageUrls) {
    assert(new URL(pageUrl).origin === sitemapOrigin, `Page URL must use ${sitemapOrigin}: ${pageUrl}`)
  }
}

console.log(`Verified ${childSitemaps.length} sitemap file(s) for ${sitemapOrigin}`)
