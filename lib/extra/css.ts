export let css = async (strings: TemplateStringsArray, ...values: string[]) => {
	const sheet = new CSSStyleSheet()
	await sheet.replace(strings.reduce((acc, part, i) => acc + part + (i < values.length ? values[i] : ""), ""))
	return sheet
}
