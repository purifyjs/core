import { masterTooling, MasterTooling } from "./tooling"

export interface MasterElementProps { [key: string]: any }
export interface MasterElementTemplate<Props extends MasterElementProps>
{
    (params: { props: Props, self: Element, $: MasterTooling }): DocumentFragment   
}

export function masterElement<Props extends MasterElementProps>(tag: string, elementTemplate: MasterElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props> 
    { 
        constructor(props: Props) { super(elementTemplate, props) }
    }
    customElements.define(tag, Element)
    const r = (props: Props) => new Element(props)
    return r as typeof r & { PROPS_TYPE: Props }
}

export abstract class MasterElement<Props extends MasterElementProps = MasterElementProps> extends HTMLElement
{
    constructor(elementTemplate: MasterElementTemplate<Props>, props: Props)
    {
        super()
        const shadowRoot = this.attachShadow({ mode: 'open' })
        const fragment = elementTemplate({ props, self: this, $: masterTooling(this) })
        shadowRoot.append(fragment)
    }
}