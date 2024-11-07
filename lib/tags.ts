/* eslint-disable @typescript-eslint/no-explicit-any */

import { StrictARIA } from "./aria"
import { Signal } from "./signals"

let custom = customElements

let instancesOf = <T extends abstract new (...args: never) => unknown>(
    target: unknown,
    constructor: T
): target is InstanceType<T> => target instanceof constructor

/**
 * Proxy object for building HTML elements.
 *
 * It separates attributes and properties.

 * @example
 * ```ts
 * let { div, span } = tags;
 * 
 * div({ class: 'hello', 'aria-hidden': 'false' })
 *  .id("my-div")
 *  .ariaLabel("Hello, World!")
 *  .onclick(() => console.log('clicked!'))
 *  .children(span('Hello, World!'));
 * ```
 *
 * Also allows signals as properties or attributes:
 * ```ts
 * div({ class: computed(() => count.val & 1 ? 'odd' : 'even') })
 *  .onclick(computed(() =>
 *      count.val & 1 ?
 *          () => alert('odd') :
 *          () => alert('even')
 *  ))
 *  .children("Click me!");
 * ```
 */
export let tags: Tags = new Proxy<Tags>({} as Tags, {
    get: (tags: any, tag: keyof Tags) =>
        (tags[tag] ??= (attributes: any = {}) =>
            Builder.Proxy(withLifecycle(tag)).attributes(attributes))
})

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>
    ) => Builder.Proxy<WithLifecycle<HTMLElementTagNameMap[K]>>
}

/**
 * A union type representing the possible member types of a given ParentNode.
 * Used in Builder.children() and fragment() functions
 */
export type MemberOf<T extends ParentNode> =
    | string
    | number
    | boolean
    | bigint
    | null
    | Node
    | Builder<HTMLElement>
    | MemberOf<T>[]
    | Signal<MemberOf<T>>

/**
 * Creates a DocumentFragment containing the provided members.
 *
 * @param members - The members to append to the fragment.
 * @returns  The created DocumentFragment.
 * @example
 * ```ts
 * document.body.append(fragment(
 *      document.createElement('div'),
 *      div(),
 *      computed(() => count.val * 2),
 *      'Text content'
 * ));
 * ```
 */
export let fragment = (...members: MemberOf<DocumentFragment>[]): DocumentFragment => {
    let fragment = document.createDocumentFragment()
    if (members) fragment.append(...members.map(toAppendable))
    return fragment
}

/**
 * Converts a value into an appendable format.
 *
 * @param value - The value to convert.
 * @returns The appendable value.
 */
let toAppendable = (value: unknown): string | Node => {
    if (value === null) {
        return ""
    }

    if (instancesOf(value, Node)) {
        return value
    }

    if (instancesOf(value, Signal)) {
        /* I would make a custom element for this but we have to stay under 1.0kB */
        return toAppendable(
            tags
                .div({ style: "display:contents" })
                .effect((element) =>
                    value.follow(
                        (value) => element.replaceChildren(toAppendable(value)),
                        true
                    )
                )
        )
    }

    if (instancesOf(value, Builder)) {
        return value.element
    }

    if (instancesOf(value, Array)) {
        // Normally fragment accepts anything because it maps its input members with toAppendable anyway.
        // But we dont allow things like undefined in the types.
        // So we can get IDE errors when something can be undefined.
        // But here, it doesn't matter, so we just set the type as never[]
        return fragment(...(value as never[]))
    }

    return String(value)
}

/**
 * Builder class to construct a builder to populate an element with attributes and children.
 */
export class Builder<T extends HTMLElement> {
    public readonly element: T

    /**
     * Creates a builder for the given element.
     *
     * @param element - The element to build.
     * @example
     * ```ts
     * new Builder(myDiv)
     *  .attributes({ class: 'hello', 'aria-hidden': 'false' })
     *  .children(span('Hello, World!'));
     * ```
     */
    constructor(element: T) {
        this.element = element
    }

    public children(...members: MemberOf<T>[]): this {
        this.element.append(...members.map(toAppendable))
        return this
    }

    public attributes(attributes: Builder.Attributes<T>): this {
        let element = this.element
        for (let name in attributes) {
            let value = attributes[name]

            let setOrRemoveAttribute = (value: unknown) => {
                if (value == null) {
                    element.removeAttribute(name)
                } else {
                    element.setAttribute(name, String(value))
                }
            }

            if (instancesOf(value, Signal)) {
                ;(element as Partial<HTMLElementWithLifecycle>).effect?.(() =>
                    value.follow(setOrRemoveAttribute, true)
                )
            } else {
                setOrRemoveAttribute(value)
            }
        }
        return this
    }
}

type AttributeValue<TElement extends Element, T> =
    TElement extends WithLifecycle<HTMLElement> ? T | Signal<T> : T

export declare namespace Builder {
    type Attributes<T extends Element> = {
        class?: AttributeValue<T, string | null>
        id?: AttributeValue<T, string | null>
        style?: AttributeValue<T, string | null>
        title?: AttributeValue<T, string | null>
        form?: AttributeValue<T, string | null>
    } & {
        [K in keyof StrictARIA.Attributes]?: AttributeValue<T, StrictARIA.Attributes[K]>
    } & {
        [key: string]: AttributeValue<T, string | number | boolean | bigint | null>
    }

