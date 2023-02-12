enum CssTemplateString {
	_ = "",
}
export type { CssTemplateString }

export function css(strings: TemplateStringsArray, ...values: (string | number)[]) {
	return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "") as CssTemplateString
}
