export const css = String.raw

export function sheet(css: string) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(css)
    return sheet
}
