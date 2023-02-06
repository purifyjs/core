import { makeMountableNode } from "../mountable"
import { parseHtml } from "../template/parse/html"
import { parseTemplateDescriptor, TemplateDescriptor } from "../template/parse/template"
import { render, TemplateValue } from "../template/render"
import { randomId } from "../utils/id"

export function defineComponent(tagName = `x-${randomId()}`)
{
    const component = class extends Component 
    {
        protected static cssLink: HTMLLinkElement = document.createElement('link')

        public static set css(css: string)
        {
            const blob = new Blob([css], { type: 'text/css' })
            const url = URL.createObjectURL(blob)
            this.cssLink.rel = 'stylesheet'
            this.cssLink.href = url
        }

        protected static templateDescriptor: TemplateDescriptor | null = null
        public html<T extends TemplateValue[]>(strings: TemplateStringsArray, ...values: T)
        {
            const nodes = render(component.templateDescriptor ??= parseTemplateDescriptor(parseHtml(strings)), values)
            this.shadowRoot!.innerHTML = ''
            this.shadowRoot!.append(Component.globalFragmentBefore.cloneNode(true))
            const link = component.cssLink.cloneNode(true) as HTMLLinkElement
            this.shadowRoot!.append(link)
            this.shadowRoot!.append(...nodes)
            this.shadowRoot!.append(Component.globalFragmentAfter.cloneNode(true))
        }
    }
    customElements.define(tagName, component)

    return component
}

export abstract class Component extends HTMLElement
{
    public static readonly globalFragmentBefore = document.createDocumentFragment()
    public static readonly globalFragmentAfter = document.createDocumentFragment()

    constructor()
    {
        super()
        this.attachShadow({ mode: 'open' })
        makeMountableNode(this)
    }
}