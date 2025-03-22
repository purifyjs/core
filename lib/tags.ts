/* eslint-disable @typescript-eslint/no-explicit-any */

import { StrictARIA } from "./aria"
import { computed, Signal } from "./signals"
import { _Event, Fn, If, instancesOf, IsFunction, IsNullable, IsReadonly, noop, Not } from "./utils"

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
    get: (tags: any, tag: string, constructor: any) =>
        (tags[tag] ??=
            (customElements.define(
                `pure-${tag}`,
                (constructor = class extends WithLifecycle(document.createElement(tag).constructor as any) {}) as never,
                { extends: tag }
            ),
            (attributes = {}) => new (Builder as any)(new constructor()).attributes(attributes)))
})

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>
    ) => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>
}

export namespace Builder {
    export namespace Attributes {
        export type Value<TElement extends Element, T> = TElement extends WithLifecycle<HTMLElement> ? T | Signal<T> : T
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
        [key: string]: Attributes.Value<T, string | null>
    }
    export type Event<E extends _Event, T extends EventTarget> = E & { currentTarget: T }
}

type IsProxyable<T, K extends keyof T> =
    K extends keyof EventTarget | keyof BuilderConstructor["prototype"] ? false
    :   [
            // Anything part of the Lifecycle
            K extends Exclude<keyof WithLifecycle<HTMLElement>, keyof HTMLElement> ? true : false,
            // Any non readonly non functions, basically mutable values
            Not<IsReadonly<T, K>> & Not<IsFunction<T[K]>>,
            // Any nullable functions, basically mutable functions such as event listeners
            IsFunction<T[K]> & IsNullable<T[K]>,
            // Any function that returns void exclusivly
            IsFunction<T[K], void>
        ][number]

type DeeplyNestedSignal<T> =
    | Signal<T>
    | Signal<Signal<T>>
    | Signal<Signal<Signal<T>>>
    | Signal<Signal<Signal<Signal<T>>>>
    | Signal<Signal<Signal<Signal<Signal<unknown>>>>>

/* 
    While proxying functions to support Signal args, make sure it only has one arg or multiple of same spreding argument.
    Since we have to cleanup the previous set of the signal, before we set it second time we shouldn't support things like `.setAttribute`.
    It seems OK at first but since we have to cleanup, second time we call `setAttribute` it cleans up the previous call. so you can't use `setAttribute` for multiple attributes.
*/
type ProxyFunctionCallArgs<T extends Node, Args extends unknown[]> =
    Args extends [any, any, ...any] ? Args
    : Args extends [infer U] ?
        [U | Builder<Extract<U, Node>> | (T extends WithLifecycle<HTMLElement> ? DeeplyNestedSignal<U> : never)]
    : Args extends (infer U)[] ?
        (U | Builder<Extract<U, Node>> | (T extends WithLifecycle<HTMLElement> ? DeeplyNestedSignal<U> : never))[]
    :   never

type ProxyValueSetterArg<T extends Node, K extends keyof T> =
    NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R ?
        U extends Event ?
            (this: X, event: Builder.Event<U, T>) => R
        :   T[K]
    : T extends WithLifecycle<HTMLElement> ? T[K] | Signal<T[K]>
    : T[K]

export type Builder<T extends Node> = {
    [K in keyof T as If<IsProxyable<T, K>, K>]: K extends `$${any}` ? T[K]
    : T[K] extends (...args: infer Args) => void ? (...args: ProxyFunctionCallArgs<T, Args>) => Builder<T>
    : (value: ProxyValueSetterArg<T, K>) => Builder<T>
} & {
    $node: T
} & (T extends Element ?
        {
            attribute<K extends keyof Builder.Attributes<T>>(name: K, value: Builder.Attributes<T>[K]): Builder<T>
            attributes(attributes: Builder.Attributes<T>): Builder<T>
        }
    :   unknown)

export interface BuilderConstructor {
    new <T extends Node>(node: T): Builder<T>
    new (node: Node): Builder<Node>
}

