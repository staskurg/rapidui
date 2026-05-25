import goldenRui from "../lib/registry/golden/support-dashboard.rui.json";
import { RuiSchema } from "../lib/registry/rui";

const golden = RuiSchema.safeParse(goldenRui);
if (!golden.success) {
  console.error("Golden RUI failed structural parse:", golden.error.format());
  process.exit(1);
}

const withExtraProp = RuiSchema.safeParse({
  ...goldenRui,
  unexpected: true,
});

if (withExtraProp.success) {
  console.error("Expected strict mode to reject extra top-level prop");
  process.exit(1);
}

console.log("Registry smoke test passed:");
console.log("- golden/support-dashboard.rui.json parses with RuiSchema");
console.log("- strict mode rejects unknown top-level prop");
