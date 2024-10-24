import { Signal } from "./signals"

type Not<T extends boolean> = false extends T ? true : false
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
type IsFunction<T> = T extends Fn ? true : false
type Fn = (...args: unknown[]) => unknown
type IsEventHandler<T, K extends keyof T> =
    NonNullable<T[K]> extends (this: unknown, event: infer U) => unknown ?
        U extends Event ?
            K extends `on${string}` ?
                true
            :   false
        :   false
    :   false

type ToKebabCase<S extends string> =
    S extends `${infer First}${infer Rest}` ?
        First extends Lowercase<First> ?
            `${First}${ToKebabCase<Rest>}`
        :   `-${Lowercase<First>}${ToKebabCase<Rest>}`
    :   S

let instancesOf = <T extends abstract new (...args: never) => unknown>(
    target: unknown,
    constructor: T
): target is InstanceType<T> => target instanceof constructor

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
export let toAppendable = (value: unknown): string | Node => {
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
                .use((element) =>
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
export let tags = new Proxy(
    {},
    {
        get:
            <T extends keyof HTMLElementTagNameMap>(_: never, tag: T) =>
            (
                attributes: Builder.Attributes<
                    WithLifecycle<HTMLElementTagNameMap[T]>
                > = {}
            ) =>
                Builder.Proxy(withLifecycle(tag)).attributes(attributes)
    }
) as Tags

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>
    ) => Builder.Proxy<WithLifecycle<HTMLElementTagNameMap[K]>>
}

export type WithLifecycle<T extends HTMLElement> = T & HTMLElementWithLifecycle
export interface HTMLElementWithLifecycle extends HTMLElement {
    onConnect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected
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
    constructor = customElements.get(newTagName) as new () => HTMLElement
) => {
    if (!constructor) {
        customElements.define(
            newTagName,
            (constructor = class extends (
                (document.createElement(tagname).constructor as typeof HTMLElement)
            ) {
                #connectedCallbacks = new Set<Lifecycle.OnConnected<HTMLElement>>()
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

                onConnect(callback: Lifecycle.OnConnected<HTMLElement>) {
                    this.#connectedCallbacks.add(callback)
                    if (this.isConnected) {
                        this.#addDisconnectedCallbackIfExist(callback(this))
                    }
                    return () => {
                        this.#connectedCallbacks.delete(callback)
                    }
                }
            }),
            { extends: tagname }
        )
    }

    return new constructor() as WithLifecycle<HTMLElementTagNameMap[T]>
}

/**
 * Builder class to construct a builder to populate an element with attributes and children.
 */
export class Builder<T extends WithLifecycle<HTMLElement>> {
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

    public use(callback: Lifecycle.OnConnected<T>): this {
        this.element.onConnect(callback)
        return this
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
                element.onConnect(() => value.follow(setOrRemoveAttribute, true))
            } else {
                setOrRemoveAttribute(value)
            }
        }
        return this
    }
}

export declare namespace Builder {
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
    new Proxy(new Builder(element), {
        get: (target: Builder<T>, name: PropertyKey, proxy) =>
            target[name as never] ??
            (name in element &&
                ((value: unknown) => {
                    if (instancesOf(value, Signal)) {
                        element.onConnect(() =>
                            value.follow(
                                (value) => (element[name as never] = value as never),
                                true
                            )
                        )
                    } else {
                        element[name as never] = value as never
                    }

                    return proxy
                }))
    }) as never

export namespace Builder {
    export type Attributes<T extends Element> = {
        class?: T extends WithLifecycle<HTMLElement> ? string | Signal<string> : string
        id?: string | Signal<string>
        style?: T extends WithLifecycle<HTMLElement> ? string | Signal<string> : string
        title?: string | Signal<string>
        form?: T extends WithLifecycle<HTMLElement> ? string | Signal<string> : string
    } & {
        [K in keyof ARIAMixin as ToKebabCase<K>]?: T extends WithLifecycle<HTMLElement> ?
            ARIAMixin[K] | Signal<ARIAMixin[K]>
        :   ARIAMixin[K]
    } & {
        [key: string]: DefaultAttributeValue<T>
    }

    type DefaultAttributeValue<T extends Element> =
        | string
        | number
        | boolean
        | bigint
        | null
        | (T extends WithLifecycle<HTMLElement> ? Signal<DefaultAttributeValue<T>>
          :   never)

    export type Proxy<T extends WithLifecycle<HTMLElement>> = Builder<T> & {
        [K in keyof T as true extends (
            [IsEventHandler<T, K>, Not<IsFunction<T[K]>> & Not<IsReadonly<T, K>>][number]
        ) ?
            K
        :   never]: T[K] extends (...args: infer Args) => void ?
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
    | Builder<WithLifecycle<HTMLElement>>
    | MemberOf<T>[]
    | Signal<MemberOf<T>>
