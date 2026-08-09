import { getCollection, type CollectionEntry } from 'astro:content'
import { getPostCoverUrl } from '@utils/cover'

type Post = CollectionEntry<'posts'>

const SITE_URL = 'https://xnnehang.top'
const MAX_POSTS = 3

export async function GET() {
  const allPosts = await getCollection('posts', ({ data }: Post) => {
    return data.draft !== true && data.featured === true
  })

  // Sort by published date, newest first
  allPosts.sort(
    (a: Post, b: Post) =>
      new Date(b.data.published).getTime() - new Date(a.data.published).getTime()
  )

  const posts = allPosts.slice(0, MAX_POSTS).map((post: Post) => {
    const coverUrl = getPostCoverUrl(post.data.image, post.body, post.id)

    return {
      title: post.data.title,
      description: post.data.description || '',
      published: post.data.published.toISOString().slice(0, 10),
      url: `${SITE_URL}/posts/${post.id}/`,
      coverUrl,
    }
  })

  return new Response(JSON.stringify(posts, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      // Allow GitHub Actions scripts to fetch this endpoint cross-origin
      'Access-Control-Allow-Origin': '*',
    },
  })
}
