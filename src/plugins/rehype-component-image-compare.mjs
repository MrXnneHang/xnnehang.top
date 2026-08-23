/// <reference types="mdast" />
import { h } from 'hastscript'

function unwrapImage(node) {
  if (node?.type === 'element' && node.tagName === 'img') return node
  if (node?.type !== 'element' || node.tagName !== 'p') return undefined

  const children = (node.children ?? []).filter(
    (child) => child.type !== 'text' || child.value.trim() !== ''
  )
  return children.length === 1 && children[0].type === 'element' && children[0].tagName === 'img'
    ? children[0]
    : undefined
}

export function ImageCompareComponent(properties, children) {
  const content = (children ?? []).filter(
    (child) => child.type !== 'text' || child.value.trim() !== ''
  )
  const images = content.map(unwrapImage)

  if (images.length !== 2 || images.some((image) => !image)) {
    return h(
      'div',
      { class: 'hidden' },
      'Invalid compare directive. ("compare" must contain exactly two Markdown images.)'
    )
  }

  for (const image of images) {
    image.properties = {
      ...image.properties,
      layout: 'full-width',
      'data-no-lightbox': '',
    }
  }

  const before = properties.before || 'Before'
  const after = properties.after || 'After'
  const label = properties.label || `${before} / ${after}`
  const autoplay = properties.autoplay !== undefined

  return h(
    'image-compare',
    {
      class: 'image-compare',
      role: 'group',
      ariaLabel: label,
      dataAutoplay: autoplay ? '' : undefined,
    },
    [
      h('div', { class: 'image-compare__stage' }, [
        h('div', { class: 'image-compare__image image-compare__before' }, images[0]),
        h('div', { class: 'image-compare__image image-compare__after' }, images[1]),
        h('span', { class: 'image-compare__label image-compare__label--before' }, before),
        h('span', { class: 'image-compare__label image-compare__label--after' }, after),
        h('span', { class: 'image-compare__divider', ariaHidden: 'true' }, [
          h('span', { class: 'image-compare__handle' }),
        ]),
        h('input', {
          class: 'image-compare__range',
          type: 'range',
          min: 0,
          max: 100,
          value: 50,
          disabled: true,
          ariaLabel: label,
          ariaValueText: '50%',
        }),
        h(
          'button',
          {
            class: 'image-compare__toggle',
            type: 'button',
            ariaLabel: '进入图片对比',
            ariaPressed: 'false',
          },
          h('span', { class: 'image-compare__toggle-icon', ariaHidden: 'true' })
        ),
      ]),
    ]
  )
}
