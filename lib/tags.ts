import type { StrictARIA } from "./aria.ts";
import { computed, Signal } from "./signals.ts";
import type { _Event, Equal, Extends, Fn, If, IsFunction, IsNullable, IsReadonly, Not } from "./utils.ts";
import { instancesOf } from "./utils.ts";

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
    get: (tags: any, tag: string, constructor: any) => (tags[tag] ??= (customElements.define(
        `pure-${tag}`,
        (constructor = class extends WithLifecycle(document.createElement(tag).constructor as any) {}) as never,
        { extends: tag },
    ),
        (attributes: Builder.Attributes<any> = {}) => new Builder(new constructor(), attributes))),
});

export type Tags = {
    [K in keyof HTMLElementTagNameMap]: (
        attributes?: Builder.Attributes<WithLifecycle<HTMLElementTagNameMap[K]>>,
    ) => Builder<WithLifecycle<HTMLElementTagNameMap[K]>>;
};

export namespace Builder {
    export namespace Attributes {
        export type Value<TElement extends Element, T> = TElement extends WithLifecycle ? T | Signal<T> : T;
    }
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
    export type Event<E extends _Event, T extends EventTarget> = E & { currentTarget: T };
}

/*
    if a function has `Node` as argument then that function can have a "$"" suffixed version.
    for example `.replaceChildren$()` that "$" tells runtime Proxy to convert Node like variables toto a Node value.
    on the type side these functions should also be typed accordingly to allow reccusrive Node like values.

    Seperaretly from that, Signals are only allowed with `WithLifecyle` mixin, and functions with single or spreding arguments.
*/

type IsProxyableProperty<T, K extends keyof T> = If<
    Not<Extends<K, keyof EventTarget>> & ((Not<IsReadonly<T, K>> & Not<IsFunction<T[K]>>) | (IsFunction<T[K]> & IsNullable<T[K]>))
>;

type IsReflectFunction<T, K extends keyof T> = If<
    & IsFunction<T[K]>
    & Extends<K, keyof Lifecycle>
>;

type IsProxyableFunction<T, K extends keyof T> = If<
    & Not<Extends<K, keyof EventTarget>>
    & (
        | IsFunction<T[K], void, (string | Node)[]>
        | IsFunction<T[K], void, []>
        | (T[K] extends (...args: infer A) => infer R ? Not<Extends<A, (object | null | undefined)[]>> & Equal<R, void> : false)
    )
>;

type IsProxyableNodeFunction<T, K extends keyof T> = If<IsProxyableFunction<T, K> & IsFunction<T[K], void, (string | Node)[]>>;

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

type ProxyPropertyArg<T extends Node, K extends keyof T> = NonNullable<T[K]> extends (this: infer X, event: infer U) => infer R
    ? U extends Event ? (this: X, event: Builder.Event<U, T>) => R
    : T[K]
    : T extends WithLifecycle ? T[K] | Signal<T[K]>
    : T[K];

type ProxyFunctionArgs<T extends Node, K extends keyof T, Args extends unknown[] = T[K] extends (...args: infer U) => any ? U : never> =
    Args extends [] | [any, any, ...any] ? Args
        : T extends WithLifecycle ? RecursiveSignalArgs<Args>
        : Args;

type MaybeNodeLikeArg<T> = T extends Node ? T | Builder<T> | null : T extends string ? string | { toString(): string } : T;
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

type _ = Extract<{ a: 123; [key: string]: any }, { [key: `${any}${any}`]: any }>;

