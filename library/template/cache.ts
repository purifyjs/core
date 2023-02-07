import { render, TemplateValue } from "."
import { parseTemplateDescriptor, TemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"

export function createCachedHtml()
{
    let descriptorCache: TemplateDescriptor | null = null
    return (strings: TemplateStringsArray, ...values: TemplateValue[]) =>
    {
        if (!descriptorCache) descriptorCache = parseTemplateDescriptor(parseTemplateHtml(strings))
        return render(descriptorCache, values)
    }
}