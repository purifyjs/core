import { randomId } from '../utils/id'

window.document.body.addEventListener('click', (event) =>
{
    const target = event.target as HTMLElement
    console.log(target)
    if (target.hasAttribute('on:click'))
    {
        console.log((target as any).$funcs)
        const id = target.getAttribute('on:click')!;
        (target as any).$funcs[id]()
    }
})

export function defineElement<Props extends Record<string, any>>(tag: string, template: (params: { props: Props, root: ShadowRoot, onDestroy(callback: () => void): void }) => Promise<DocumentFragment>)
{
    const typeId = randomId()

    return async (props: Props, slot?: DocumentFragment) =>
    {
        const element = document.createElement(tag)
        const shadowRoot = element.attachShadow({ mode: 'open' })

        const fragment = await template({ props, root: shadowRoot, onDestroy(callback) { element.addEventListener('master:removed', () => callback(), { once: true }) } })
        shadowRoot.append(fragment)
        if (slot) element.append(slot)

        element.setAttribute(':element', typeId)

        // shadowRoot.querySelectorAll('*:not(script):not(style)').forEach((node) => node.setAttribute(':scope', typeId))

        return element
    }
}

export function defineFragment<Props extends Record<string, any>>(template: (params: { props: Props }) => Promise<DocumentFragment>)
{
    const typeId = randomId()

    return async (props: Props, slot?: DocumentFragment) =>
    {
        const comment = `fragment ${typeId}`
        const startComment = document.createComment(comment)
        const endComment = document.createComment(`/${comment}`)

        const fragment = await template({ props })
        if (slot) fragment.querySelector('slot')?.replaceWith(slot)

        fragment.prepend(startComment)
        fragment.append(endComment)

        fragment.querySelectorAll('*:not(style):not(script)').forEach((element) => element.setAttribute(':scope', typeId))
        fragment.querySelectorAll('style:not([\\:global])').forEach((style) =>
        {
            style.textContent = scopeCss(style.textContent ?? '', `[\\:scope="${typeId}"]`)
        })

        return fragment
    }
}

function scopeCss(css: string, scopeSelector: string): string
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
// \(([^\)]+)\)
function scopeCssSelector(selector: string, scopeSelector: string): string
{
    const combinators = [' ', '>', '+', '~']
    const parts = selector.split(/(?<combinator>[ >+~])/g).map((part) => part.trim()).filter((part) => part !== '')
    const scopedParts = parts.map((part, index) =>
    {
        if (combinators.includes(part)) return part

        const matches = part.matchAll(/\(([^()]+)\)/g)
        if (matches)
        {
            for (const match of matches)
            {
                if (!match.index) continue
                console.log(match)
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