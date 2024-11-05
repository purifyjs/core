/* eslint-disable @typescript-eslint/no-explicit-any */

import { ARIA } from "./aria"
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
export let tags = new Proxy<Tags>({} as Tags, {
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
    if (value == null) {
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

    if (Array.isArray(value)) {
        return fragment(...value)
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
        [K in keyof ARIA.Attributes]?: AttributeValue<T, ARIA.Attributes[K]>
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
                (
                    typeof element[name] == "function" &&
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
                    })) as never
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
export interface HTMLElementWithLifecycle
    extends Omit<HTMLElement, keyof ARIA.Properties>,
        ARIA.Properties {
    effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected
}
export namespace Lifecycle {
    export type OnDisconnected = () => void
    export type OnConnected<T extends HTMLElement = HTMLElement> = (
        element: T
    ) => void | OnDisconnected
    export type OffConnected = () => void
}

/**
 * Creates HTMLElement for a given tag name with lifecycle methods.
 *
 * @param tagname - The name of the tag to enhance.
 * @param newTagName - The new tag name for the enhanced element (optional).
 * @param constructor - The constructor for the custom element (optional).
 * @returns The enhanced element.
 */
let withLifecycle = <T extends keyof HTMLElementTagNameMap>(
    tagname: T,
    newTagName = `pure-${tagname}`,
    constructor = custom.get(newTagName) as new () => HTMLElementWithLifecycle
) => {
    if (!constructor) {
        custom.define(
            newTagName,
            (constructor = class extends (document.createElement(tagname)
                .constructor as typeof HTMLElement) {
                /* implements HTMLElementWithLifecycle */
                #connectedCallbacks = new Set<Lifecycle.OnConnected<this>>()
                #disconnectedCallbacks: Lifecycle.OnDisconnected[] = []

                #addDisconnectedCallbackIfExist(
                    disconnectedCallbackOrVoid: Lifecycle.OnDisconnected | void
                ) {
                    if (!disconnectedCallbackOrVoid) return
                    this.#disconnectedCallbacks.push(disconnectedCallbackOrVoid)
                }

                connectedCallback() {
                    for (let callback of this.#connectedCallbacks) {
                        this.#addDisconnectedCallbackIfExist(callback(this))
                    }
                }

                disconnectedCallback() {
                    for (let callback of this.#disconnectedCallbacks) {
                        callback()
                    }
                    this.#disconnectedCallbacks.length = 0
                }

                effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected {
                    this.#connectedCallbacks.add(callback)
                    if (this.isConnected) {
                        this.#addDisconnectedCallbackIfExist(callback(this))
                    }
                    return () => {
                        this.#connectedCallbacks.delete(callback)
                    }
                }
            } as never),
            { extends: tagname }
        )
    }

    return new constructor() as WithLifecycle<HTMLElementTagNameMap[T]>
}
