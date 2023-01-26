import { MasterAPI } from "./api"
import { createTemplateCache, html } from "./template"

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

        html<T extends unknown[]>(parts: TemplateStringsArray, ...values: T)
        {
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

    public readonly $: MasterAPI

    constructor()
    {
        super()
        this.attachShadow({ mode: 'open' })
        this.$ = new MasterAPI(this)
        this.clear()
    }

    clear()
    {
        this.shadowRoot!.innerHTML = ''
        this.shadowRoot!.append(MasterElement.globalFragment.cloneNode(true))
    }

    html<T extends unknown[]>(parts: TemplateStringsArray, ...values: T): InstanceType<typeof MasterElement>
    {
        this.clear()
        const fragment = html(parts, ...values)
        this.shadowRoot!.append(...fragment)
        return this
    }
}