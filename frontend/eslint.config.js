import { readdirSync } from "node:fs";
import js from "@eslint/js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// A feature never imports another feature's files (docs/code-style-react.md). One zone per
// feature folder, so adding a folder adds its boundary.
const features = readdirSync("app/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const featureBoundaries = features.map((feature) => ({
  target: `./app/features/${feature}`,
  from: "./app/features",
  except: [`./${feature}`],
  message: "Features don't import each other: move shared code to app/shared or app/core.",
}));

export default tseslint.config(
  { ignores: ["build/", ".react-router/", "coverage/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  tseslint.configs.strict,
  jsxA11y.flatConfigs.strict,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    rules: {
      "import-x/no-restricted-paths": ["error", { zones: featureBoundaries }],
      // Server-only code (tokens, secrets, Valkey) lives in *.server.ts and is never bundled for
      // the browser; components must not reach it directly.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/*.server", "**/*.server.ts"],
              message: "Server modules are imported only by route modules' loaders and actions.",
              allowTypeImports: true,
            },
          ],
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Route modules, the server entry and server modules may import server code.
    files: [
      "app/**/*.route.{ts,tsx}",
      "app/root.tsx",
      "app/entry.server.tsx",
      "app/**/*.server.ts",
      "app/**/*.test.{ts,tsx}",
    ],
    rules: { "no-restricted-imports": "off" },
  },
);
