import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
	plugins: [viteSingleFile({ removeViteModuleLoader: true })],
	build: {
		target: "esnext"
	},
	resolve: {
		alias: {
			"@": "/app"
		}
	}
})
