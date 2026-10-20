import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// TypeScript and React hooks rules for .ts/.tsx; `astro check` covers .astro.
export default defineConfig([
  globalIgnores([".astro/**", "dist/**", "imports/**", "supabase/**", "docs/**", ".vercel/**", "public/**", "test-results/**", "playwright-report/**"]),
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"] ?? reactHooks.configs["recommended-latest"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);
