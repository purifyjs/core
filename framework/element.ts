import { masterNodeTooling, MasterNodeTooling } from "./tooling"

export type MasterElementProps = { [key: string]: any }
export type MasterElementTemplate<Props extends MasterElementProps> = (params: { props: Props, self: Element, $: MasterNodeTooling }) => DocumentFragment

export function masterElement<Props extends MasterElementProps>(tag: string, elementTemplate: MasterElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props> 
    { 
        constructor(props: Props) { super(elementTemplate, props) }
    }
    customElements.define(tag, Element)
    return (props: Props) => new Element(props)
}

export abstract class MasterElement<Props extends MasterElementProps = MasterElementProps> extends HTMLElement
{
    constructor(elementTemplate: MasterElementTemplate<Props>, props: Props)
    {
        super()
        const shadowDOM = this.attachShadow({ mode: 'open' })
        const fragment = elementTemplate({ props, self: this, $: masterNodeTooling(this) })
        shadowDOM.appendChild(fragment)
    }
}