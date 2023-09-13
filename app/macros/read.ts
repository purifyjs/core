import { readFileSync } from "fs"

export function inlineRaw(path: string) {
	return readFileSync(path, "utf-8")
}
