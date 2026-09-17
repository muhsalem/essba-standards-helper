import { createFileRoute } from "@tanstack/react-router";
import { AssessmentPage } from "@/features/ssesba/AssessmentPage";

const title = "Assessment Model | SSESBA";
const description = "An interactive hospital example applying the SSESBA weighted assessment model and Shariah risk matrix.";

export const Route = createFileRoute("/en/assessment")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <AssessmentPage lang="en" />,
});