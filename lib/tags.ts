/* eslint-disable @typescript-eslint/no-explicit-any */

import { StrictARIA } from "./aria";
import { computed, Signal } from "./signals";
import { _Event, Fn, If, instancesOf, IsFunction, IsNullable, IsReadonly, Not } from "./utils";

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
    // Keep `any`(s) here, otherwise `tsc` and LSP gets slow as fuck
    get: (tags: any, tag: string, constructor: any) =>
        (tags[tag] ??=
            (customElements.define(
                `pure-${tag}`,
                (constructor = class extends WithLifecycle(document.createElement(tag).constructor as any) {}) as never,
                { extends: tag }
            ),
            (attributes: Builder.Attributes<any> = {}) => new Builder(new constructor(), attributes)))
});

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>
    ) => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>;
};

export namespace Builder {
    export namespace Attributes {
        export type Value<TElement extends Element, T> =
            TElement extends WithLifecycle<HTMLElement> ? T | Signal<T> : T;
    }
    export type Attributes<T extends Element> = {
        class?: Attributes.Value<T, string | null>;
        id?: Attributes.Value<T, string | null>;
        style?: Attributes.Value<T, string | null>;
        title?: Attributes.Value<T, string | null>;
        form?: Attributes.Value<T, string | null>;
    } & {
        [K in keyof StrictARIA.Attributes]?: Attributes.Value<T, StrictARIA.Attributes[K]>;
    } & {
        [key: string]: Attributes.Value<T, string | null>;
    };
    export type Event<E extends _Event, T extends EventTarget> = E & { currentTarget: T };
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
        ][number];

type DeeplyNestedArray<T> =
    | T
    | T[]
    | T[][]
    | T[][][]
    | T[][][][]
    | T[][][][][]
    | T[][][][][][]
    | T[][][][][][][]
    | T[][][][][][][][]
    | unknown[][][][][][][][][];
type DeeplyNestedSignal<T> =
    | Signal<T>
    | Signal<Signal<T>>
    | Signal<Signal<Signal<T>>>
    | Signal<Signal<Signal<Signal<T>>>>
    | Signal<Signal<Signal<Signal<Signal<T>>>>>
    | Signal<Signal<Signal<Signal<Signal<Signal<T>>>>>>
    | Signal<Signal<Signal<Signal<Signal<Signal<Signal<T>>>>>>>
    | Signal<Signal<Signal<Signal<Signal<Signal<Signal<Signal<T>>>>>>>>
    | Signal<Signal<Signal<Signal<Signal<Signal<Signal<Signal<Signal<unknown>>>>>>>>>;

// While proxying functions to support Signal args, make sure it only has one arg or multiple of same spreding argument.
// Since we have to cleanup the previous set of the signal, before we set it second time we shouldn't support things like `.setAttribute`.
// It seems OK at first but since we have to cleanup, second time we call `setAttribute` it cleans up the previous call.
// Makes it not able to use `setAttribute` for multiple attributes, which is a weird beheviour.
type MaybeWrappedNode<T> =
    Extract<T, Node> extends Node ?
        | Builder<Extract<T, Node>>
        | (Node extends Extract<T, Node> ? DeeplyNestedArray<T | Builder<Extract<T, Node>>> : never)
    :   never;
type ProxyFunctionCallArgs_Map<Args extends unknown[], R extends unknown[] = []> =
    Args extends [infer Head, ...infer Tail] ? ProxyFunctionCallArgs_Map<Tail, [...R, Head | MaybeWrappedNode<Head>]>
    :   R;
type ProxyFunctionCallArgs<T extends Node, Args extends unknown[]> =
    Args extends [any, any, ...any] ? ProxyFunctionCallArgs_Map<Args>
    : Args extends [infer U] ?
        [
            | U
            | MaybeWrappedNode<U>
            | (T extends WithLifecycle<HTMLElement> ? DeeplyNestedArray<DeeplyNestedSignal<U | MaybeWrappedNode<U>>>
              :   never)
        ]
    : Args extends (infer U)[] ?
        [U] extends [never] ?
            []
        :   (
                | U
                | MaybeWrappedNode<U>
                | (T extends WithLifecycle<HTMLElement> ? DeeplyNestedArray<DeeplyNestedSignal<U | MaybeWrappedNode<U>>>
                  :   never)
            )[]
    :   never;

type ProxyValueSetterArg<T extends Node, K extends keyof T> =
    NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R ?
        U extends Event ?
            (this: X, event: Builder.Event<U, T>) => R
        :   T[K]
    : T extends WithLifecycle<HTMLElement> ? T[K] | Signal<T[K]>
    : T[K];

export type Builder<T extends Node> = {
    [K in keyof T as If<IsProxyable<T, K>, K>]: T[K] extends (...args: infer Args) => void ?
        (...args: K extends `$${any}` ? Args : ProxyFunctionCallArgs<T, Args>) => Builder<T>
    :   (value: ProxyValueSetterArg<T, K>) => Builder<T>;
} & {
    $node: T;
};

