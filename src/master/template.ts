import { Signal } from "./signal"

type TemplateAcceptsValue = HTMLElement | DocumentFragment | string | number | boolean | null | undefined | Date
export type TemplateAccepts = TemplateAcceptsValue | Signal<HTMLElement> | Signal<DocumentFragment> | Signal<string> | Signal<number> | Signal<boolean> | Signal<Date> | Signal<null> | Signal<undefined>

async function parseValue(value: TemplateAcceptsValue): Promise<Node>
{
    if (value instanceof HTMLElement)
    {
        return value
    }
    else if (value instanceof DocumentFragment)
    {
        return value
    }
    else if (value instanceof Date)
    {
        return document.createTextNode(value.toISOString())
    }
    else
    {
        return document.createTextNode(String(value))
    }
}

export async function html(parts: TemplateStringsArray, ...values: TemplateAccepts[])
{
    const nodes: Node[] = []
    const htmlParts = await Promise.all(parts.map(async (htmlPart, index) => 
    {
        const value = values[index]
        if (value == null || value === undefined) return htmlPart
        if (value instanceof Signal)
        {

            const fragment = document.createDocumentFragment()
            const comment = `signal ${value.id}`
            const startComment = document.createComment(comment)
            const endComment = document.createComment(`/${comment}`)

            const node = await parseValue(value.value)
            fragment.append(startComment, node, endComment)

            const sub = value.subscribe(async (value) =>
            {
                while (startComment.nextSibling !== endComment) startComment.nextSibling?.remove()
                const node = await parseValue(value)
                startComment.after(node)
            })

            nodes.push(fragment)
        }
        else
        {
            nodes.push(await parseValue(value))
        }

        return `${htmlPart}<outlet-${index}></outlet-${index}>`
    }))

    const html = htmlParts.join('')

    const template = document.createElement('template')
    template.innerHTML = html

    nodes.forEach((node, index) => template.content.querySelector(`outlet-${index}`)!.replaceWith(node))

    return template.content
}