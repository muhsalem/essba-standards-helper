import { createFileRoute } from "@tanstack/react-router";

import { StandardContentPage } from "@/features/ssesba/StandardContentPage";

const title = "MASHTAQ · SSEBA — Shariah Classification Standards";
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
  return <StandardContentPage lang="en" />;
}