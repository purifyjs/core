import { makeMountableNode } from "../mountable"
import { parseTemplateDescriptor, TemplateDescriptor } from "../template/parse/descriptor"
import { parseTemplateHtml } from "../template/parse/html"
import { render, Template } from "../template"
import { randomId } from "../utils/id"

export function defineComponent(tagName = `x-${randomId()}`)
{
    const component = class extends Component 
    {
        protected static cssString = ''

        public static set $css(css: string)
        {
            component.cssString = css
        }

        protected static templateDescriptor: TemplateDescriptor | null = null
        public set $template({ strings, values }: Template)
        {
            const nodes = render(component.templateDescriptor ??= parseTemplateDescriptor(parseTemplateHtml(strings)), values)
            
            while (this.shadowRoot!.firstChild)
                this.shadowRoot!.removeChild(this.shadowRoot!.firstChild)
                
            this.shadowRoot!.append(Component.globalFragmentBefore.cloneNode(true))

            const style = document.createElement('style')
            style.textContent = component.cssString
            this.shadowRoot!.append(style)
            
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