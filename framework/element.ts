import type { PickMatch } from "typescript-util-types"
import { masterTooling, MasterTooling } from "./tooling"

export interface MasterElementProps { [key: string]: any }
export interface MasterElementTemplate<Props extends MasterElementProps>
{
    (params: { props: Props, self: Element, $: MasterTooling }): DocumentFragment | Promise<DocumentFragment>
}

interface _<Props extends MasterElementProps> { PROPS_TYPE: Props }
export interface MasterElementFactory<Props extends MasterElementProps> extends _<Props>
{
    (props: MasterElementProps): MasterElement<Props>
}

export function masterElement<Props extends MasterElementProps>(tag: string, elementTemplate: MasterElementTemplate<Props>): MasterElementFactory<Props>
{
    const Element = class extends MasterElement<Props>
    {
        constructor(props: Props) { super(elementTemplate, props) }
    }
    customElements.define(tag, Element)
    const r = (props: Props) => new Element(props)
    return r as any
}

export function importMasterElementFactoryAsync<T extends Record<string, any>, K extends keyof PickMatch<T, MasterElementFactory<any>>>(modulePromise: Promise<T>, key: K)
{
    const factory = async (props: T[K]['PROPS_TYPE']) => (await modulePromise)[key](props)
    return { [key]: factory } as { [k in K]: typeof factory }
}

export abstract class MasterElement<Props extends MasterElementProps = MasterElementProps> extends HTMLElement
{
    public readonly globalFragment = document.createDocumentFragment()
    constructor(elementTemplate: MasterElementTemplate<Props>, props: Props)
    {
        super()
        const shadowRoot = this.attachShadow({ mode: 'open' })
        const $ = masterTooling(this)
        const fragment = elementTemplate({ props, self: this, $ })
        shadowRoot.append(this.globalFragment.cloneNode(true))
        if (fragment instanceof Promise) fragment.then(fragment => shadowRoot.appendChild(fragment))
        else shadowRoot.appendChild(fragment)
    }
}