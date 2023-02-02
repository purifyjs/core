import { asMountableNode } from "../mountable"
import { createTemplateCache, html, TemplateHtmlArray, TemplateValueArrayFromHtmlArray } from "../template"
import { randomId } from "../utils/id"

export function defineComponentNoCache(tagName = `x-${randomId()}`)
{
    const CustomMasterElement = class extends Component 
    {
    }
    customElements.define(tagName, CustomMasterElement)
    return (...params: ConstructorParameters<typeof CustomMasterElement>) => asMountableNode(new CustomMasterElement(...params))
}

export function defineComponent(tagName = `x-${randomId()}`)
{
    const CustomMasterElementCached = class extends Component 
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
    return (...params: ConstructorParameters<typeof CustomMasterElementCached>) => asMountableNode(new CustomMasterElementCached(...params))
}

export abstract class Component extends HTMLElement
{
    public static readonly globalFragment = document.createDocumentFragment()

    constructor()
    {
        super()
        this.attachShadow({ mode: 'open' })
        this.clear()
    }

    public clear()
    {
        this.shadowRoot!.innerHTML = ''
        this.shadowRoot!.append(Component.globalFragment.cloneNode(true))
    }

    public html<S extends TemplateHtmlArray, T extends TemplateValueArrayFromHtmlArray<S>>(parts: S, ...values: T)
    {
        this.clear()
        const fragment = html(parts, ...values)
        this.shadowRoot!.append(...fragment)
        return this
    }
}