export function css(strings: TemplateStringsArray, ...values: (string | number)[]) {
	const sheet = new CSSStyleSheet()
	sheet.replaceSync(strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""))
	return sheet
}
