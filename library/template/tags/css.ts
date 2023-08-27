export function css(strings: TemplateStringsArray, ...values: (string | number)[]) {
	const styleSheet = new CSSStyleSheet()
	styleSheet.replaceSync(strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""))
	return styleSheet
}
