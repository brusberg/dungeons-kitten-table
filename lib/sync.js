const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeTableCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export function generateTableCode(length = 6) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function readTableCodeFromUrl() {
  if (typeof window === "undefined") return "";
  return normalizeTableCode(new URLSearchParams(window.location.search).get("table"));
}

export function setTableCodeInUrl(code) {
  if (typeof window === "undefined" || !code) return;
  const url = new URL(window.location.href);
  url.searchParams.set("table", normalizeTableCode(code));
  window.history.replaceState(null, "", url);
}

export function clearTableCodeInUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("table");
  window.history.replaceState(null, "", url);
}
