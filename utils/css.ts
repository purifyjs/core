
// TODO: Need a better way to do this with a parser
export function unlimitedPseudo(css: string)
{
    const pseudos: { selector: string, pseudo: string }[] = []
    css = css.split('::').map((part, index, arr) =>
    {
        if (part.startsWith('before(') || part.startsWith('after('))
        {
            const previous = arr[index - 1]
            const selector = previous.slice(Math.max(0, previous.lastIndexOf('}'), previous.lastIndexOf(','))).trim()

            const end = part.indexOf(')')
            if (end < 0) throw new Error(`Cannot find end of pseudo element at "${part}"`)
            const pseudo = part.substring(part.indexOf('(') + 1, end).trim()
            const rest = part.substring(end + 1)

            pseudos.push({ selector, pseudo })

            return `>[::pseudo="${pseudo}"]${rest}`
        }
        
        return `${index > 0 ? '::' : ''}${part}`
    }).join('').trim()

    return { css, pseudos }
}