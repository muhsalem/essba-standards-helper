import { createFileRoute } from "@tanstack/react-router";
import { SixScalePage } from "@/features/ssesba/SixScalePage";

const title = "Six-Level Shariah Compliance Scale | SSEBA";
const description = "An indicative Shariah audit tool assessing companies on the six-level scale (100 down to below 45) with sector standards for primary, secondary, and services sectors.";

export const Route = createFileRoute("/en/six")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <SixScalePage lang="en" />,
});
