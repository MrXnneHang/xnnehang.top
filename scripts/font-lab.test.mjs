import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { FontLabComponent } from '../src/plugins/rehype-component-font-lab.mjs'

const paragraph = (text) => ({
  type: 'element',
  tagName: 'p',
  properties: {},
  children: [{ type: 'text', value: text }],
})

test('builds an accessible Chinese typeface lab with five real candidates', () => {
  const result = FontLabComponent({ label: '文章字体候选' }, [paragraph('山川异域，风月同天。')])
  const controls = result.children[1]
  const specimen = result.children[2]

  assert.equal(result.tagName, 'font-lab')
  assert.equal(result.properties.role, 'region')
  assert.equal(result.properties.ariaLabel, '文章字体候选')
  assert.equal(controls.properties.role, 'group')
  assert.equal(controls.children.length, 5)
  assert.deepEqual(
    controls.children.map((button) => button.properties.dataFont),
    ['current', 'noto-sans-sc', 'lxgw-neo-xihei', 'smiley-sans', 'lxgw-wenkai-screen']
  )
  assert.equal(controls.children[0].properties.ariaPressed, 'true')
  assert.ok(controls.children.every((button) => button.properties.disabled === true))
  assert.equal(specimen.properties.dataFontSpecimen, '')
  assert.equal(specimen.children[0].children[0].value, '山川异域，风月同天。')
})

test('localizes controls without translating candidate identities', () => {
  const result = FontLabComponent({ locale: 'en' }, [paragraph('Chinese typography')])
  const [topbar, controls] = result.children

  assert.equal(result.properties.dataLocale, 'en')
  assert.equal(topbar.children[0].children[0].children[0].value, 'Type proof')
  assert.equal(controls.properties.ariaLabel, 'Choose a preview typeface')
  assert.equal(controls.children[1].children[0].children[0].value, 'Noto Sans SC')
})

test('ships Smiley Sans as licensed unicode-range chunks', async () => {
  const directory = resolve('public/fonts/smiley-sans-v2')
  const css = await readFile(resolve(directory, 'result.css'), 'utf8')
  const chunks = [...css.matchAll(/url\("\.\/(.+?\.woff2)"\)/g)].map((match) => match[1])
  const files = await readdir(directory)

  assert.match(css, /font-family:"Smiley Sans Lab"/)
  assert.match(css, /unicode-range:/)
  assert.ok(chunks.length > 1)
  assert.ok(chunks.every((chunk) => files.includes(chunk)))
  assert.ok(files.includes('LICENSE.txt'))
  assert.ok(files.includes('SOURCE.txt'))
  assert.ok(files.every((file) => !/\.(?:ttf|otf)$/i.test(file)))
  await Promise.all(chunks.map((chunk) => access(resolve(directory, chunk))))
})

test('rejects an empty font lab', () => {
  const result = FontLabComponent({}, [])
  assert.deepEqual(result.properties.className, ['hidden'])
})
