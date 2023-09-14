import { mkdir, rm } from "fs/promises"
import path from "path"

const root = path.resolve(path.join(import.meta.dir, ".."))
const distDirname = path.join(root, "dist")
const srcDirname = path.join(root, "src")

const output = await Bun.build({
	entrypoints: [path.join(srcDirname, "app.ts")],
	minify: true,
	target: "browser"
}).then((output) => output.outputs[0]?.text())

if (!output) throw new Error("No output")

const html = await Bun.file(path.join(srcDirname, "index.html")).text()
const newHtml = html.replace("<!-- js -->", () => `<script type="module">${output}</script>`)

await rm(distDirname, { recursive: true })
await mkdir(distDirname, { recursive: true })
await Bun.write(path.join(distDirname, "index.html"), newHtml)

console.log("Build complete")
console.log(`Output size: ${(output.length / 1024).toFixed(2)} KB`)
