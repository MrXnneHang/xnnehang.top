import rss from '@astrojs/rss'
import { getSortedPosts } from '@utils/content-utils'
import { getPostRouteSlug } from '@utils/post-locale'
import { url } from '@utils/url-utils'
import type { APIContext } from 'astro'
import type { CollectionEntry } from 'astro:content'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { siteConfig } from '@/config'
import { LOCALE_DETAILS, type Locale } from '@/i18n/locales'

const parser = new MarkdownIt()
const invalidXmlCharsPattern = new RegExp(
  String.raw`[\u{0}-\u{8}\u{B}\u{C}\u{E}-\u{1F}\u{7F}-\u{9F}\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}]`,
  'gu'
)

function stripInvalidXmlChars(str: string): string {
  return str.replace(invalidXmlCharsPattern, '')
}

export async function buildRssResponse(context: APIContext, locale: Locale): Promise<Response> {
  const blog = await getSortedPosts(locale)

  return rss({
    title: siteConfig.title,
    description: siteConfig.subtitle || 'No description',
    site: context.site ?? 'https://xnnehang.top',
    items: blog.map((post: CollectionEntry<'posts'>) => {
      const content = typeof post.body === 'string' ? post.body : String(post.body || '')
      const cleanedContent = stripInvalidXmlChars(content)
      return {
        title: post.data.title,
        pubDate: post.data.published,
        description: post.data.description || '',
        link: url(`/posts/${getPostRouteSlug(post)}/`, locale),
        content: sanitizeHtml(parser.render(cleanedContent), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      }
    }),
    customData: `<language>${LOCALE_DETAILS[locale].rssLanguage}</language>`,
  })
}
