import { useNavigate as useRouterNavigate, useSearchParams } from "react-router-dom";



/** Compatibility helper so pages can call navigate({ to, search }). */
export function useNavigate() {
  const navigate = useRouterNavigate();
  return (opts) => {
    const params = new URLSearchParams();
    Object.entries(opts.search ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    const qs = params.toString();
    navigate(opts.to + (qs ? `?${qs}` : ""), { replace: opts.replace });
  };
}

/** Returns the current query string as a plain object. */
export function useSearch() {
  const [params] = useSearchParams();
  return Object.fromEntries(params.entries());
}