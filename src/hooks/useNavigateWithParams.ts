import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

/**
 * useNavigateWithParams
 *
 * Substitui o `navigate` padrão do React Router.
 * Preserva automaticamente todos os query params atuais da URL
 * (UTM, fbclid, gclid, etc.) em cada navegação.
 *
 * Uso:
 *   const navigate = useNavigateWithParams();
 *   navigate("/checkMate");
 */
export function useNavigateWithParams() {
  const navigate = useNavigate();
  const { search } = useLocation();

  return useCallback(
    (to: string) => {
      if (!search) {
        navigate(to);
        return;
      }

      const targetUrl = new URL(to, window.location.origin);
      const currentParams = new URLSearchParams(search);

      for (const [key, value] of currentParams) {
        if (!targetUrl.searchParams.has(key)) {
          targetUrl.searchParams.append(key, value);
        }
      }

      navigate(targetUrl.pathname + targetUrl.search);
    },
    [navigate, search]
  );
}
