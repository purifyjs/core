export function css(strings: TemplateStringsArray, ...values: (string | number)[]): string
{
    return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}