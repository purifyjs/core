/**
 * @module DOM
 *
 * DOM Utility
 */

import type { StrictARIA } from "./aria.ts";
import { Signal } from "./signals.ts";
import type { Equal, Extends, Fn, If, IsReadonly, Not } from "./utils.ts";
import { instancesOf } from "./utils.ts";

// Embrace some optimal ugly code, if it makes the minified code smaller.

/**
 * Proxy object for building HTML elements.
 *
 * It separates attributes and properties.
 */
export let tags: Tags = new Proxy({} as any, {
    // Keep `any`(s) here, otherwise `tsc` and LSP gets slow as fuck
    get: (tags: any, tag: string, constructor: any) => (tags[tag] ??= (customElements.define(
        `pure-${tag}`,
        (constructor = class extends WithLifecycle(document.createElement(tag).constructor as any) {}) as never,
        { extends: tag },
    ),
        (attributes: Builder.Attributes<any> = {}) => new Builder(new constructor(), attributes))),
});

/**
 * Represents a set of HTML element builders.
 */
export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>,
    ) => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>;
};

/**
 * Builder namespace
 */
export namespace Builder {
    /**
     * Attributes namespace
     */
    export namespace Attributes {
        /**
         * Type for attribute value, which can be a signal if the element is of type WithLifecycle.
         */
        export type Value<TElement extends Element, T> = TElement extends WithLifecycle ? T | Signal<T> : T;
    }

    /**
     * Interface representing builder attributes.
     */
    export type Attributes<T extends Element> =
        & {
            class?: Attributes.Value<T, string | null>;
            id?: Attributes.Value<T, string | null>;
            style?: Attributes.Value<T, string | null>;
            title?: Attributes.Value<T, string | null>;
            form?: Attributes.Value<T, string | null>;
        }
        & {
            [K in keyof StrictARIA.Attributes]?: Attributes.Value<T, StrictARIA.Attributes[K]>;
        }
        & {
            [key: string]: Attributes.Value<T, string | null>;
        };

    /**
     * Type for builder event.
     */
    export type Event<E extends globalThis.Event, T extends EventTarget> = E & { currentTarget: T };
}

type IsProxyableProperty<T, K extends keyof T> = If<
    & Not<Extends<K, keyof EventTarget>>
    & (
        | (
            & Not<IsReadonly<T, K>>
            & Not<Extends<T[K], Fn>>
        )
        | (Extends<T[K], Fn> & Extends<null, T[K]>)
    )
>;

type IsReflectFunction<T, K extends keyof T> = If<
    & Extends<T[K], Fn>
    & Extends<K, keyof Lifecycle>
>;

type IsProxyableFunction<T, K extends keyof T> = If<
    & Not<Extends<K, keyof EventTarget>>
    & ((T[K] extends (...args: infer Args) => infer Return ? Equal<Return, void> : false))
>;

/*
    if a function has `Node` as argument then that function can have a "$"" suffixed version.
    for example `.append$()` that "$" tells runtime Proxy to convert Node like variables to a Node value.
    on the type side these functions should also be typed accordingly to allow reccusrive Node like values.
*/
type IsProxyableNodeFunction<T, K extends keyof T> = If<
    & IsProxyableFunction<T, K>
    & ((T[K] extends (...args: infer Args) => infer Return ?
            & Not<Equal<Args, []>>
            & (Not<Extends<Exclude<Args[number], Node>, (object | null | undefined)>> | Extends<Args, (Node | string | null)[]>)
            & Extends<Args[number], Node>
        : false))
>;

type RecursiveArrayOf<T> = T | RecursiveArrayOf<T>[];
type RecursiveArrayArgs<Args extends unknown[], R extends unknown[] = []> = Args extends [infer Head, ...infer Tail]
    ? RecursiveArrayArgs<Tail, [...R, RecursiveArrayOf<Head>]>
    : Args extends (infer U)[] ? RecursiveArrayOf<U>[]
    : R;

type RecursiveSignalOf<T> = T | Signal<RecursiveSignalOf<T>>;
type RecursiveSignalArgs<Args extends unknown[], R extends unknown[] = []> = Args extends [infer Head, ...infer Tail]
    ? RecursiveSignalArgs<Tail, [...R, RecursiveSignalOf<Head>]>
    : Args extends (infer U)[] ? RecursiveSignalOf<U>[]
    : R;

