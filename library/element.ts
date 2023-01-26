import { MasterAPI } from "./api"
import { createTemplateCache, html, TemplateHtmlArray, TemplateValueArrayFromHtmlArray } from "./template"

export function defineMasterElement(tagName: string)
{
    const CustomMasterElement = class extends MasterElement 
    {
    }
    customElements.define(tagName, CustomMasterElement)
    return (...params: ConstructorParameters<typeof CustomMasterElement>) => new CustomMasterElement(...params)
}

export function defineMasterElementCached(...[tagName]: Parameters<typeof defineMasterElement>)
{
    const CustomMasterElementCached = class extends MasterElement 
    {
        private static readonly templateCache = createTemplateCache()

        html<S extends TemplateHtmlArray, T extends TemplateValueArrayFromHtmlArray<S>>(parts: S, ...values: T)
        {
            this.clear()
            const fragment = CustomMasterElementCached.templateCache.html(parts, ...values)
            this.shadowRoot!.append(...fragment)
            return this
        }
    }
    customElements.define(tagName, CustomMasterElementCached)
    return (...params: ConstructorParameters<typeof CustomMasterElementCached>) => new CustomMasterElementCached(...params)
}

export abstract class MasterElement extends HTMLElement
{
    public static readonly globalFragment = document.createDocumentFragment()

    public readonly m: MasterAPI

    constructor()
    {
        super()
        this.attachShadow({ mode: 'open' })
        this.m = new MasterAPI(this)
        this.clear()
    }

    clear()
    {
        this.shadowRoot!.innerHTML = ''
        this.shadowRoot!.append(MasterElement.globalFragment.cloneNode(true))
    }

    html<S extends TemplateHtmlArray, T extends TemplateValueArrayFromHtmlArray<S>>(parts: S, ...values: T)
    {
        this.clear()
        const fragment = html(parts, ...values)
        this.shadowRoot!.append(...fragment)
        return this
    }
}