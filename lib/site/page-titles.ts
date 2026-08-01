export const SITE_PAGE_NAMES = {
  agent: "Agent",
  observe: "Observability Platform",
  ruiInspector: "RUI Inspector",
} as const;

export function sitePageTitle(pageName: string | null): string {
  return pageName ? `RapidUI - ${pageName}` : "RapidUI";
}

export const SITE_PAGE_TITLES = {
  home: "RapidUI",
  agent: sitePageTitle(SITE_PAGE_NAMES.agent),
  observe: sitePageTitle(SITE_PAGE_NAMES.observe),
  ruiInspector: sitePageTitle(SITE_PAGE_NAMES.ruiInspector),
} as const;
