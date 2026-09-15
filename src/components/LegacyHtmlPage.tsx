import { useEffect } from "react";

type Props = {
  html: string;
  script: string;
  className?: string;
};

/**
 * Renders a self-contained HTML page (markup + inline script) that was authored
 * outside React. The script is injected as a real <script> element so that
 * global functions referenced by inline onclick handlers stay reachable.
 */
export function LegacyHtmlPage({ html, script, className }: Props) {
  useEffect(() => {
    const el = document.createElement("script");
    el.textContent = script;
    document.body.appendChild(el);
    // Scripts that wait for window "load" would otherwise never run, because
    // hydration happens after the document finished loading.
    if (document.readyState === "complete") {
      window.dispatchEvent(new Event("load"));
    }
    return () => {
      el.remove();
    };
  }, [script]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