export let Builder: BuilderConstructor = function <T extends Node & Partial<WithLifecycle<HTMLElement>>>(
    this: Builder<T>,
    element: T
) {
    let cleanups: Partial<Record<keyof T, () => void>> = {}
    this.$node = element
    return new Proxy(this, {
        get: (target: any, name: keyof T, proxy: unknown) => (
            cleanups[name]?.(),
            (cleanups[name] = noop),
            (target[name] ??=
                name in element ?
                    instancesOf(element[name], Function) && !element.hasOwnProperty(name) ?
                        (...args: unknown[]) => {
                            if (args.some((arg) => instancesOf(arg, Signal))) {
                                let unwrap = (value: unknown) => {
                                    if (instancesOf(value, Builder)) {
                                        return value.$node
                                    }
                                    if (instancesOf(value, Signal)) {
                                        return unwrap(value.val)
                                    }
                                    return value
                                }
                                let argsComputed = computed(() => args.map(unwrap))
                                cleanups[name] = element.$effect!(() =>
                                    argsComputed.follow((args) => (element[name] as Fn)(...args), true)
                                )
                            } else {
                                args.forEach((arg, index) => {
                                    if (instancesOf(arg, Builder)) {
                                        args[index] = arg.$node
                                    }
                                })
                                ;(element[name] as Fn)(...args)
                            }
                            return proxy
                        }
                    :   (value: unknown) => {
                            if (instancesOf(value, Signal)) {
                                cleanups[name] = element.$effect!(() =>
                                    value.follow((value) => (element[name] = value as never), true)
                                )
                            } else {
                                element[name] = value as never
                            }

                            return proxy
                        }
                :   target[name])
        )
    } as never)
} as never

export interface BuilderConstructor {
    prototype: {
        attribute(this: Builder<Element>, name: string, value: any): typeof this
        attributes(this: Builder<Element>, attributes: Record<string, any>): typeof this
    }
}

Builder.prototype = {
    attribute(name, value) {
        let node = this.$node as Element & Partial<WithLifecycle<HTMLElement>>
        let setOrRemoveAttribute = (value: any) => {
            if (value == null) {
                node.removeAttribute(name)
            } else {
                node.setAttribute(name, value)
            }
        }

        if (instancesOf(value, Signal)) {
            node.$effect!(() => value.follow(setOrRemoveAttribute, true))
        } else {
            setOrRemoveAttribute(value)
        }
        return this
    },
    attributes(attributes) {
        for (let name in attributes) {
            this.attribute(name, attributes[name])
        }
        return this
    }
}

export namespace Lifecycle {
    export type OnDisconnected = () => void
    export type OnConnected<T extends HTMLElement = HTMLElement> = (element: T) => void | OnDisconnected
    export type OffConnected = () => void
}
export type Lifecycle<T extends HTMLElement> = {
    $effect(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected
}

export type WithLifecycle<T extends HTMLElement> = T & Lifecycle<T>

let withLifecycleCache = new Map<{ new (): HTMLElement }, { new (): WithLifecycle<HTMLElement> }>()
export let WithLifecycle = <BaseConstructor extends { new (...params: any[]): HTMLElement }>(
    Base: BaseConstructor
): {
    new (...params: ConstructorParameters<BaseConstructor>): WithLifecycle<InstanceType<BaseConstructor>>
} => {
    type Base = HTMLElement
    let constructor = withLifecycleCache.get(Base)
    if (!constructor) {
        withLifecycleCache.set(
            Base,
            (constructor = class extends Base implements Lifecycle<Base> {
                #callbacks = new Map<Lifecycle.OnConnected<Base>, ReturnType<Lifecycle.OnConnected<Base>> | null>()

                connectedCallback(): void {
                    this.#callbacks.keys().forEach((callback) => this.#callbacks.set(callback, callback(this)))
                }

                disconnectedCallback(): void {
                    this.#callbacks.forEach((disconnectedCallbackOrNullish) => disconnectedCallbackOrNullish?.())
                }

                $effect(callback: Lifecycle.OnConnected<Base>): Lifecycle.OffConnected {
                    this.#callbacks.set(callback, null)
                    return () => {
                        let off = this.#callbacks.get(callback)
                        this.#callbacks.delete(callback)
                        off?.()
                    }
                }
            } satisfies { new (): WithLifecycle<HTMLElement> })
        )
    }
    return constructor as never
}
