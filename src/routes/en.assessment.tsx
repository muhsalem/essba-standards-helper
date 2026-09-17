import { createFileRoute } from "@tanstack/react-router";
import { AssessmentPage } from "@/features/ssesba/AssessmentPage";

const title = "Assessment Model | MASHTAQ · SSEBA";
const description = "Interactive real-sector examples applying the SSEBA weighted assessment and Shariah risk matrix.";

export const Route = createFileRoute("/en/assessment")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <AssessmentPage lang="en" />,
});