type RecursiveSignalAndArrayOf<T> = T | Signal<RecursiveSignalAndArrayOf<T>> | RecursiveSignalAndArrayOf<T>[];
type RecursiveSignalAndArrayArgs<Args extends unknown[], R extends unknown[] = []> = Args extends [infer Head, ...infer Tail]
    ? RecursiveSignalAndArrayArgs<Tail, [...R, RecursiveSignalAndArrayOf<Head>]>
    : Args extends (infer U)[] ? RecursiveSignalAndArrayOf<U>[]
    : R;

/*
    Signals are only allowed with `WithLifecyle` mixin.
*/
type ProxyPropertyArg<T extends Node, K extends keyof T> = NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R
    ? U extends Event ? (this: X, event: Builder.Event<U, T>) => R
    : T[K]
    : T extends WithLifecycle ? T[K] | Signal<T[K]>
    : T[K];

type ProxyFunctionArgs<T extends Node, K extends keyof T, Args extends unknown[] = T[K] extends (...args: infer U) => any ? U : never> =
    Args;

type MaybeNodeLikeArg<T> = T extends Node ? T | Builder<T> | null | undefined
    : T extends string ? string | { toString(): string } | null | undefined
    : T;
type MaybeNodeLikeArgs<Args extends unknown[], R extends unknown[] = []> = Args extends [infer Head, ...infer Tail]
    ? MaybeNodeLikeArgs<Tail, [...R, MaybeNodeLikeArg<Head>]>
    : Args extends (infer U)[] ? MaybeNodeLikeArg<U>[]
    : R;

type ProxyNodeFunctionArgs<
    T extends Node,
    K extends keyof T,
    Args extends unknown[] = T[K] extends (...args: infer U) => any ? MaybeNodeLikeArgs<U> : never,
> = Args extends [] | [any, any, ...any] ? RecursiveArrayArgs<Args>
    : T extends WithLifecycle ? RecursiveSignalAndArrayArgs<Args>
    : RecursiveArrayArgs<Args>;

type MapStrictAriaProperties<T> = {
    [K in keyof T]: K extends keyof StrictARIA.Properties ? StrictARIA.Properties[K] : T[K];
};

type BuilderProxy<T extends Node> =
    & {
        [K in keyof T as If<IsProxyableProperty<T, K>, K>]: (value: ProxyPropertyArg<T, K>) => Builder<T>;
    }
    & {
        [K in keyof T as If<IsReflectFunction<T, K>, K>]: T[K] extends (...args: infer Args) => any ? (...args: Args) => Builder<T> : never;
    }
    & {
        [K in keyof T as If<IsProxyableFunction<T, K>, K>]: (...args: ProxyFunctionArgs<T, K>) => Builder<T>;
    }
    & {
        [K in keyof T as If<IsProxyableNodeFunction<T, K>, `${K & string}$`>]: (...args: ProxyNodeFunctionArgs<T, K>) => Builder<T>;
    };

/**
 * Builder for a DOM Node
 *
 * @template T - The type of the node being built.
 */
export type Builder<T extends Node = Node> = BuilderProxy<MapStrictAriaProperties<T>> & {
    $node: T;
};

/**
 * Interface for constructing builders that wrap DOM nodes and provide a fluent API
 * for setting attributes, properties, and event handlers.
 */
export interface BuilderConstructor {
    new <T extends Element>(node: T, attributes?: Builder.Attributes<T>): Builder<T>;
    new <T extends Node>(node: T): Builder<T>;
    new (node: Node): Builder<Node>;
}

// NOTE: Builder unwrapping logic and `$node` can be removed once DOM has a native way to have Node like objects with something like toNode() or Symbol.toNode

/**
 * Constructor function for creating builder instances that wrap DOM nodes.
 *
 * @template T - The type of the node being built, which extends `Node` and optionally includes lifecycle methods.
 */
