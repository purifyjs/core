/* 
	Ok this is not the best way to do this, but it works for now.
	TODO: Make a better dev server and bundler.
	TODO: Add auto reload.

	Wait for this: https://bun.sh/blog/bun-bundler#sneak-peek-bun-app
*/
import path from "path"

const root = path.resolve(path.join(import.meta.dir, ".."))
const devDirname = `/tmp/${Math.random().toString(36).slice(2)}_bun_dev`
const srcDirname = path.join(root, "src")

Bun.spawn(["bun", "build", "--watch", path.join(srcDirname, "app.ts"), "--target", "browser", "--outdir", devDirname], {
	stdout: "inherit",
	stderr: "inherit"
})

Bun.serve({
	development: true,
	async fetch(request, server) {
		const url = new URL(request.url)

		switch (url.pathname) {
			case "/app.js":
				return new Response(await Bun.file(path.join(devDirname, "app.js")).arrayBuffer(), {
					headers: { "Content-Type": "application/javascript" }
				})
			case "/":
				return new Response(
					await Bun.file(path.join(srcDirname, "index.html"))
						.text()
						.then((html) =>
							html.replace("<!-- js -->", () => `<script type="module" src="/app.js"></script>`)
						),
					{
						headers: {
							"Content-Type": "text/html"
						}
					}
				)
			default:
				return new Response("Not found", {
					status: 404
				})
		}
	}
})
