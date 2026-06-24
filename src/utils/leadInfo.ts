export type LeadInfo = {
  nome: string;
  email: string;
  pix: string;
  pixType?: string;
};

const STORAGE_KEY = "leadInfo";

export function saveLeadInfo(info: LeadInfo) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // ignore storage errors
  }
}

export function getLeadInfo(): LeadInfo | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadInfo;
  } catch {
    return null;
  }
}
