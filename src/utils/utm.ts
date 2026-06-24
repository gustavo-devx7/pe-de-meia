export type TrackingParameters = {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const STORAGE_KEY = "utmParams";
const UTM_KEYS = [
  "src",
  "sck",
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
] as const;

function emptyTracking(): TrackingParameters {
  return {
    src: null,
    sck: null,
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
    utm_content: null,
    utm_term: null,
  };
}

// Lê os UTMs presentes na URL atual.
function readFromUrl(): Partial<TrackingParameters> {
  const result: Partial<TrackingParameters> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) {
        result[key] = value;
      }
    }
  } catch {
    // ignore
  }
  return result;
}

// Captura os UTMs da URL (se houver) e os mescla com o que já está salvo.
// Deve ser chamado o quanto antes no carregamento da aplicação.
export function captureUtms(): TrackingParameters {
  const current = getUtms();
  const fromUrl = readFromUrl();
  const merged: TrackingParameters = { ...current, ...fromUrl };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage errors
  }

  return merged;
}

// Retorna os UTMs salvos, mesclados com os da URL atual.
export function getUtms(): TrackingParameters {
  let stored: Partial<TrackingParameters> = {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw) as Partial<TrackingParameters>;
    }
  } catch {
    // ignore
  }

  return { ...emptyTracking(), ...stored, ...readFromUrl() };
}
