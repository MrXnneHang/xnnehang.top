import assert from 'node:assert/strict'
import test from 'node:test'
import { ImageCompareComponent } from '../src/plugins/rehype-component-image-compare.mjs'

const image = (alt) => ({
  type: 'element',
  tagName: 'p',
  properties: {},
  children: [
    {
      type: 'element',
      tagName: 'img',
      properties: { alt, src: `${alt}.png` },
      children: [],
    },
  ],
})

test('builds an on-demand, responsive, lightbox-free comparison', () => {
  const result = ImageCompareComponent(
    { before: 'Original', after: 'SeedVR2', label: 'Image quality comparison' },
    [image('before'), image('after')]
  )
  const [stage] = result.children
  const outputImages = stage.children.slice(0, 2).map((wrapper) => wrapper.children[0])
  const range = stage.children.at(-2)
  const toggle = stage.children.at(-1)

  assert.equal(result.tagName, 'image-compare')
  assert.equal(result.properties.ariaLabel, 'Image quality comparison')
  assert.equal(result.properties.dataAutoplay, undefined)
  assert.equal(range.properties.disabled, true)
  assert.equal(toggle.tagName, 'button')
  assert.equal(toggle.properties.ariaPressed, 'false')
  assert.deepEqual(
    outputImages.map(({ properties }) => [properties.layout, properties['data-no-lightbox']]),
    [
      ['full-width', ''],
      ['full-width', ''],
    ]
  )
})

test('marks autoplay comparisons explicitly', () => {
  const result = ImageCompareComponent({ autoplay: '' }, [image('before'), image('after')])
  assert.equal(result.properties.dataAutoplay, '')
})

test('rejects content that is not exactly two images', () => {
  const result = ImageCompareComponent({}, [image('only')])
  assert.deepEqual(result.properties.className, ['hidden'])
})
