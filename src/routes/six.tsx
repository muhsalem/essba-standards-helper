import { createFileRoute } from "@tanstack/react-router";
import { SixScalePage } from "@/features/ssesba/SixScalePage";

const title = "المقياس السداسي للامتثال الشرعي | مَشْتَق";
const description = "أداة تدقيق شرعي استرشادية تقيّم الشركات وفق المقياس السداسي (100 إلى أقل من 45) مع المعايير القطاعية للقطاعات الأولي والثانوي والخدمي.";

export const Route = createFileRoute("/six")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <SixScalePage lang="ar" />,
});
