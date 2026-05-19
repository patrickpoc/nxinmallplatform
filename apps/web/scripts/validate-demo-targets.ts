import { join } from "node:path";
import { assertDemoTargetsValid } from "../lib/demo/validate-demo-targets";

const webRoot = join(__dirname, "..");
assertDemoTargetsValid(webRoot);
console.log("All demo targets OK.");
