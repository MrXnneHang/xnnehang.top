import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dist = resolve('dist')
const indexPath = resolve(dist, 'sitemap-index.xml')
const robotsPath = resolve(dist, 'robots.txt')
const siteOrigin = 'https://xnnehang.top'

function getLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value.trim())
}

function getItemLinks(xml) {
  return [...xml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)].map(
    ([, value]) => value.trim()
  )
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function getStylesheetHrefs(html) {
  return [...html.matchAll(/<link\b[^>]*>/g)].flatMap(([tag]) => {
    const rel = tag.match(/\brel=["']([^"']+)["']/)?.[1]
    const href = tag.match(/\bhref=["']([^"']+)["']/)?.[1]
    return rel?.split(/\s+/).includes('stylesheet') && href ? [href] : []
  })
}

const [
  index,
  robots,
  rootRss,
  englishRss,
  rootHtml,
  englishHtml,
  rootCatalog,
  englishCatalog,
  englishGraph,
] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(robotsPath, 'utf8'),
  readFile(resolve(dist, 'rss.xml'), 'utf8'),
  readFile(resolve(dist, 'en/rss.xml'), 'utf8'),
  readFile(resolve(dist, 'index.html'), 'utf8'),
  readFile(resolve(dist, 'en/index.html'), 'utf8'),
  readFile(resolve(dist, 'statistics-content.json'), 'utf8').then(JSON.parse),
  readFile(resolve(dist, 'en/statistics-content.json'), 'utf8').then(JSON.parse),
  readFile(resolve(dist, 'en/graph-data.json'), 'utf8').then(JSON.parse),
])

const sitemapUrl = robots.match(/^Sitemap:\s*(\S+)$/m)?.[1]
assert(sitemapUrl, 'robots.txt must declare a sitemap URL')
assert(sitemapUrl.endsWith('/sitemap-index.xml'), 'robots.txt must reference sitemap-index.xml')

const sitemapOrigin = new URL(sitemapUrl).origin
const childSitemaps = getLocs(index)
assert(childSitemaps.length > 0, 'sitemap-index.xml must reference at least one sitemap')

const allPageUrls = []
for (const childSitemapUrl of childSitemaps) {
  const childUrl = new URL(childSitemapUrl)
  assert(childUrl.origin === sitemapOrigin, `Sitemap must use ${sitemapOrigin}: ${childSitemapUrl}`)

  const childPath = resolve(dist, `.${childUrl.pathname}`)
  const relativeChildPath = childPath.slice(dist.length + 1)
  assert(
    relativeChildPath && !relativeChildPath.startsWith('..'),
    `Invalid sitemap path: ${childSitemapUrl}`
  )

  const sitemap = await readFile(childPath, 'utf8')
  const pageUrls = getLocs(sitemap)
  assert(pageUrls.length > 0, `Sitemap has no URLs: ${childSitemapUrl}`)
  allPageUrls.push(...pageUrls)

  for (const pageUrl of pageUrls) {
    assert(
      new URL(pageUrl).origin === sitemapOrigin,
      `Page URL must use ${sitemapOrigin}: ${pageUrl}`
    )
  }
}

for (const pathname of ['/en/', '/en/about/', '/en/statistics/']) {
  assert(
    allPageUrls.includes(`${siteOrigin}${pathname}`),
    `Sitemap must include the English route: ${pathname}`
  )
}

const rootItemLinks = getItemLinks(rootRss)
const englishItemLinks = getItemLinks(englishRss)
assert(rootRss.includes('<language>zh-CN</language>'), 'Root RSS must declare zh-CN')
assert(englishRss.includes('<language>en</language>'), 'English RSS must declare en')
assert(rootItemLinks.length > 0, 'Root RSS must contain posts')
assert(englishItemLinks.length > 0, 'English RSS must contain posts')
assert(
  rootItemLinks.every((link) => link.startsWith(`${siteOrigin}/posts/`)),
  'Root RSS items must use root post routes'
)
assert(
  englishItemLinks.every((link) => link.startsWith(`${siteOrigin}/en/posts/`)),
  'English RSS items must use English post routes'
)
assert(!englishRss.includes('.en/'), 'English RSS must not expose content file suffixes')
assert(
  rootHtml.includes(`href="${siteOrigin}/rss.xml"`),
  'Root pages must advertise the root RSS feed'
)
assert(
  englishHtml.includes(`href="${siteOrigin}/en/rss.xml"`),
  'English pages must advertise the English RSS feed'
)

assert(rootCatalog.posts.length > 0, 'Root statistics catalog must contain posts')
assert(englishCatalog.posts.length > 0, 'English statistics catalog must contain posts')
assert(
  englishCatalog.posts.every((post) => post.path.startsWith('/en/posts/')),
  'English publication statistics must use English post routes'
)

const stylesheetHrefs = getStylesheetHrefs(rootHtml)
assert(stylesheetHrefs.length > 0, 'Root page must reference at least one stylesheet')
const stylesheets = await Promise.all(
  stylesheetHrefs.map(async (href) => {
    const stylesheetUrl = new URL(href, siteOrigin)
    assert(stylesheetUrl.origin === siteOrigin, `Stylesheet must use ${siteOrigin}: ${href}`)
    return readFile(resolve(dist, `.${stylesheetUrl.pathname}`), 'utf8')
  })
)
const emittedCss = stylesheets.join('\n')
for (const variable of ['text-90', 'text-75', 'text-50', 'text-30', 'text-25', 'icon-content']) {
  assert(
    new RegExp(`--${variable}:`).test(emittedCss),
    `Built CSS must define the --${variable} foreground variable`
  )
}
assert(
  !/(?:^|[^\w-])#[\da-f]{4}(?![\da-f])|(?:^|[^\w-])#[\da-f]{8}(?![\da-f])/i.test(emittedCss),
  'Built CSS contains 4/8-digit alpha hex colors; keep Vite build.cssTarget compatible with embedded Android WebViews'
)

const requiredEnglishLinks = [
  ['blog-rebuild-inspirations', 'cloud-service-provider'],
  ['blog-rebuild-inspirations', 'rag-blog-graph'],
]
for (const [source, target] of requiredEnglishLinks) {
  assert(
    englishGraph.links.some((link) => link.source === source && link.target === target),
    `English graph must include ${source} -> ${target}`
  )
}

console.log(
  `Verified ${childSitemaps.length} sitemap file(s), bilingual RSS, publication catalogs, and graph links for ${sitemapOrigin}`
)
