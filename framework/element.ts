import { html } from "./fragment"
import { MasterTooling } from "./tooling"

export function defineElement(tagName: string)
{
    const CustomElement = class extends MasterElement { }
    customElements.define(tagName, CustomElement)
    return (...params: ConstructorParameters<typeof CustomElement>) => new CustomElement(...params)
}

export abstract class MasterElement extends HTMLElement
{
    public static readonly globalFragment = document.createDocumentFragment()

    public readonly $: MasterTooling
    public readonly shadowRoot: ShadowRoot

    constructor()
    {
        super()
        this.shadowRoot = this.attachShadow({ mode: 'open' })
        this.shadowRoot.append(MasterElement.globalFragment.cloneNode(true))
        this.$ = new MasterTooling(this)
    }

    html<T extends unknown[]>(parts: TemplateStringsArray, ...values: T): Promise<any> extends T[number] ? Promise<typeof this> : typeof this
    {
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