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

	for (; index < lines.length; index++) {
		const line = lines[index]!
		{
			const prefix = "//#region" as const
			const suffix = "//#endregion" as const
			if (line.startsWith(suffix)) {
				return index + 1
			}
			if (line.startsWith(prefix)) {
				const innerRegion: ParseDocumentation.Item.Region = {
					type: "region",
					name: line.substring(prefix.length).trim(),
					items: []
				}
				index += parseRegion(lines.slice(++index), innerRegion)
				region.items.push(innerRegion)
				continue
			}
		}
		{
			const prefix = "/*" as const
			const suffix = "*/" as const
			if (line.startsWith(prefix)) {
				const start = index
				until((line) => line.trim().endsWith(suffix))
				const end = index
				region.items.push({
					type: "comment",
					content: lines
						.slice(start, end + 1)
						.join("\n")
						.trim()
						.slice(prefix.length, -suffix.length)
						.trim()
				})
				continue
			}
		}
		{
			const prefix = "code(() => {" as const
			if (line.startsWith(prefix)) {
				const start = index
				until((line) => line.trimEnd().endsWith("// end"))
				const end = index
				region.items.push({
					type: "code",
					content: lines
						.slice(start, end)
						.join("\n")
						.slice(prefix.length)
						.split("\n")
						.filter((line) => !line.trimStart().startsWith("// @"))
						.join("\n")
				})
				continue
			}
		}
		{
			const prefix = "export const " as const
			out: if (line.startsWith(prefix)) {
				const start = index
				until((line) => line.trimEnd().endsWith("// end"))
				const end = index

				const demoNameEnd = line.indexOf("=", prefix.length)
				if (demoNameEnd === -1) break out

				const name = line.slice(prefix.length, demoNameEnd).trim()

				region.items.push({
					type: "demo",
					name,
					content: lines
						.slice(start + 1, end)
						.join("\n")
						.split("\n")
						.filter((line) => !line.trimStart().startsWith("// @"))
						.join("\n")
				})
				continue
			}
		}
	}

	function until(until: (line: string) => boolean) {
		for (; index < lines.length; index++) {
			const line = lines[index]!
			if (until(line)) return
		}
	}

	return index
}
