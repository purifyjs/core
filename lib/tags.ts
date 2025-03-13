/* eslint-disable @typescript-eslint/no-explicit-any */

import { StrictARIA } from "./aria"
import { Signal } from "./signals"
import { _Event, Fn, If, IsProxyable } from "./utils"

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
export let tags: Tags = new Proxy({} as any, {
    // Keep `any` here, otherwise `tsc` and LSP gets slow as fuck
    get: (tags: any, tag: string, constructor) =>
        (tags[tag] ??=
            ((constructor = document.createElement(tag).constructor),
            (constructor =
                constructor["effect"] ? constructor : (
                    class extends WithLifecycle(constructor) {}
                )),
            customElements.define(`${tag}-withlifecycle`, constructor, { extends: tag }),
            (attributes: any = {}) =>
                new (Builder as any)(new constructor()).attributes(attributes)))
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
export type MemberOf<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends ParentNode
> = unknown

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

    if (instancesOf(value, Builder)) {
        return value.node
    }

    if (instancesOf(value, Signal)) {
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

    if (instancesOf(value, Array)) {
        return fragment(...value)
    }

    return value + ""
    // return String(value)
}

export type BuilderConstructor = {
    new <T extends Node>(node: T): Builder<T>
    new (node: Node): Builder<Node>
}

export let Builder: BuilderConstructor = function <
    T extends Node & Partial<WithLifecycle<HTMLElement>>
>(this: Builder<T>, element: T) {
    this.node = element
    return new Proxy(this, {
        get: (target: any, name: keyof T, proxy: unknown) =>
            (target[name] ??=
                name in element ?
                    (
                        instancesOf(element[name], Function) &&
                        !element.hasOwnProperty(name)
                    ) ?
                        (arg: Signal<unknown[]> | unknown, ...args: unknown[]) => {
                            if (instancesOf(arg, Signal)) {
                                element.effect!(() =>
                                    arg.follow(
                                        (arg) =>
                                            (element[name] as Fn)(...(arg as unknown[])),
                                        true
                                    )
                                )
                            } else {
                                ;(element[name] as Fn)(arg, ...args)
                            }
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

export namespace Builder {
    export type Event<E extends _Event, T extends EventTarget> = E & { currentTarget: T }

    export namespace Attributes {
        export type Value<TElement extends Element, T> =
            TElement extends WithLifecycle<HTMLElement> ? T | Signal<T> : T
    }
    export type Attributes<T extends Element> = {
        class?: Attributes.Value<T, string | null>
        id?: Attributes.Value<T, string | null>
        style?: Attributes.Value<T, string | null>
        title?: Attributes.Value<T, string | null>
        form?: Attributes.Value<T, string | null>
    } & {
        [K in keyof StrictARIA.Attributes]?: Attributes.Value<T, StrictARIA.Attributes[K]>
    } & {
        [key: string]: Attributes.Value<T, string | number | boolean | bigint | null>
    }
}

export type Builder<T extends Node> = ({
    node: T
} & (T extends ParentNode ? { children(...members: MemberOf<T>[]): Builder<T> }
:   unknown) &
    (T extends Element ? { attributes(attributes: Builder.Attributes<T>): Builder<T> }
    :   unknown)) & {
    [K in keyof T as If<IsProxyable<T, K>, K>]: T[K] extends (
        (...args: infer Args) => void
    ) ?
        (...args: Args | [Signal<Args>]) => Builder<T>
    :   (
            value: NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R ?
                U extends Event ?
                    (this: X, event: Builder.Event<U, T>) => R
                :   T[K]
            : T extends WithLifecycle<HTMLElement> ? T[K] | Signal<T[K]>
            : T[K]
        ) => Builder<T>
}

Builder.prototype = {
    children(...members: MemberOf<ParentNode>[]): Builder<ParentNode> {
        this.node.append(...members.map(toAppendable))
        return this
    },
    attributes(attributes: Builder.Attributes<Element>): Builder<Element> {
        let node = this.node as Element & Partial<WithLifecycle<HTMLElement>>
        for (let name in attributes) {
            let value = attributes[name]!

            let setOrRemoveAttribute = (value: unknown) => {
                if (value == null) {
                    node.removeAttribute(name)
                } else {
                    // element.setAttribute(name, String(value))
                    node.setAttribute(name, value + "")
                }
            }

            if (instancesOf(value, Signal)) {
                node.effect!(() => value.follow(setOrRemoveAttribute, true))
            } else {
                setOrRemoveAttribute(value)
            }
        }
        return this
    }
}

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

let withLifecycleCache = new Map<
    { new (): HTMLElement },
    { new (): WithLifecycle<HTMLElement> }
>()
export let WithLifecycle = <Base extends { new (...params: any[]): HTMLElement }>(
    Base: Base
): {
    new (...params: ConstructorParameters<Base>): WithLifecycle<InstanceType<Base>>
} => {
    let constructor = withLifecycleCache.get(Base)
    if (!constructor) {
        withLifecycleCache.set(
            Base,
            (constructor = class extends Base {
                #connectedCallbacks = new Set<Lifecycle.OnConnected<this>>()
                #disconnectedCallbacks: ReturnType<Lifecycle.OnConnected<this>>[] = []

                connectedCallback(): void {
                    for (let callback of this.#connectedCallbacks) {
                        this.#disconnectedCallbacks.push(callback(this))
                    }
                }

                disconnectedCallback(): void {
                    for (let disconnectedCallbackOrVoid of this.#disconnectedCallbacks) {
                        disconnectedCallbackOrVoid?.()
                    }
                }

                effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected {
                    this.#connectedCallbacks.add(callback)
                    // Commented because causes issues when custom element defined while also being already connected
                    /* if (this.isConnected) {
                this.#disconnectedCallbacks.push(callback(this))
            } */

                    return () => {
                        this.#connectedCallbacks.delete(callback)
                    }
                }
            } satisfies { new (): WithLifecycle<HTMLElement> })
        )
    }
    return constructor as never
}
