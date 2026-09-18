import { createFileRoute } from "@tanstack/react-router";

import { LegacyHtmlPage } from "@/components/LegacyHtmlPage";
import standardEnglishHtml from "@/content/ssesba/standard.en.body.html?raw";
import standardScript from "@/content/ssesba/standard.js?raw";
import "@/content/ssesba/standard.css";

const title = "SSEBA — Shariah Standards for the Classification of Economic Sectors & Business Activities";
const description =
  "A unified reference framework for classifying economic sectors and measuring Shariah compliance across business activities.";

export const Route = createFileRoute("/en")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/en" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/en" }],
  }),
  component: EnglishStandardPage,
});

function EnglishStandardPage() {
  return (
    <LegacyHtmlPage
      html={standardEnglishHtml}
      script={standardScript}
      className="standard-page"
      lang="en"
      dir="ltr"
    />
  );
}