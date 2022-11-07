export function scopeCss(css: string, scopeSelector: string): string
{
    const matches = css.matchAll(/(?<selector>[^{]+){(?<rules>[^}]+)}/g)
    const scopedCss = [...matches].map((match) =>
    {
        const selector = match.groups?.selector ?? ''
        const rules = match.groups?.rules ?? ''

        const selectors = selector.split(',').map((selector) =>
        {
            return scopeCssSelector(selector, scopeSelector)
        })
        return `${selectors.join(',')}{${rules}}`
    })
    return scopedCss.join('')
}

export function scopeCssSelector(selector: string, scopeSelector: string): string
{
    const combinators = [' ', '>', '+', '~']
    const parts = selector.split(/(?<combinator>[ >+~])/g).map((part) => part.trim()).filter((part) => part !== '')
    const scopedParts = parts.map((part) =>
    {
        if (combinators.includes(part)) return part

        const matches = part.matchAll(/\(([^()]+)\)/g)
        if (matches)
        {
            for (const match of matches)
            {
                if (!match.index) continue
                const scopedPart = scopeCssSelector(match[1], scopeSelector)
                const partArr = Array.from(part)
                partArr.splice(match.index, match[0].length, `(${scopedPart})`).join('')
                part = partArr.join('')
            }
        }

        return `${part}${scopeSelector}`
    })
    return scopedParts.join('')
}