import { createFileRoute } from "@tanstack/react-router";
import { RequestPage } from "@/features/ssesba/RequestPage";

const title = "Request an Assessment | SSESBA";
const description = "Request an assessment of an economic activity under the Shariah Standards for the Classification of Economic Sectors and Business Activities.";

export const Route = createFileRoute("/en/request")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <RequestPage lang="en" />,
});