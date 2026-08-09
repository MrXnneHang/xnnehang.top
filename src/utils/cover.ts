const IMAGE_HOSTING_RAW_BASE = 'https://raw.githubusercontent.com/MrXnneHang/image-hosting/main'
const BLOG_RAW_BASE = 'https://raw.githubusercontent.com/MrXnneHang/xnnehang.top/main'

function unwrapMarkdownPath(value: string): string {
  const path = value.trim()
  if (path.startsWith('<') && path.endsWith('>')) return path.slice(1, -1).trim()
  return path
}

export function resolveCoverUrl(image: string | undefined, postId?: string): string | null {
  if (!image) return null
  const path = unwrapMarkdownPath(image)
  if (path.startsWith('http://') || path.startsWith('https://')) return encodeURI(path)
  if (path.startsWith('/')) return encodeURI(path)

  const stripped = path.replace(/^(\.\.\/)+/, '')
  if (stripped.startsWith('assets/img/')) {
    return encodeURI(`${IMAGE_HOSTING_RAW_BASE}/${stripped.slice('assets/img/'.length)}`)
  }

  if (path.startsWith('./') && postId) {
    return encodeURI(`${BLOG_RAW_BASE}/src/content/posts/${path.slice(2)}`)
  }

  return encodeURI(`${BLOG_RAW_BASE}/src/${stripped}`)
}

export function extractFirstBodyImagePath(body: string | undefined): string | null {
  if (!body) return null
  const match = body.match(/!\[.*?\]\((<[^>]+>|[^)]+)\)/)
  if (!match) return null
  return unwrapMarkdownPath(match[1])
}

export function getPostCoverSource(
  image: string | undefined,
  body: string | undefined
): string | null {
  return image ? unwrapMarkdownPath(image) : extractFirstBodyImagePath(body)
}

export function extractFirstBodyImage(body: string | undefined, postId?: string): string | null {
  const source = extractFirstBodyImagePath(body)
  return source ? resolveCoverUrl(source, postId) : null
}

export function getPostCoverUrl(
  image: string | undefined,
  body: string | undefined,
  postId?: string
): string | null {
  return resolveCoverUrl(image, postId) ?? extractFirstBodyImage(body, postId)
}
