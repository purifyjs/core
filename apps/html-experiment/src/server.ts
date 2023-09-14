import path from "path"

async function getResult(pathname: string, method: string, params: URLSearchParams) {
	const filePath = path.resolve(path.join(import.meta.dir, "routes", pathname))
	const tryPaths = [`${filePath}.ts`, `${filePath}/index.ts`] as const
	for (const path of tryPaths) {
		if (await Bun.file(path).exists()) {
			try {
				const module = (await import(path)) as Record<string, unknown>
				if (!(method in module)) continue
				const fn = await module[method]
				if (typeof fn !== "function") continue
				return await fn(Object.fromEntries(params.entries()))
			} catch {}
		}
	}

	return null
}

const clientJs = await Bun.build({
	entrypoints: [path.join(import.meta.dir, "client.ts")],
	target: "browser",
	minify: true
}).then((output) => output.outputs[0]!.arrayBuffer())

Bun.serve({
	async fetch(request, server) {
		const url = new URL(request.url)
		if (url.pathname === "/client.js")
			return new Response(clientJs, { headers: { "content-type": "text/javascript" } })
		const result = await getResult(url.pathname, request.method, url.searchParams)
		if (result === null) return new Response("Not Found", { status: 404 })
		return new Response(`${result}`, { headers: { "content-type": "text/html" } })
	}
})