export let Builder: BuilderConstructor = function <T extends Node & Partial<WithLifecycle>>(
    this: Builder<T>,
    node: T,
    attributes: Record<string, unknown> = {},
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
            node.$bind!(() => value.follow(setOrRemoveAttribute, true));
        } else {
            setOrRemoveAttribute(value);
        }
    }

    let cleanups: Partial<Record<PropertyKey, (() => void) | null>> = {};

    return new Proxy(this, {
        get: (target: any, targetName: string, proxy: any) => {
            let nodeName: keyof T & string;
            let fn: Fn;

            if (targetName in target) {
                return target[targetName];
            }

            nodeName = (targetName.at(-1) == "$" ? (targetName.slice(0, -1)) : targetName) as never;

            if ((nodeName in node)) {
                return node[nodeName];
            }

            fn = (instancesOf(node[nodeName], Function) && !Object.hasOwn(node, nodeName))
                ? (nodeName == targetName)
                    ? (args: unknown[]) => (node[nodeName] as Fn)(...args)
                    : ((args: Member[]) => (node[nodeName] as Fn)(...args.map(toChild)))
                : (([value]: [unknown]) => {
                    if (instancesOf(value, Signal)) {
                        cleanups[targetName] = node.$bind!(() => value.follow((value) => node[nodeName] = value as never, true));
                    } else {
                        node[nodeName] = value as never;
                    }
                });

            return target[targetName] = (...args: unknown[]) => {
                cleanups[targetName]?.();
                cleanups[targetName] = null;

                fn(args);

                return proxy;
            };
        },
    } as never);
} as never;

// Note: Lifecycle stuff can be removed or simplified once DOM has a nice and simple native event to follow life cycle of any Node sync.
//       It has to be a Node, that way we can even follow lifecycle of persistent DocumentFragment(s)
//       The way we do Lifecycle might also change once we have Custom Attributes

/**
 * Lifecycle management interface for elements.
 */
export type Lifecycle<T extends HTMLElement = HTMLElement> = {
    /**
     * Binds a callback to the element's lifecycle events.
     *
     * @param callback - The callback function to be called when the element is connected.
     * @returns A function that can be used to remove the connection callback.
     */
    $bind(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected;
};

/**
 * Lifecycle namespace
 */
export namespace Lifecycle {
    /**
     * Callback for when an element is disconnected.
     */
    export type OnDisconnected = () => void;

    /**
     * Callback for when an element is connected, which can return a disconnection callback.
     */
    export type OnConnected<T extends HTMLElement = HTMLElement> = (element: T) => void | OnDisconnected;

    /**
     * Function to remove a connection callback.
     */
    export type OffConnected = () => void;
}

/**
 * Interface representing an HTML element with lifecycle management.
 */
export type WithLifecycle<T extends HTMLElement = HTMLElement> = T & Lifecycle<T>;

let withLifecycleCache = new WeakMap<{ new (): HTMLElement }, { new (): WithLifecycle<HTMLElement> }>();

/**
 * Mixes lifecycle management into a custom HTML element class.
 *
 * @param Base - The base class to be extended.
 * @returns A new class that extends the base class and includes lifecycle methods.
 */
export let WithLifecycle = <BaseConstructor extends { new (...params: any[]): HTMLElement }>(
    Base: BaseConstructor,
): {
    new (...params: ConstructorParameters<BaseConstructor>): WithLifecycle<InstanceType<BaseConstructor>>;
} => {
    type Base = HTMLElement;
    let constructor = withLifecycleCache.get(Base);

    if (!constructor) {
        withLifecycleCache.set(
            Base,
            constructor = class extends Base implements Lifecycle<Base> {
                #callbacks = new Map<Lifecycle.OnConnected<Base>, ReturnType<Lifecycle.OnConnected<Base>> | null>();

                connectedCallback(): void {
                    this.#callbacks.forEach((_, callback) => this.#callbacks.set(callback, callback(this)));
                }

                disconnectedCallback(): void {
                    this.#callbacks.forEach((disconnectedCallbackOrNullish) => disconnectedCallbackOrNullish?.());
                }

                $bind(callback: Lifecycle.OnConnected<Base>): Lifecycle.OffConnected {
                    this.#callbacks.set(callback, null);
                    return () => {
                        let off = this.#callbacks.get(callback);
                        this.#callbacks.delete(callback);
                        off?.();
                    };
                }
            } satisfies { new (): WithLifecycle<HTMLElement> },
        );
    }

    return constructor as never;
};

/**
 * Represents a type that can be converted into a `Node` or `string`,
 * including recursive signals and arrays of such elements.
 */
export type Member = RecursiveSignalAndArrayOf<MaybeNodeLikeArg<Node | string>>;
export let toChild = (member: Member): string | Node => {
    if (instancesOf(member, Builder)) {
        return member.$node;
    }
    if (instancesOf(member, Signal)) {
        return toChild(
            tags.div({ style: "display:contents" })
                .$bind((element) => member.follow((value) => element.replaceChildren(toChild(value)), true)),
        );
    }
    if (instancesOf(member, Array)) {
        return toChild(new Builder(document.createDocumentFragment()).append(...member.map(toChild) as never[]));
    }
    return (member ?? "" satisfies { toString(): string }) as string;
};
