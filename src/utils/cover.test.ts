import { describe, expect, test } from 'vite-plus/test'
import {
  extractFirstBodyImage,
  getPostCoverSource,
  getPostCoverUrl,
  resolveCoverUrl,
} from './cover'

describe('cover utilities', () => {
  test('resolves image-hosting assets and preserves public or remote URLs', () => {
    expect(resolveCoverUrl('../../assets/img/covers/存在主义.jpg')).toBe(
      'https://raw.githubusercontent.com/MrXnneHang/image-hosting/main/covers/%E5%AD%98%E5%9C%A8%E4%B8%BB%E4%B9%89.jpg'
    )
    expect(resolveCoverUrl('/banner.jpg')).toBe('/banner.jpg')
    expect(resolveCoverUrl('https://example.com/cover image.jpg')).toBe(
      'https://example.com/cover%20image.jpg'
    )
  })

  test('extracts angle-bracket markdown image paths', () => {
    expect(getPostCoverSource(undefined, '![封面](<../../assets/img/covers/cover image.jpg>)')).toBe(
      '../../assets/img/covers/cover image.jpg'
    )
    expect(extractFirstBodyImage('![封面](<../../assets/img/covers/cover image.jpg>)')).toBe(
      'https://raw.githubusercontent.com/MrXnneHang/image-hosting/main/covers/cover%20image.jpg'
    )
  })

  test('prefers frontmatter covers over the first body image', () => {
    expect(
      getPostCoverUrl(
        '../../assets/img/covers/frontmatter.jpg',
        '![正文](../../assets/img/body.jpg)'
      )
    ).toContain('/covers/frontmatter.jpg')
  })
})
