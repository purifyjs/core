export type TemplateAcceptsValues = string | number
export type TemplateAccepts = TemplateAcceptsValues | EventListener
export type Template = Awaited<ReturnType<typeof html>>
export function html(parts: TemplateStringsArray, ...params: TemplateAccepts[])
{
    return {
        parts,
        params
    }
}