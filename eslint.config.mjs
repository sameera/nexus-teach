import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    { ignores: ["dist/**", "out-tsc/**", "node_modules/**", "test-output/**", "coverage/**"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        rules: {
            // The repository writes explicit types even where they are inferable; that is a
            // deliberate convention inherited from Nexus, not an oversight.
            "@typescript-eslint/no-inferrable-types": "off",
            // A leading underscore is how this code says "destructured only to drop it".
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
        },
    },
);
