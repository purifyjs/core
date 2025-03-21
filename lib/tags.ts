/* eslint-disable @typescript-eslint/no-explicit-any */

import { computed, Signal } from "./signals"
import { _Event, Fn, If, IsFunction, IsNullable, IsReadonly, Not } from "./utils"

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
    get: (tags: any, tag: string, constructor: any) =>
        (tags[tag] ??=
            (customElements.define(
                `pure-${tag}`,
                (constructor = class extends WithLifecycle(document.createElement(tag).constructor as any) {}) as never,
                { extends: tag }
            ),
            () => new (Builder as any)(new constructor())))
})

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: () => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>
}

export type BuilderConstructor = {
    new <T extends Node>(node: T): Builder<T>
    new (node: Node): Builder<Node>
}

export namespace Builder {
    export type Event<E extends _Event, T extends EventTarget> = E & { currentTarget: T }
}

type IsProxyable<T, K extends keyof T> =
    K extends keyof EventTarget ? false
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

type MapProxyArgs<T extends any[], N extends Node, R extends any[] = []> =
    T extends [infer Head, ...infer Tail] ?
        MapProxyArgs<
            Tail,
            N,
            [...R, Head | Builder<Extract<Head, Node>> | (N extends WithLifecycle<HTMLElement> ? Signal<Head> : never)]
        >
    : R extends [] ?
        T extends (infer Arr)[] ?
            MapProxyArgs<[Arr], N>[0][]
        :   R
    :   R

export type Builder<T extends Node> = { $node: T } & {
    [K in keyof T as If<IsProxyable<T, K>, K>]: K extends `$${any}` ? T[K]
    : T[K] extends (this: infer X, ...args: infer Args) => void ?
        (this: X, ...args: MapProxyArgs<Args, T>) => Builder<T>
    :   (
            value: NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R ?
                U extends Event ?
                    (this: X, event: Builder.Event<U, T>) => R
                :   T[K]
            : T extends WithLifecycle<HTMLElement> ? T[K] | Signal<T[K]>
            : T[K]
        ) => Builder<T>
}

export let Builder: BuilderConstructor = function <T extends Node & Partial<WithLifecycle<HTMLElement>>>(
    this: Builder<T>,
    element: T
) {
    this.$node = element
    return new Proxy(this, {
        get: (target: any, name: keyof T, proxy: unknown) =>
            (target[name] ??=
                name in element ?
                    instancesOf(element[name], Function) && !element.hasOwnProperty(name) ?
                        (...args: unknown[]) => {
                            let hasSignal: boolean | undefined
                            args.forEach((arg, index) => {
                                if (instancesOf(arg, Builder)) {
                                    args[index] = arg.$node
                                } else {
                                    hasSignal ||= instancesOf(arg, Signal)
                                }
                            })
                            if (hasSignal) {
                                let computedArgs = computed(() =>
                                    args.map((arg) => (instancesOf(arg, Signal) ? arg.val : arg))
                                )
                                element.$effect!(() =>
                                    computedArgs.follow((args) => (element[name] as Fn)(...args), true)
                                )
                            } else {
                                ;(element[name] as Fn)(...args)
                            }
                            return proxy
                        }
                    :   (value: unknown) => {
                            if (instancesOf(value, Signal)) {
                                element.$effect!(() => value.follow((value) => (element[name] = value as never), true))
                            } else {
                                element[name] = value as never
                            }

                            return proxy
                        }
                :   undefined)
    } as never)
} as never

export namespace Lifecycle {
    export type OnDisconnected = () => void
    export type OnConnected<T extends HTMLElement = HTMLElement> = (element: T) => void | OnDisconnected
    export type OffConnected = () => void
}

export type WithLifecycle<T extends HTMLElement> = T & {
    $effect(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected
}

let withLifecycleCache = new Map<{ new (): HTMLElement }, { new (): WithLifecycle<HTMLElement> }>()
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

                $effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected {
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
