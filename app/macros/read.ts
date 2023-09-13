import { readFileSync } from "fs"

export function readFileMacro(path: string) {
	return readFileSync(path, "utf-8")
}
