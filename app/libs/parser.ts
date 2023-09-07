export namespace ParseDocumentation {
	export namespace Item {
		export type Region = {
			type: "region"
			name: string
			items: Item[]
		}

		export type Demo = {
			type: "demo"
			name: string
			content: string
		}

		export type Comment = {
			type: "comment"
			content: string
		}

		export type Code = {
			type: "code"
			content: string
		}
	}
	export type Item = Item.Comment | Item.Code | Item.Region | Item.Demo
}

export function parseDocumentation(src: string) {
	const root: ParseDocumentation.Item.Region = {
		type: "region",
		name: "root",
		items: []
	}

	parseRegion(src.split("\n"), root)

	return root.items
}

function parseRegion(lines: string[], region: ParseDocumentation.Item.Region): number {
	let index = 0

	let currentItem: ParseDocumentation.Item | null = null

	for (; index < lines.length; index++) {
		const line = lines[index]!
		if (line.startsWith("//#endregion")) {
			return index + 1
		}

		if (!currentItem) {
			const regionPrefix = "//#region" as const
			if (line.startsWith(regionPrefix)) {
				const innerRegion: ParseDocumentation.Item.Region = {
					type: "region",
					name: line.substring(regionPrefix.length).trim(),
					items: []
				}
				index += parseRegion(lines.slice(++index), innerRegion)
				region.items.push(innerRegion)
				continue
			}
			const commentPrefix = "/*" as const
			const commentSuffix = "*/" as const
			if (line.startsWith(commentPrefix)) {
				const start = index
				untilEndWith(commentSuffix)
				const end = index
				region.items.push({
					type: "comment",
					content: lines
						.slice(start, end + 1)
						.join("\n")
						.trim()
						.slice(commentPrefix.length, -commentSuffix.length)
						.trim()
				})
				continue
			}
			if (line.startsWith("{")) {
				const start = index
				untilStartsWith("}")
				const end = index
				region.items.push({
					type: "code",
					content: lines
						.slice(start, end + 1)
						.join("\n")
						.slice(1, -1)
				})
				continue
			}
			const demoPrefix = "export function " as const
			const demoSuffix = "}" as const
			endDemo: if (line.startsWith(demoPrefix)) {
				const start = index
				untilStartsWith(demoSuffix)
				const end = index

				const demoNameEnd = line.indexOf("(", demoPrefix.length)
				if (demoNameEnd === -1) break endDemo

				const name = line.slice(demoPrefix.length, demoNameEnd).trim()

				region.items.push({
					type: "demo",
					name,
					content: lines
						.slice(start, end + 1)
						.join("\n")
						.substring("export ".length)
				})
				continue
			}

			continue
		}
	}

	function untilEndWith(until: string) {
		for (; index < lines.length; index++) {
			const line = lines[index]!
			if (line.trim().endsWith(until)) return
		}
	}
	function untilStartsWith(until: string) {
		for (; index < lines.length; index++) {
			const line = lines[index]!
			if (line.startsWith(until)) return
		}
	}

	return index
}
