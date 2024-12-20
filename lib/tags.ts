/* eslint-disable @typescript-eslint/no-explicit-any */

import { StrictARIA } from "./aria"
import { Signal } from "./signals"

let instancesOf = <T extends abstract new (...args: never) => unknown>(
    target: unknown,
    constructor: T
): target is InstanceType<T> => target instanceof constructor

let custom = customElements

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
export let tags: Tags = new Proxy({} as any, {
    // Keep `any` here, otherwise `tsc` gets slow as fuck
    get: (tags: any, tag: any): any =>
        (tags[tag] ??= (attributes: any = {}) =>
            new (Builder as any)(new ((WithLifecycle as any)(tag))()).attributes(
                attributes
            ))
})

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>
    ) => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>
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
    | Builder<Element>
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
let toAppendable = (value: MemberOf<ParentNode>): string | Node => {
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
        return fragment(...value)
    }

    return value + ""
    // return String(value)
}

export type Builder<T extends Element> = {
    element: T
    children(...members: MemberOf<T>[]): Builder<T>
    attributes(attributes: Builder.Attributes<T>): Builder<T>
} & {
    [K in keyof T as If<IsProxyable<T, K>, K>]: T[K] extends (
        (...args: infer Args) => void
    ) ?
        (...args: Args) => Builder<T>
    :   (
            value: NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R ?
                U extends Event ?
                    (this: X, event: U & { currentTarget: T }) => R
                :   T[K]
            : T extends WithLifecycle<HTMLElement> ? T[K] | Signal<T[K]>
            : T[K]
        ) => Builder<T>
}

export namespace Builder {
    type Value<TElement extends Element, T> =
        TElement extends WithLifecycle<HTMLElement> ? T | Signal<T> : T

    export type Attributes<T extends Element> = {
        class?: Value<T, string | null>
        id?: Value<T, string | null>
        style?: Value<T, string | null>
        title?: Value<T, string | null>
        form?: Value<T, string | null>
    } & {
        [K in keyof StrictARIA.Attributes]?: Value<T, StrictARIA.Attributes[K]>
    } & {
        [key: string]: Value<T, string | number | boolean | bigint | null>
    }
}

export type BuilderConstructor = {
    new <T extends Element>(element: T): Builder<T>
    new (element: Element): Builder<Element>
}

export let Builder: BuilderConstructor = function <
    T extends Element & Partial<WithLifecycle<HTMLElement>>
>(this: Builder<T>, element: T) {
    this.element = element
    return new Proxy(this, {
        get: (target: any, name: keyof T, proxy: unknown) =>
            (target[name] ??=
                name in element ?
                    (
                        instancesOf(element[name], Function) &&
                        !element.hasOwnProperty(name)
                    ) ?
                        (...args: unknown[]) => {
                            ;(element[name] as Fn)(...args)
                            return proxy
                        }
                    :   (value: unknown) => {
                            if (instancesOf(value, Signal)) {
                                element.effect!(() =>
                                    value.follow(
                                        (value) => (element[name] = value as never),
                                        true
                                    )
                                )
                            } else {
                                element[name] = value as never
                            }

                            return proxy
                        }
                :   element[name])
    } as never)
} as never

Builder.prototype = {
    children(...members: MemberOf<Element>[]): Builder<Element> {
        this.element.append(...members.map(toAppendable))
        return this
    },
    attributes(attributes: Builder.Attributes<Element>): Builder<Element> {
        let element = this.element as typeof this.element &
            Partial<WithLifecycle<HTMLElement>>
        for (let name in attributes) {
            let value = attributes[name]!

            let setOrRemoveAttribute = (value: unknown) => {
                if (value == null) {
                    element.removeAttribute(name)
                } else {
                    // element.setAttribute(name, String(value))
                    element.setAttribute(name, value + "")
                }
            }

            if (instancesOf(value, Signal)) {
                element.effect!(() => value.follow(setOrRemoveAttribute, true))
            } else {
                setOrRemoveAttribute(value)
            }
        }
        return this
    }
}

type IsProxyable<T, K extends keyof T> = [
    // Anything part of the Lifecycle
    K extends Exclude<keyof WithLifecycle<HTMLElement>, keyof HTMLElement> ? true : false,
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

export namespace Lifecycle {
    export type OnDisconnected = () => void
    export type OnConnected<T extends HTMLElement = HTMLElement> = (
        element: T
    ) => void | OnDisconnected
    export type OffConnected = () => void
}

export type WithLifecycle<T extends HTMLElement> = T & {
    effect(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected
}

export let WithLifecycle: <T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    newTagName?: `${string}-${string}`
) => { new (): WithLifecycle<HTMLElementTagNameMap[T]> } = <
    T extends keyof HTMLElementTagNameMap
>(
    tagname: T,
    newTagName = `pure-${tagname}`,
    constructor = custom.get(newTagName) as new () => WithLifecycle<
        HTMLElementTagNameMap[T]
    >
): new () => WithLifecycle<HTMLElementTagNameMap[T]> =>
    constructor ??
    (custom.define(
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
    ),
    constructor)
