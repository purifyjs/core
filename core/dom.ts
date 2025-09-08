import { Sync } from "./signals.ts";
import type { StrictARIA } from "./strict/aria.ts";
import type { StrictDOM } from "./strict/dom.ts";
import type { Equal, Extends, Fn, If, IsReadonly, Not } from "./utils.ts";
import { instanceOf } from "./utils.ts";

// Embrace some optimally ugly code, if it makes the minified bundle smaller.
// Also, smaller minified size doesn't always mean smaller gzip size. Repeating phrases are compressed by gzip, even if they are long.

/*
    Future Notes:

    - Lifecycle stuff can be removed or simplified once DOM has a nice and simple native event to follow life cycle of any Node sync.
        It has to be a Node, that way we can even follow lifecycle of persistent DocumentFragment(s)
        The way we do Lifecycle might also change once we have Custom Attributes
    - Builder unwrapping logic and `$node` can be removed once DOM has a native way to have Node like objects with something like toNode() or Symbol.toNode

    - Signals are only allowed with `WithLifecyle` mixin.

    - if a function has `Node` as argument then that function can have a "$"" suffixed version.
        for example `.append$()` that "$" tells runtime Proxy to convert Node like variables to a Node value.
        on the type side these functions should also be typed accordingly to allow reccusrive Node like values.
*/

/**
 * A proxy object that creates enhanced HTML elements with lifecycle management.
 * Use this to create DOM elements in a fluent, chainable way with automatic signal handling.
 *
 * Each property of the `tags` object is a function that creates a specific HTML element.
 *
 * @example
 * ```ts
 * const { div, button, span } = tags;
 *
 * const container = div({ class: "container" })
 *   .append$(
 *     span().textContent("Hello"),
 *     button().textContent("Click me").onclick(() => alert("Clicked!"))
 *   );
 *
 * document.body.append(container.$node);
 * ```
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
 * Type that represents all available HTML element builders.
 * Each property is a function that creates a specific type of HTML element with lifecycle capabilities.
 */
export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>,
    ) => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>;
};

/**
 * Builder namespace containing types and utilities for the DOM building system.
 */
export namespace Builder {
    /**
     * Namespace for attribute-related types in the builder system.
     */
    export namespace Attributes {
        /**
         * Type for an attribute value, which can be either a direct value or a signal
         * (if the element has lifecycle capabilities).
         *
         * @template TElement The element type
         * @template T The value type
         */
        export type Value<TElement extends Element, T> = TElement extends WithLifecycle ? T | Sync<T> : T;
    }

