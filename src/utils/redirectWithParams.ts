export function redirectWithParams(destination: string) {
  const currentParams = window.location.search;
  // Build the final destination including current search params
  const finalDestination = currentParams
    ? destination.includes("?")
      ? destination + "&" + currentParams.substring(1)
      : destination + currentParams
    : destination

  // Prefer SPA navigation when react-router's internal navigator exists
  try {
    const routerNav = (window as any).__reactRouterDataRouter?.navigate
    const isInternal = typeof finalDestination === 'string' && finalDestination.startsWith('/')
    if (routerNav && isInternal) {
      routerNav(finalDestination)
      return
    }
  } catch (e) {
    // ignore and fallback to full reload
  }

  window.location.href = finalDestination;
}

// Expose globally to satisfy code that expects a global function
;(window as any).redirectWithParams = redirectWithParams;
