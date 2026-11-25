import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * After a client-side navigation, move focus to the page's main heading, so keyboard and
 * screen-reader users start on the new content (docs/code-style-react.md, "Accessibility").
 */
export function useFocusOnNavigation() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }, [pathname]);
}