export interface BuilderConstructor {
    new <T extends Element>(node: T, attributes?: Builder.Attributes<T>): Builder<T>;
    new <T extends Node>(node: T): Builder<T>;
    new (node: Node): Builder<Node>;
}

// NOTE: Builder unwrapping logic and `$node` can be removed once DOM has a native way to have Node like objects with something like toNode() or Symbol.toNode
// NOTE: Before signals had their own wrappers with 'display:contents' style. Which was letting us update signals on the DOM without updating sibilings on the DOM.
//          But it was causing problems with CSS selectors.
//          So instead I simplified it and used .replaceChildren() method to update all children at once.
//          Signals can have their own wrappers again when JS DOM has a real DocumentFragment which is persistent.

let unwrap = (value: unknown): unknown => {
    if (instancesOf(value, Builder)) {
        return value.$node;
    }
    if (instancesOf(value, Signal)) {
        return unwrap(value.val);
    }
    if (instancesOf(value, Array)) {
        return new Builder(document.createDocumentFragment()).append(...(value.map(unwrap) as never[])).$node;
    }
    return value;
};

export let Builder: BuilderConstructor = function <T extends Node & Partial<WithLifecycle<HTMLElement>>>(
    this: Builder<T>,
    node: T,
    attributes: Record<string, unknown> = {}
) {
    this.$node = node;

    // Attributes (maybe with Signal(s)) are only allowed to be set at startup,
    // otherwise we have to do cleanups, which compilicates the code.
    for (let name in attributes) {
        let value = attributes[name];

        let setOrRemoveAttribute = (value: any) => {
            if (value == null) {
                node.removeAttribute!(name);
            } else {
                node.setAttribute!(name, value);
            }
        };

        if (instancesOf(value, Signal)) {
            node.$effect!(() => value.follow(setOrRemoveAttribute, true));
        } else {
            setOrRemoveAttribute(value);
        }
    }

    let cleanups: Partial<Record<PropertyKey, (() => void) | null>> = {};
    return new Proxy(this, {
        get: (target: any, name: keyof T, proxy: unknown) => {
            cleanups[name]?.();
            cleanups[name] = null;

            if (target[name]) {
                return target[name];
            }

            if (!(name in node)) {
                return node[name];
            }

            if (instancesOf(node[name], Function) && !node.hasOwnProperty(name)) {
                return (target[name] = (...args: unknown[]) => {
                    if (args.some((arg) => instancesOf(arg, Signal))) {
                        let argsComputed = computed(() => args.map(unwrap));
                        cleanups[name] = node.$effect!(() =>
                            argsComputed.follow((args) => (node[name] as Fn)(...args), true)
                        );
                    } else {
                        args.forEach((arg, index) => (args[index] = unwrap(arg)));
                        (node[name] as Fn)(...args);
                    }
                    return proxy;
                });
            }

            return (target[name] = (value: unknown) => {
                if (instancesOf(value, Signal)) {
                    cleanups[name] = node.$effect!(() => value.follow((value) => (node[name] = value as never), true));
                } else {
                    node[name] = value as never;
                }

                return proxy;
            });
        }
    } as never);
} as never;

// Note: Lifecycle stuff can be removed or simplified once DOM has a nice and simple native event to follow life cycle of any Node sync.
//       It has to be a Node, that way we can even follow lifecycle of persistent DocumentFragment(s)
export namespace Lifecycle {
    export type OnDisconnected = () => void;
    export type OnConnected<T extends HTMLElement = HTMLElement> = (element: T) => void | OnDisconnected;
    export type OffConnected = () => void;
}
export type Lifecycle<T extends HTMLElement> = {
    $effect(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected;
};

export type WithLifecycle<T extends HTMLElement> = T & Lifecycle<T>;

let withLifecycleCache = new Map<{ new (): HTMLElement }, { new (): WithLifecycle<HTMLElement> }>();
export let WithLifecycle = <BaseConstructor extends { new (...params: any[]): HTMLElement }>(
    Base: BaseConstructor
): {
    new (...params: ConstructorParameters<BaseConstructor>): WithLifecycle<InstanceType<BaseConstructor>>;
} => {
    type Base = HTMLElement;
    let constructor = withLifecycleCache.get(Base);

    if (!constructor) {
        withLifecycleCache.set(
            Base,
            (constructor = class extends Base implements Lifecycle<Base> {
                #callbacks = new Map<Lifecycle.OnConnected<Base>, ReturnType<Lifecycle.OnConnected<Base>> | null>();

                connectedCallback(): void {
                    this.#callbacks.keys().forEach((callback) => this.#callbacks.set(callback, callback(this)));
                }

                disconnectedCallback(): void {
                    this.#callbacks.forEach((disconnectedCallbackOrNullish) => disconnectedCallbackOrNullish?.());
                }

                $effect(callback: Lifecycle.OnConnected<Base>): Lifecycle.OffConnected {
                    this.#callbacks.set(callback, null);
                    return () => {
                        let off = this.#callbacks.get(callback);
                        this.#callbacks.delete(callback);
                        off?.();
                    };
                }
            } satisfies { new (): WithLifecycle<HTMLElement> })
        );
    }

    return constructor as never;
};
