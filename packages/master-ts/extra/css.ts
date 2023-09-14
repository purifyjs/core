export let css = (strings: TemplateStringsArray, ...values: string[]) => {
	const sheet = new CSSStyleSheet()
	sheet.replaceSync(strings.reduce((acc, part, i) => acc + part + (i < values.length ? values[i] : ""), ""))
	return sheet
}
