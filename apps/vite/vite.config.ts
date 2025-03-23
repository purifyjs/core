import { defineConfig } from "vite";

export default defineConfig({
    resolve: {
        alias: {
            "@purifyjs/core": Deno.realPathSync("../../lib/mod.ts"),
        },
    },
});