    /**
     * Type representing the attributes object that can be passed when creating elements.
     * Includes standard HTML attributes, ARIA attributes, and allows for custom string attributes.
     *
     * @template T The element type
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
     * Type for events in the builder system, extending the standard DOM Event
     * with a strongly-typed currentTarget property.
     *
     * @template E The event type
     * @template T The target element type
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

type RecursiveSignalOf<T> = T | Sync<RecursiveSignalOf<T>>;
type RecursiveSignalArgs<Args extends unknown[], R extends unknown[] = []> = Args extends [infer Head, ...infer Tail]
    ? RecursiveSignalArgs<Tail, [...R, RecursiveSignalOf<Head>]>
    : Args extends (infer U)[] ? RecursiveSignalOf<U>[]
    : R;

type RecursiveSignalAndArrayOf<T> = T | Sync<RecursiveSignalAndArrayOf<T>> | RecursiveSignalAndArrayOf<T>[] | IteratorObject<T>;
type RecursiveSignalAndArrayArgs<Args extends unknown[], R extends unknown[] = []> = Args extends [infer Head, ...infer Tail]
    ? RecursiveSignalAndArrayArgs<Tail, [...R, RecursiveSignalAndArrayOf<Head>]>
    : Args extends (infer U)[] ? RecursiveSignalAndArrayOf<U>[]
    : R;

type ProxyPropertyArg<T extends Node, K extends keyof T> = NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R
    ? U extends Event ? (this: X, event: Builder.Event<U, T>) => R
    : T[K]
    : T extends WithLifecycle ? T[K] | Sync<T[K]>
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

type MapStrictProperties<T> = {
    [K in keyof T]: 0 extends 1 ? never // This line is here for better formatting
        : K extends keyof StrictARIA.Properties ? T extends Element ? StrictARIA.Properties[K] : T[K]
        : K extends "type" ? T extends HTMLInputElement ? StrictDOM.HTMLInputElementType : T[K]
        : T[K];
};

type BuilderProxy<T extends Node, U extends Node> =
    & {
        [K in keyof T as If<IsProxyableProperty<T, K>, K>]: (value: ProxyPropertyArg<T, K>) => Builder<U>;
    }
    & {
        [K in keyof T as If<IsReflectFunction<T, K>, K>]: T[K] extends (...args: infer Args) => any ? (...args: Args) => Builder<U> : never;
    }
    & {
        [K in keyof T as If<IsProxyableFunction<T, K>, K>]: (...args: ProxyFunctionArgs<T, K>) => Builder<U>;
    }
    & {
        [K in keyof T as If<IsProxyableNodeFunction<T, K>, `${K & string}$`>]: (...args: ProxyNodeFunctionArgs<T, K>) => Builder<U>;
    };

/**
 * A builder for DOM nodes that provides a fluent API for manipulating elements.
 * The Builder wraps a DOM node and adds chainable methods for setting properties,
 * attributes, event handlers, and managing child elements.
 *
 * Methods with a '$' suffix handle signals and arrays automatically.
 * Properties with a '$' prefix are custom additions to the standard DOM interface.
 *
 * @template T The type of the wrapped node.
 *
 * @property $node The actual DOM node being built.
 */
export type Builder<T extends Node = Node> = BuilderProxy<T extends Element ? MapStrictProperties<T> : T, T> & {
    /**
     * The underlying DOM node being managed by this builder.
     * Use this when you need to access the raw node, such as when appending to the document.
     */
    $node: T;
};

/**
 * Interface for the Builder constructor that creates builder instances around DOM nodes.
 */
export interface BuilderConstructor {
    /**
     * Creates a new builder for an Element, optionally with initial attributes.
     */
    new <T extends Element>(node: T, attributes?: Builder.Attributes<T>): Builder<T>;

    /**
     * Creates a new builder for any Node type.
     */
    new <T extends Node>(node: T): Builder<T>;

