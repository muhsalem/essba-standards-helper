import { createFileRoute } from "@tanstack/react-router";

import { StandardContentPage } from "@/features/ssesba/StandardContentPage";

const title = "مَشْتَق (MASHTAQ) · SSEBA — المعايير الشرعية للتصنيف";
const description =
  "إطارٌ معياريٌّ موحّد يصنّف القطاعات والأنشطة الاقتصادية ويقيس امتثالها الشرعي بمنهجيةٍ مُرجّحةٍ شفّافة، على ظهر ISIC Rev.4 ومعايير AAOIFI وقرارات مجامع الفقه.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "المعايير الشرعية, التصنيف الشرعي, الامتثال الشرعي, مَشْتَق, MASHTAQ, SSEBA, الاقتصاد الإسلامي, AAOIFI, ISIC",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: StandardPage,
});

function StandardPage() {
  return <StandardContentPage lang="ar" />;
}
