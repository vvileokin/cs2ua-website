import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Модель інвайтів — окремий набір скриптів на Node, не код сайту: свої
    // домовленості, свій запуск, у збірку не входить.
    "vrs-model/**",
  ]),
]);

export default eslintConfig;
