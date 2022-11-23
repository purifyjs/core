import { MasterAPI } from "./api"
import { createTemplateCache, html } from "./template"

export function defineMasterElement(tagName: string)
{
    const CustomMasterElement = class extends MasterElement 
    {
        private static readonly templateCache = createTemplateCache()

        htmlCached<T extends unknown[]>(parts: TemplateStringsArray, ...values: T): Promise<any> extends T[number] ? Promise<typeof this> : typeof this
        {
            const fragment = CustomMasterElement.templateCache.html(parts, ...values)
            if (fragment instanceof Promise) return fragment.then(fragment => 
            {
                this.shadowRoot.append(fragment)
                return this
            }) as any
            this.shadowRoot.append(fragment)
            return this as any
        }
    }
    customElements.define(tagName, CustomMasterElement)
    return (...params: ConstructorParameters<typeof CustomMasterElement>) => new CustomMasterElement(...params)
}

export abstract class MasterElement extends HTMLElement
{
    public static readonly globalFragment = document.createDocumentFragment()

    public readonly $: MasterAPI
    public readonly shadowRoot: ShadowRoot

    constructor()
    {
        super()
        this.shadowRoot = this.attachShadow({ mode: 'open' })
        this.$ = new MasterAPI(this)
        this.clear()
    }

    clear()
    {
        this.shadowRoot.innerHTML = ''
        this.shadowRoot.append(MasterElement.globalFragment.cloneNode(true))
    }

    html<T extends unknown[]>(parts: TemplateStringsArray, ...values: T): Promise<any> extends T[number] ? Promise<typeof this> : typeof this
    {
        this.clear()
        const fragment = html(parts, ...values)
        if (fragment instanceof Promise) return fragment.then(fragment => 
        {
            this.shadowRoot.append(fragment)
            return this
        }) as any
        this.shadowRoot.append(fragment)
        return this as any
    }
}