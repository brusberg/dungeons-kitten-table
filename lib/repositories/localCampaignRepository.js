export const CAMPAIGN_STORAGE_KEY = "table-kit:campaign:v1";
const UI_KEY = "table-kit:ui:v1";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readCampaign(fallbackCampaign) {
  if (!canUseStorage()) return { campaign: fallbackCampaign, recovered: false, fromStorage: false };

  try {
    const stored = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!stored) return { campaign: fallbackCampaign, recovered: false, fromStorage: false };

    const parsed = JSON.parse(stored);
    if (parsed?.schemaVersion === 1 && Array.isArray(parsed.characters)) {
      return { campaign: parsed, recovered: false, fromStorage: true };
    }
  } catch {
    return { campaign: fallbackCampaign, recovered: true, fromStorage: false };
  }

  return { campaign: fallbackCampaign, recovered: false, fromStorage: false };
}

export function writeCampaign(campaign) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign));
}

export function subscribeCampaignCache(onChange) {
  if (!canUseStorage()) return () => {};

  function handleStorage(event) {
    if (event.key !== CAMPAIGN_STORAGE_KEY || !event.newValue) return;

    try {
      const parsed = JSON.parse(event.newValue);
      if (parsed?.schemaVersion === 1 && Array.isArray(parsed.characters)) {
        onChange(parsed);
      }
    } catch {
      // Ignore malformed cache events; readCampaign handles recovery on reload.
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function readUi() {
  if (!canUseStorage()) return null;

  try {
    const stored = window.localStorage.getItem(UI_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function writeUi(ui) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(UI_KEY, JSON.stringify(ui));
}
