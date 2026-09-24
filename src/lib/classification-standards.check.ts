/**
 * فحص شجرة التصنيف والمعايير المتدرّجة: يُشغَّل عبر `bun run test`.
 */
import assert from "node:assert/strict";
import drafts from "../../scripts/sector-standard-drafts.json";
import {
  findActivity,
  industriesForSector,
  inheritanceChain,
  nodeExists,
  nodeLabel,
  standardContentSchema,
  taxonomy,
} from "./classification-standards";

assert.equal(taxonomy.sectors.length, 5, "خمسة قطاعات");
assert.equal(taxonomy.industries.length, 21, "إحدى وعشرون صناعة");
const activities = taxonomy.industries.flatMap((industry) =>
  industry.subsectors.flatMap((subsector) => subsector.activities),
);
assert.equal(activities.length, 546, "546 نشاطًا");
assert.equal(
  new Set(activities.map((activity) => activity.key)).size,
  activities.length,
  "مفاتيح الأنشطة فريدة",
);
assert.equal(
  new Set(taxonomy.industries.map((industry) => industry.key)).size,
  21,
  "مفاتيح الصناعات فريدة",
);
for (const sector of taxonomy.sectors)
  assert.ok(industriesForSector(sector.id).length > 0, `للقطاع ${sector.id} صناعات`);
for (const industry of taxonomy.industries) {
  for (const subsector of industry.subsectors)
    assert.ok(
      taxonomy.sectors.some((sector) => sector.id === subsector.sector),
      `قطاع القطاع الفرعي ${subsector.ar} معروف`,
    );
}

// السلسلة الموروثة: النشاط ← صناعته ← قطاع قطاعه الفرعي.
const grain = findActivity("A:زراعة الحبوب");
assert.ok(grain, "نشاط زراعة الحبوب موجود");
assert.deepEqual(inheritanceChain({ level: "activity", key: "A:زراعة الحبوب" }), [
  { level: "sector", key: "p" },
  { level: "industry", key: "A" },
  { level: "activity", key: "A:زراعة الحبوب" },
]);
assert.deepEqual(
  inheritanceChain({ level: "industry", key: "B" }).map((node) => node.key),
  ["p", "s", "B"],
  "الصناعة الممتدة ترث كل قطاعاتها",
);
assert.deepEqual(inheritanceChain({ level: "sector", key: "t" }), [{ level: "sector", key: "t" }]);

assert.equal(nodeExists({ level: "sector", key: "p" }), true);
assert.equal(nodeExists({ level: "sector", key: "z" }), false);
assert.equal(nodeExists({ level: "industry", key: "J2" }), true);
assert.equal(nodeExists({ level: "activity", key: "A:غير موجود" }), false);
assert.equal(nodeLabel({ level: "sector", key: "p" }, "ar"), "القطاع الأولي");

// مسودات القطاعات الخمسة تغطي كل القطاعات وتجتاز مخطط المحتوى نفسه الذي يفرضه المحرّر.
assert.deepEqual(
  drafts.map((draft) => draft.key).sort(),
  taxonomy.sectors.map((sector) => sector.id).sort(),
  "مسودة لكل قطاع",
);
for (const draft of drafts) {
  standardContentSchema.parse(draft);
  assert.ok(
    draft.requirements.some((item) => item.kind === "prohibition"),
    `مسودة ${draft.key} تتضمن محظورات`,
  );
  assert.ok(
    draft.requirements.every((item) => item.en && item.ref),
    `بنود مسودة ${draft.key} مترجمة وموثّقة`,
  );
}

console.log("جميع فحوصات معايير التصنيف ناجحة");
