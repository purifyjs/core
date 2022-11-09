// TODO: ok new goal, rn we have fragments but elements are still the corner stone of the framework
// we dont want that. this will also make the code a lot cleaner
// so we need to make it so that elements are just a special case of a fragment
// and then we can just use fragments everywhere
// and then we can also get rid of the whole "master element" thing
// this also means we can use globalFragment, instead we can just import the css in style i guess using css @import rule

// to do these, we need to seperate $signal, $derive, and $text and stuff into something else, similar to toolingFor(element)
// also for that to work we need to change onNodeUnmount to something that listens for if the node is under document or not and returns callbacks
// and it should do that with WeakRef so we dont need to unlisten manually and worry about memory leaks
// mount should never be called manually, there shouldnt be a fucntion called mount anyway, 
// onMount and onUnmount should be triggered based on their root parent thats all, and they can be called multiple times 
// and we should also follow initilization to so onUnmount is not called while onMount is never called

// we can still have custom elements for isolation and stuff but similar to how we can have divs inside templates
// not as a special case but as a normal thing
// but we can still have defineElement to make it easier to make custom elements and use tooling with it

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