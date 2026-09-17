import { createFileRoute } from "@tanstack/react-router";
import { AssessmentPage } from "@/features/ssesba/AssessmentPage";

const title = "نموذج التقييم | مِشْق";
const description = "نموذج تفاعلي لتطبيق معايير مِشْق على نشاط مستشفى عام وعرض النتيجة المرجحة.";

export const Route = createFileRoute("/assessment")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <AssessmentPage lang="ar" />,
});