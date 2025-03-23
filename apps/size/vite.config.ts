import { defineConfig } from "vite";

export default defineConfig({
    resolve: {
        alias: {
            "@purifyjs/core": Deno.realPathSync("../../lib/mod.ts"),
        },
    },
    build: {
        target: "esnext",
        modulePreload: {
            polyfill: false,
        },
        rollupOptions: {
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name][extname]",
            },
        },
    },
});