    /**
     * Generic Node builder constructor.
     */
    new (node: Node): Builder<Node>;
}

/**
 * Constructor function for creating builder instances that wrap DOM nodes.
 * The Builder provides a fluent interface for manipulating DOM elements
 * with automatic signal handling and lifecycle management.
 *
 * @template T - The type of the node being built
 * @param node - The DOM node to wrap
 * @param attributes - Optional initial attributes to set on the element
 *
 * @example
 * ```ts
 * // Create a div element with the Builder
 * const div = new Builder(document.createElement('div'))
 *   .className('container')
 *   .textContent('Hello world');
 *
 * // Access the underlying node
 * document.body.append(div.$node);
 * ```
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

        if (instanceOf(value, Sync)) {
            node.$bind!(() => value.follow(setOrRemoveAttribute, true));
        } else {
            setOrRemoveAttribute(value);
        }
    }

    let cleanups: Partial<Record<PropertyKey, (() => void) | null>> = {};

    return new Proxy(this, {
        get: (
            target: any,
            targetName: string,
            proxy: any,
        ) => {
            let nodeName: keyof T;
            let fn: Fn;

            if (targetName in target) {
                return target[targetName];
            }

            nodeName = (targetName.at?.(-1) == "$" ? (targetName.slice(0, -1)) : targetName) as never;

            if (!(nodeName in node)) {
                return node[nodeName];
            }

            fn = (instanceOf(node[nodeName], Function) && !Object.hasOwn(node, nodeName))
                ? (nodeName == targetName)
                    ? (args: unknown[]) => (node[nodeName] as Fn)(...args)
                    : ((args: Member[]) => (node[nodeName] as Fn)(...args.map(toChild)))
                : (([value]: [unknown]) => {
                    if (instanceOf(value, Sync)) {
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

/**
 * Interface for elements with lifecycle management capabilities.
 * Elements with lifecycle support can track when they are connected to
 * or disconnected from the DOM, enabling proper cleanup of resources.
 */
export type Lifecycle<T extends HTMLElement = HTMLElement> = {
    /**
     * Binds a callback to the element's lifecycle events.
     * The callback runs when the element is connected to the DOM.
     * If the callback returns a function, that function will run when the element is disconnected.
     *
     * @param callback - Function to call when the element connects to the DOM
     * @returns A function that can be called to manually remove the lifecycle binding
     *
     * @example
     * ```ts
     * div().$bind((element) => {
     *   console.log('Element connected!');
     *   return () => console.log('Element disconnected!');
     * });
     * ```
     */
    $bind(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected;
};

/**
 * Namespace containing types related to the lifecycle management system.
 */
export namespace Lifecycle {
    /**
     * Callback type for when an element is disconnected from the DOM.
     * Use this to clean up resources like event listeners, intervals, or subscriptions.
     */
    export type OnDisconnected = () => void;

    /**
     * Callback type for when an element is connected to the DOM.
     * Can optionally return a disconnection callback for cleanup.
     *
     * @template T The element type
     * @param element The element that was connected
     * @returns Optional cleanup function that runs on disconnection
     */
    export type OnConnected<T extends HTMLElement = HTMLElement> = (element: T) => void | OnDisconnected;

    /**
     * Function type to manually remove a connection callback.
     * Call this function to stop tracking a particular lifecycle binding.
     */
    export type OffConnected = () => void;
}

/**
 * Type representing an HTML element with added lifecycle management capabilities.
 * These elements can track when they are connected to or disconnected from the DOM.
 *
 * @template T The base HTML element type
 */
export type WithLifecycle<T extends HTMLElement = HTMLElement> = T & Lifecycle<T>;

let withLifecycleCache = new WeakMap<{ new (): HTMLElement }, { new (): WithLifecycle<HTMLElement> }>();

/**
 * Enhances an HTML element class with lifecycle management capabilities.
 * The resulting class can track when instances are connected to or disconnected from the DOM,
 * enabling proper setup and cleanup of resources like event listeners and signal subscriptions.
 *
 * @param Base - The base HTMLElement constructor to enhance
 * @returns A new constructor that extends the base class with lifecycle methods
 *
 * @example
 * ```ts
 * const LifecycleDiv = WithLifecycle(HTMLDivElement);
 * const div = new LifecycleDiv();
 * div.$bind((element) => {
 *   console.log('Connected!');
 *   return () => console.log('Disconnected!');
 * });
 * document.body.append(div);
 * ```
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
                    this.#callbacks.set(callback, this.isConnected ? callback(this) : null);
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
 * Represents a type that can be converted into a DOM Node or string.
 * This includes direct nodes, signals of nodes, arrays of nodes, and recursive combinations.
 * Used by methods with the '$' suffix to handle various input types.
 */
export type Member = RecursiveSignalAndArrayOf<MaybeNodeLikeArg<Node | string>>;

/**
 * Converts any supported value into a DOM Node or string that can be inserted into the DOM.
 * Handles:
 * - DOM Nodes directly
 * - Builder objects (extracts the node)
 * - Signals (wraps in a container with display:contents)
 * - Arrays (converts to DocumentFragment)
 * - Strings and objects with toString()
 *
 * This is used internally by methods with '$' suffix to handle diverse input types.
 *
 * @param member - The value to convert to a DOM-compatible child
 * @returns A string or Node that can be inserted into the DOM
 */
export let toChild = (member: Member): string | Node => {
    if (instanceOf(member, Builder)) {
        return member.$node;
    }

    if (instanceOf(member, Sync)) {
        return toChild(
            tags.div({ style: "display:contents" })
                .$bind((element) => member.follow((value) => element.replaceChildren(toChild(value)), true)),
        );
    }

    if (instanceOf(member, Array) || instanceOf(member, Iterator)) {
        return toChild(new Builder(document.createDocumentFragment()).append(...member.map(toChild)));
    }

    // All .append() like functions accepts { toString(): string }, but dom types act like they are not supported, so we just say its a "string" here.
    return (member ?? "") satisfies { toString(): string } as string | Node;
};
