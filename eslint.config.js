import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.browser } },
    ...tseslint.configs.recommended,
    { ignores: ["apps/compare/src/content", "apps/*/dist"] },
    {
        rules: {
            "@typescript-eslint/no-namespace": "off",
            "prefer-const": "off",
            "@typescript-eslint/no-this-alias": "off"
        }
    }
)
