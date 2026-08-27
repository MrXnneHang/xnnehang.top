type Mermaid = typeof import('mermaid')['default']

type MermaidTheme = {
  signature: string
  variables: Record<string, string | boolean>
}

const MERMAID_FONT_FAMILY =
  "Roboto, 'Noto Sans SC', ui-sans-serif, system-ui, sans-serif"
const THEME_RENDER_DELAY = 120
const DEFAULT_HUE = 210
const MERMAID_HUE_OFFSET = -25
const MERMAID_THEME_CSS = `
  .node rect {
    rx: 10px;
    ry: 10px;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    stroke-width: 1.5px;
  }

  .nodeLabel,
  .edgeLabel {
    font-weight: 550;
  }

  .flowchart-link {
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`

let mermaidPromise: Promise<Mermaid> | undefined
let renderQueue: Promise<void> = Promise.resolve()
let themeRenderTimer: number | undefined
let diagramId = 0

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

function getThemeHue(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--hue')
  const hue = Number.parseFloat(value)
  return Number.isFinite(hue) ? hue : DEFAULT_HUE
}

function getMermaidTheme(): MermaidTheme {
  const dark = isDarkTheme()
  const hue = (getThemeHue() + MERMAID_HUE_OFFSET + 360) % 360
  const color = (saturation: number, lightness: number): string =>
    `hsl(${hue} ${saturation}% ${lightness}%)`

  if (dark) {
    return {
      signature: `dark-${hue}`,
      variables: {
        darkMode: true,
        background: color(18, 18),
        primaryColor: color(32, 27),
        primaryTextColor: color(18, 92),
        primaryBorderColor: color(72, 64),
        secondaryColor: color(26, 31),
        secondaryTextColor: color(16, 92),
        secondaryBorderColor: color(48, 56),
        tertiaryColor: color(18, 22),
        tertiaryTextColor: color(14, 88),
        tertiaryBorderColor: color(32, 43),
        lineColor: color(34, 62),
        textColor: color(16, 90),
        mainBkg: color(32, 27),
        nodeBorder: color(72, 64),
        clusterBkg: color(18, 20),
        clusterBorder: color(30, 40),
        edgeLabelBackground: color(22, 19),
        titleColor: color(20, 94),
        fontFamily: MERMAID_FONT_FAMILY,
      },
    }
  }

  return {
    signature: `light-${hue}`,
    variables: {
      darkMode: false,
      background: color(42, 99),
      primaryColor: color(58, 94),
      primaryTextColor: color(24, 24),
      primaryBorderColor: color(62, 52),
      secondaryColor: color(48, 90),
      secondaryTextColor: color(22, 24),
      secondaryBorderColor: color(48, 58),
      tertiaryColor: color(36, 97),
      tertiaryTextColor: color(18, 28),
      tertiaryBorderColor: color(34, 74),
      lineColor: color(32, 48),
      textColor: color(22, 25),
      mainBkg: color(58, 94),
      nodeBorder: color(62, 52),
      clusterBkg: color(42, 97),
      clusterBorder: color(36, 76),
      edgeLabelBackground: color(48, 98),
      titleColor: color(24, 22),
      fontFamily: MERMAID_FONT_FAMILY,
    },
  }
}

function loadMermaid(): Promise<Mermaid> {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => mermaid)
  return mermaidPromise
}

function enqueueRender(diagram: MermaidDiagram): void {
  renderQueue = renderQueue
    .catch(() => undefined)
    .then(() => diagram.render())
}

function enqueueAllDiagrams(): void {
  document.querySelectorAll<MermaidDiagram>('mermaid-diagram').forEach(enqueueRender)
}

class MermaidDiagram extends HTMLElement {
  private source = ''

  connectedCallback(): void {
    const source = this.querySelector<HTMLElement>('pre.mermaid')?.textContent
    if (!this.source && source) this.source = source
    if (this.source) enqueueRender(this)
  }

  async render(): Promise<void> {
    if (!this.isConnected || !this.source) return

    const container = this.querySelector<HTMLElement>('pre.mermaid')
    if (!container) return

    this.dataset.state = 'loading'
    this.removeAttribute('data-error')

    try {
      const mermaid = await loadMermaid()
      if (!this.isConnected) return

      const theme = getMermaidTheme()
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: theme.variables,
        themeCSS: MERMAID_THEME_CSS,
        fontFamily: MERMAID_FONT_FAMILY,
        flowchart: {
          curve: 'rounded',
          nodeSpacing: 42,
          rankSpacing: 56,
          padding: 14,
          htmlLabels: true,
        },
      })

      const id = `mermaid-diagram-${++diagramId}`
      const { svg, bindFunctions } = await mermaid.render(id, this.source)
      if (!this.isConnected) return

      container.innerHTML = svg
      bindFunctions?.(container)
      this.dataset.theme = theme.signature
      this.dataset.state = 'ready'
    } catch (error) {
      console.error('Failed to render Mermaid diagram:', error)
      container.textContent = this.source
      this.dataset.state = 'error'
      this.dataset.error = error instanceof Error ? error.message : 'Unknown Mermaid error'
    }
  }
}

if (!customElements.get('mermaid-diagram')) {
  customElements.define('mermaid-diagram', MermaidDiagram)
}

let themeSignature: string = getMermaidTheme().signature
const themeObserver: MutationObserver = new MutationObserver(() => {
  const nextThemeSignature = getMermaidTheme().signature
  if (nextThemeSignature === themeSignature) return

  themeSignature = nextThemeSignature
  window.clearTimeout(themeRenderTimer)
  themeRenderTimer = window.setTimeout(enqueueAllDiagrams, THEME_RENDER_DELAY)
})

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'style'],
})
