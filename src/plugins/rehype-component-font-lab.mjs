/// <reference types="mdast" />
import { h } from 'hastscript'

const COPY = {
  zh: {
    eyebrow: '正文试样',
    label: '中文字体候选检视台',
    controls: '选择预览字体',
    ready: '本站当前字体 · 无额外加载',
    loading: '正在按需加载字体…',
    loaded: '字体已加载',
    local: '仅使用本机字体',
    unavailable: '本机未安装，已显示系统回退字体',
    error: '字体加载失败，已显示系统回退字体',
  },
  en: {
    eyebrow: 'Type proof',
    label: 'Chinese typeface lab',
    controls: 'Choose a preview typeface',
    ready: 'Current site font · no extra download',
    loading: 'Loading the typeface on demand…',
    loaded: 'Typeface loaded',
    local: 'Uses a locally installed font only',
    unavailable: 'Not installed locally; showing the system fallback',
    error: 'Typeface failed to load; showing the system fallback',
  },
}

const CANDIDATES = [
  {
    key: 'current',
    name: '本站当前',
    nameEn: 'Current site',
    family: "Roboto, 'PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', system-ui, sans-serif",
    note: 'Roboto + 系统中文回退',
    noteEn: 'Roboto + system CJK fallback',
  },
  {
    key: 'noto-sans-sc',
    name: 'Noto Sans SC',
    nameEn: 'Noto Sans SC',
    family: "'Noto Sans SC Variable', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    note: '思源黑体同源 · 可变字重',
    noteEn: 'Source Han Sans sibling · variable weight',
  },
  {
    key: 'lxgw-neo-xihei',
    name: '霞鹜新晰黑',
    nameEn: 'LXGW Neo XiHei',
    family: "'LXGW Neo XiHei', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    note: '字面饱满 · 现代开源黑体',
    noteEn: 'Fuller forms · modern open-source sans',
  },
  {
    key: 'smiley-sans',
    name: '得意黑',
    nameEn: 'Smiley Sans',
    family: "'Smiley Sans Lab', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    note: '窄、斜、大弧线 · 展示字体',
    noteEn: 'Narrow, oblique, sweeping · display face',
  },
  {
    key: 'lxgw-wenkai-screen',
    name: '霞鹜文楷 Screen',
    nameEn: 'LXGW WenKai Screen',
    family: "'LXGW WenKai Screen', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    note: '屏幕阅读版 · 常规字重',
    noteEn: 'Screen edition · regular weight',
  },
]

export function FontLabComponent(properties, children) {
  const content = (children ?? []).filter(
    (child) => child.type !== 'text' || child.value.trim() !== ''
  )
  if (content.length === 0) {
    return h('div', { class: 'hidden' }, 'Invalid fontlab directive. ("fontlab" cannot be empty.)')
  }

  const locale = properties.locale === 'en' ? 'en' : 'zh'
  const copy = COPY[locale]
  const label = properties.label || copy.label

  return h(
    'font-lab',
    {
      class: 'font-lab',
      role: 'region',
      ariaLabel: label,
      dataLocale: locale,
    },
    [
      h('div', { class: 'font-lab__topbar' }, [
        h('div', { class: 'font-lab__identity' }, [
          h('span', { class: 'font-lab__eyebrow' }, copy.eyebrow),
          h('strong', { class: 'font-lab__title' }, label),
        ]),
        h(
          'output',
          {
            class: 'font-lab__status',
            ariaLive: 'polite',
            dataFontStatus: '',
          },
          copy.ready
        ),
      ]),
      h(
        'div',
        {
          class: 'font-lab__controls',
          role: 'group',
          ariaLabel: copy.controls,
        },
        CANDIDATES.map((candidate, index) =>
          h(
            'button',
            {
              class: `font-lab__choice${index === 0 ? ' is-active' : ''}`,
              type: 'button',
              disabled: true,
              ariaPressed: index === 0 ? 'true' : 'false',
              dataFont: candidate.key,
              dataFontFamily: candidate.family,
              dataLoading: copy.loading,
              dataLoaded: copy.loaded,
              dataUnavailable: copy.unavailable,
              dataError: copy.error,
            },
            [
              h(
                'span',
                { class: 'font-lab__choice-name' },
                locale === 'en' ? candidate.nameEn : candidate.name
              ),
              h(
                'span',
                { class: 'font-lab__choice-note' },
                locale === 'en' ? candidate.noteEn : candidate.note
              ),
            ]
          )
        )
      ),
      h('div', { class: 'font-lab__specimen', dataFontSpecimen: '' }, content),
    ]
  )
}
