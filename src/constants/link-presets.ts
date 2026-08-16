import I18nKey from '@i18n/i18nKey'
import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '@i18n/locales'
import { createI18n } from '@i18n/translation'
import { LinkPreset, type NavBarLink } from '@/types/config'

const presetDefinitions: Record<LinkPreset, { key: I18nKey; url: string }> = {
  [LinkPreset.Home]: { key: I18nKey.home, url: '/' },
  [LinkPreset.About]: { key: I18nKey.about, url: '/about/' },
  [LinkPreset.Archive]: { key: I18nKey.archive, url: '/archive/' },
  [LinkPreset.Friends]: { key: I18nKey.friends, url: '/friends/' },
  [LinkPreset.Graph]: { key: I18nKey.graph, url: '/graph/' },
  [LinkPreset.Shelf]: { key: I18nKey.shelf, url: '/shelf/' },
  [LinkPreset.Series]: { key: I18nKey.seriesNav, url: '/series/' },
  [LinkPreset.Todo]: { key: I18nKey.todo, url: '/todo/' },
  [LinkPreset.Statistics]: { key: I18nKey.statistics, url: '/statistics/' },
}

export function getLinkPreset(preset: LinkPreset, locale: Locale = DEFAULT_LOCALE): NavBarLink {
  const definition = presetDefinitions[preset]
  const t = createI18n(locale)
  const compactEnglishLabels: Partial<Record<LinkPreset, string>> = {
    [LinkPreset.Statistics]: 'Stats',
    [LinkPreset.Todo]: 'Next',
  }

  return {
    name:
      locale === ENGLISH_LOCALE && compactEnglishLabels[preset]
        ? compactEnglishLabels[preset]!
        : t(definition.key),
    url: definition.url,
  }
}

export const LinkPresets: { [key in LinkPreset]: NavBarLink } = Object.fromEntries(
  Object.values(LinkPreset)
    .filter((value): value is LinkPreset => typeof value === 'number')
    .map((preset) => [preset, getLinkPreset(preset)])
) as { [key in LinkPreset]: NavBarLink }
