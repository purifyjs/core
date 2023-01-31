import { MasterAPI } from "./api"
import { createTemplateCache, html, TemplateHtmlArray, TemplateValueArrayFromHtmlArray } from "./template"
import { randomId } from "./utils/id"

export function defineMasterElement(tagName = `x-${randomId()}`)
{
    const CustomMasterElement = class extends MasterElement 
    {
    }
    customElements.define(tagName, CustomMasterElement)
    return (...params: ConstructorParameters<typeof CustomMasterElement>) => new CustomMasterElement(...params)
}

export function defineMasterElementCached(tagName = `x-${randomId()}`)
{
    const CustomMasterElementCached = class extends MasterElement 
    {
        protected static readonly templateCache = createTemplateCache()
        public override clear()
        {
            if (this.htmlBuilt) throw new Error('Cannot clear cached element')
            super.clear()
        }

        protected htmlBuilt = false
        public override html<S extends TemplateHtmlArray, T extends TemplateValueArrayFromHtmlArray<S>>(parts: S, ...values: T)
        {
            if (this.htmlBuilt) throw new Error('Cannot build html twice on cached element')
            const fragment = CustomMasterElementCached.templateCache.html(parts, ...values)
            this.shadowRoot!.append(...fragment)
            this.htmlBuilt = true
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