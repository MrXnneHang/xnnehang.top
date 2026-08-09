import path from 'node:path'
import { getImage } from 'astro:assets'
import { getDir } from './url-utils'
import { resolveCoverUrl } from './cover'

const imageFiles = import.meta.glob<ImageMetadata>('../content/posts/**/*.{jpg,jpeg,png,webp,gif}', {
  import: 'default',
})
const assetFiles = import.meta.glob<ImageMetadata>('../assets/**/*.{jpg,jpeg,png,webp,gif}', {
  import: 'default',
})
const allImageFiles = { ...imageFiles, ...assetFiles }

export async function optimizePostCover(
  source: string | null,
  postId: string,
  width = 480
): Promise<string> {
  if (!source) return ''
  if (source.startsWith('/') || source.startsWith('http://') || source.startsWith('https://')) {
    const resolved = resolveCoverUrl(source, postId) ?? ''
    return resolved.toLowerCase().split(/[?#]/, 1)[0].endsWith('.webp') ? resolved : ''
  }

  const postDir = getDir(postId)
  const normalized = path
    .normalize(path.join('../content/posts/', postDir, source))
    .replace(/\\/g, '/')
  const loader = allImageFiles[normalized]
  if (!loader) return resolveCoverUrl(source, postId) ?? ''

  const metadata = await loader()
  const optimized = await getImage({
    src: metadata,
    width,
    format: 'webp',
    quality: 72,
  })
  return optimized.src
}