    type Proxy<T extends WithLifecycle<HTMLElement>> = Builder<T> & {
        [K in keyof T as If<IsProxyable<T, K>, K>]: T[K] extends (
            (...args: infer Args) => void
        ) ?
            (...args: Args) => Proxy<T>
        :   (
                value: NonNullable<T[K]> extends (
                    (this: infer X, event: infer U) => infer R
                ) ?
                    U extends Event ?
                        (this: X, event: U & { currentTarget: T }) => R
                    :   T[K]
                :   T[K] | Signal<T[K]>
            ) => Proxy<T>
    }

    /**
     * Creates a proxy for a `Builder` instance.
     * Which allows you to also set properties.
     *
     * @param element - The element to manage.
     * @returns The proxy for the Builder instance.
     *
     * @example
     * ```ts
     * Builder.Proxy(myDiv)
     *  .attributes({ class: 'hello', 'aria-hidden': 'false' })
     *  .children(span('Hello, World!'));
     *  .onclick(() => console.log('clicked!'));
     *  .ariaLabel("Hello, World!");
     * ```
     */
    function Proxy<T extends WithLifecycle<HTMLElement>>(element: T): Builder.Proxy<T>
}

Builder.Proxy = <T extends WithLifecycle<HTMLElement>>(element: T) =>
    new Proxy(new Builder(element) as Builder.Proxy<T>, {
        get: ((
            target: Partial<Record<PropertyKey, unknown>>,
            name: keyof T,
            proxy: unknown
        ) =>
            (target[name] ??=
                name in element &&
                ((
                    instancesOf(element[name], Function) &&
                    !(element as object).hasOwnProperty(name)
                ) ?
                    (...args: any) => {
                        ;(element[name] as Fn)(...args)
                        return proxy
                    }
                :   (value: unknown) => {
                        if (instancesOf(value, Signal)) {
                            element.effect(() =>
                                value.follow(
                                    (value) => (element[name] = value as never),
                                    true
                                )
                            )
                        } else {
                            element[name] = value as never
                        }

                        return proxy
                    }))) as never
    })

type IsProxyable<T, K extends keyof T> = [
    // Anything part of the Lifecycle
    K extends Exclude<keyof HTMLElementWithLifecycle, keyof HTMLElement> ? true : false,
    // Any non readonly non functions, basically mutable values
    Not<IsReadonly<T, K>> & Not<IsFunction<T[K]>>,
    // Any nullable functions, basically mutable functions such as event listeners
    IsFunction<T[K]> & IsNullable<T[K]>,
    // Any function that returns void exclusivly
    IsFunction<T[K], void>
][number]

type If<T extends boolean, Then, Else = never> = true extends T ? Then : Else
type Not<T extends boolean> = false extends T ? true : false
type Fn = (...args: any) => any
type IsFunction<T, TReturns = any> =
    Fn extends T ?
        T extends (...args: any) => infer R ?
            R extends TReturns ?
                true
            :   false
        :   false
    :   false
type IsNullable<T> = null extends T ? true : false
type IsReadonly<T, K extends keyof T> =
    (<T_1>() => T_1 extends { [Q in K]: T[K] } ? 1 : 2) extends (
        <T_2>() => T_2 extends {
            readonly [Q_1 in K]: T[K]
        } ?
            1
        :   2
    ) ?
        true
    :   false

export type WithLifecycle<T extends HTMLElement> = T & HTMLElementWithLifecycle
type HTMLElementWithStrictARIA = Omit<HTMLElement, keyof StrictARIA.Properties> &
    StrictARIA.Properties
interface HTMLElementWithLifecycle extends HTMLElementWithStrictARIA {
    effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected
}
export namespace Lifecycle {
    export type OnDisconnected = () => void
    export type OnConnected<T extends HTMLElement = HTMLElement> = (
        element: T
    ) => void | OnDisconnected
    export type OffConnected = () => void
}

let withLifecycle = <
    T extends keyof HTMLElementTagNameMap,
    Returns = WithLifecycle<HTMLElementTagNameMap[T]>
>(
    tagname: T,
    newTagName = `pure-${tagname}` as const,
    constructor = custom.get(newTagName) as new () => Returns
): Returns => {
    if (!constructor) {
        custom.define(
            newTagName,
            (constructor = class extends (document.createElement(tagname)
                .constructor as typeof HTMLElement) {
                #connectedCallbacks = new Set<Lifecycle.OnConnected<this>>()
                #disconnectedCallbacks: ReturnType<Lifecycle.OnConnected<this>>[] = []

                connectedCallback() {
                    for (let callback of this.#connectedCallbacks) {
                        this.#disconnectedCallbacks.push(callback(this))
                    }
                }

                disconnectedCallback() {
                    for (let disconnectedCallbackOrVoid of this.#disconnectedCallbacks) {
                        disconnectedCallbackOrVoid?.()
                    }
                }

                effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected {
                    this.#connectedCallbacks.add(callback)
                    if (this.isConnected) {
                        this.#disconnectedCallbacks.push(callback(this))
                    }

                    return () => {
                        this.#connectedCallbacks.delete(callback)
                    }
                }
            } as never),
            { extends: tagname }
        )
    }

    return new constructor()
}
