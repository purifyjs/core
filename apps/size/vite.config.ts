import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "esnext",
        modulePreload: {
            polyfill: false
        },
        rollupOptions: {
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name][extname]"
            }
        }
    }
});
