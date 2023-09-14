export function html(strings: TemplateStringsArray, ...args: unknown[]): string {
	return strings.reduce((acc, str, i) => acc + str + (args[i] ?? ""), "")
}
