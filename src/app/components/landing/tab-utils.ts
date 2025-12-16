import { IFRAME_WHITELIST } from "./tab-constants";

export type TabInternalFlags = {
  showInstructions: boolean;
  showCc: boolean;
  showManagement: boolean;
  showTech: boolean;
  showDesign: boolean;
  showResearch: boolean;
  showEvents: boolean;
  showDomains: boolean;
  showPintooRun: boolean;
  showSnake: boolean;
  showAbout: boolean;
};

export type TabDataLike = {
  pendingUrl?: string;
  pointer: number;
  history: Array<{ url: string }>;
};

export const stripProtocol = (s: string) => s.replace(/^https?:\/\//i, "");

export const ensureHttps = (hostOrUrl: string) =>
  /^https?:\/\//i.test(hostOrUrl) ? hostOrUrl : `https://${hostOrUrl}`;

export const isWhitelisted = (url: string) => {
  try {
    const host = new URL(ensureHttps(url)).hostname;

    if (host === "acmvit.in" || host.endsWith(".acmvit.in")) return true;

    return IFRAME_WHITELIST.has(host);
  } catch {
    return false;
  }
};

export const currentHostFromPointer = (tabData: TabDataLike) => {
  if (tabData.pendingUrl) return stripProtocol(tabData.pendingUrl);
  if (tabData.pointer >= 0 && tabData.history[tabData.pointer]) {
    return stripProtocol(tabData.history[tabData.pointer].url);
  }
  return "";
};

export const requestFullscreen = () => {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.log("Error attempting to enable fullscreen:", err);
      });
    }
  }
};

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export const titleForKeyword = (keyword: string) =>
  keyword === "cc" ? "CC" : capitalize(keyword);

export const tabFlagsForKeyword = (keyword: string): TabInternalFlags => ({
  showInstructions: keyword === "instructions",
  showCc: keyword === "cc.com" || keyword === "cc",
  showManagement: keyword === "management.com" || keyword === "management",
  showTech: keyword === "tech.com" || keyword === "tech",
  showDesign: keyword === "design.com" || keyword === "design",
  showResearch: keyword === "research.com" || keyword === "research",
  showEvents: keyword === "events",
  showDomains: keyword === "domains",
  showPintooRun: keyword === "pintoorun",
  showSnake: keyword === "snake",
  showAbout: keyword === "about",
});

export const resetTabFlags = (): TabInternalFlags => ({
  showInstructions: false,
  showCc: false,
  showManagement: false,
  showTech: false,
  showDesign: false,
  showResearch: false,
  showEvents: false,
  showDomains: false,
  showPintooRun: false,
  showSnake: false,
  showAbout: false,
});