export type Builder<T extends Node = Node> =
    & {
        [K in keyof T as If<IsReflectFunction<T, K>, K>]: T[K] extends (...args: infer Args) => any ? (...args: Args) => Builder<T> : never;
    }
    & {
        [K in keyof T as If<IsProxyableProperty<T, K>, K>]: (value: ProxyPropertyArg<T, K>) => Builder<T>;
    }
    & {
        [K in keyof T as If<IsProxyableFunction<T, K>, K>]: (...args: ProxyFunctionArgs<T, K>) => Builder<T>;
    }
    & {
        [K in keyof T as If<IsProxyableNodeFunction<T, K>, `${K & string}$`>]: (...args: ProxyNodeFunctionArgs<T, K>) => Builder<T>;
    }
    & {
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

export let fragment = (...members: Parameters<Builder<DocumentFragment>["append"]>): Builder<DocumentFragment> =>
    new Builder(document.createDocumentFragment()).append(...members);

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
            node.$effect!(() => value.follow(setOrRemoveAttribute, true));
        } else {
            setOrRemoveAttribute(value);
        }
    }

    let cleanups: Partial<Record<PropertyKey, (() => void) | null>> = {};
    return new Proxy(this, {
        get: (target: any, targetName: string, proxy: unknown) => {
            let nodeName = (targetName.at(-1) == "$" ? targetName.slice(0, -1) : targetName) as keyof T & string;

            cleanups[targetName]?.();
            cleanups[targetName] = null;

            type Arg = null | Builder | Node | string | Arg[] | Signal<Arg>;

            return (target[targetName] ??= instancesOf(node[nodeName], Function) && !Object.hasOwn(node, nodeName)
                ? nodeName == targetName
                    ? (...args: unknown[]) => {
                        (node[nodeName] as Fn)(...args);
                        return proxy;
                    }
                    : (...args: Arg[]) => {
                        let hasSignal: boolean | undefined;
                        let unwrap = (value: Arg): string | Node => {
                            if (value == null) {
                                return unwrap([]);
                            }
                            if (instancesOf(value, Builder)) {
                                return value.$node;
                            }
                            if (instancesOf(value, Signal)) {
                                hasSignal = true;
                                return unwrap(value.val);
                            }
                            if (instancesOf(value, Array)) {
                                return unwrap(fragment(...value.map(unwrap)));
                            }
                            return value;
                        };

                        // This is the best i can come up with
                        // Normally if we had a persistent document fragment with lifecyle,
                        // we could have just wrapped signals with it in the DOM. Not doing these at all.
                        //
                        // I can wrap them with an element with lifecycle and give it `display:contents`,
                        // but that causes other issues in the dx
                        let unwrappedArgs = args.map(unwrap);
                        if (hasSignal) {
                            let computedArgs = computed(() => args.map(unwrap));
                            cleanups[targetName] = node.$effect!(() =>
                                computedArgs.follow((newArgs) => (node[nodeName] as Fn)(...newArgs), true)
                            );
                        } else {
                            (node[nodeName] as Fn)(...unwrappedArgs);
                        }

                        return proxy;
                    }
                : !(targetName in node)
                ? node[nodeName]
                : (value: unknown) => {
                    if (instancesOf(value, Signal)) {
                        cleanups[targetName] = node.$effect!(() => value.follow((value) => (node[nodeName] = value as never), true));
                    } else {
                        node[nodeName] = value as never;
                    }

                    return proxy;
                });
        },
    } as never);
} as never;

// Note: Lifecycle stuff can be removed or simplified once DOM has a nice and simple native event to follow life cycle of any Node sync.
//       It has to be a Node, that way we can even follow lifecycle of persistent DocumentFragment(s)
export namespace Lifecycle {
    export type OnDisconnected = () => void;
    export type OnConnected<T extends HTMLElement = HTMLElement> = (element: T) => void | OnDisconnected;
    export type OffConnected = () => void;
}
export type Lifecycle<T extends HTMLElement = HTMLElement> = {
    $effect(callback: Lifecycle.OnConnected<T>): Lifecycle.OffConnected;
};

export type WithLifecycle<T extends HTMLElement = HTMLElement> = T & Lifecycle<T>;

let withLifecycleCache = new Map<{ new (): HTMLElement }, { new (): WithLifecycle<HTMLElement> }>();
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
            } satisfies { new (): WithLifecycle<HTMLElement> },
        );
    }

    return constructor as never;
};
