import uc2Golden from "../lib/operations/golden/UC2-crud-admin-v0.2.rui.json";
import { RuiSchema } from "../lib/operations/rui";

const golden = RuiSchema.safeParse(uc2Golden);
if (!golden.success) {
  console.error("UC2 golden failed structural parse:", golden.error.format());
  process.exit(1);
}

const withExtraProp = RuiSchema.safeParse({
  ...uc2Golden,
  unexpected: true,
});

if (withExtraProp.success) {
  console.error("Expected strict mode to reject extra top-level prop");
  process.exit(1);
}

console.log("Operations schema smoke test passed:");
console.log("- UC2-crud-admin-v0.2.rui.json parses with RuiSchema");
console.log("- strict mode rejects unknown top-level prop");
