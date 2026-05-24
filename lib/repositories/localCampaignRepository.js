const STORAGE_KEY = "table-kit:campaign:v1";
const UI_KEY = "table-kit:ui:v1";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readCampaign(fallbackCampaign) {
  if (!canUseStorage()) return { campaign: fallbackCampaign, recovered: false };

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { campaign: fallbackCampaign, recovered: false };

    const parsed = JSON.parse(stored);
    if (parsed?.schemaVersion === 1 && Array.isArray(parsed.characters)) {
      return { campaign: parsed, recovered: false };
    }
  } catch {
    return { campaign: fallbackCampaign, recovered: true };
  }

  return { campaign: fallbackCampaign, recovered: false };
}

export function writeCampaign(campaign) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
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
