import { mkdir, rm } from "fs/promises"

const output = await Bun.build({
	entrypoints: ["./app/app.ts"],
	minify: true,
	target: "browser"
}).then((output) => output.outputs[0]?.text())

if (!output) throw new Error("No output")

const html = await Bun.file("./app/index.html").text()
const newHtml = html.replace("<!-- js -->", () => `<script type="module">${output}</script>`)

await rm("./dist", { recursive: true })
await mkdir("./dist", { recursive: true })
await Bun.write("./dist/index.html", newHtml)

console.log("Build complete")
console.log(`Output size: ${(output.length / 1024).toFixed(2)} KB`)
