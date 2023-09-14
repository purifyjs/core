/* 
	All core functionality is in one file, so internal stuff can be isolated
	Code in this file should be as small and as optimized as much as posibble
	While keeping the readablity in an optimum level 
*/

let doc = (typeof window === "undefined" ? null : document) as Document
let isFunction = (value: any): value is Function => typeof value === "function"
let isArray = (value: unknown): value is unknown[] => Array.isArray(value)
let weakMap = WeakMap
let startsWith = <const T extends string>(text: string, start: T): text is `${T}${string}` => text.startsWith(start)
let timeout = setTimeout
let createComment = (...args: Parameters<typeof document.createComment>) => doc.createComment(...args)
let clearBetween = (start: Node, end: Node) => {
	while (start.nextSibling !== end) start.nextSibling![REMOVE]()
}
let nextSibling = (node: ChildNode) => node.nextSibling
let FOR_EACH = "forEach" as const
let REMOVE = "remove" as const

export namespace Lifecycle {
	export type OnConnected = () => void | Cleanup
	export type Cleanup = () => void
	export type Item = [Lifecycle.OnConnected, Lifecycle.Cleanup] | [Lifecycle.OnConnected]
}

let lifecycleListeners = new weakMap<Node, Lifecycle.Item[]>()
export let onConnected$ = <T extends Node>(node: T, listener: Lifecycle.OnConnected): void => {
	let lifecycleItem: Lifecycle.Item = [() => (lifecycleItem[1] = listener()!)]
	node.isConnected && lifecycleItem[0]()
	lifecycleListeners.get(node)?.push(lifecycleItem) ?? lifecycleListeners.set(node, [lifecycleItem])
}

if (doc) {
	let callFnOnTree = (node: Node, tupleIndex: Utils.Subtract<Lifecycle.Item["length"], 1>): void => {
		if (tupleIndex === 0 && !node.isConnected) return
		lifecycleListeners.get(node)?.[FOR_EACH]((callbacks) => callbacks[tupleIndex]?.())
		Array.from((node as Element).shadowRoot?.childNodes ?? [])[FOR_EACH]((childNode) =>
			callFnOnTree(childNode, tupleIndex)
		)
		Array.from(node.childNodes)[FOR_EACH]((childNode) => callFnOnTree(childNode, tupleIndex))
	}

	let mutationObserver = new MutationObserver((mutations) =>
		mutations[FOR_EACH](
			(mutation) => (
				mutation.addedNodes[FOR_EACH]((addedNode) => callFnOnTree(addedNode, 0)),
				mutation.removedNodes[FOR_EACH]((removedNode) => callFnOnTree(removedNode, 1))
			)
		)
	)

	let observe = <T extends Node>(root: T): T => (
		mutationObserver.observe(root, {
			characterData: true,
			childList: true,
			subtree: true
		}),
		root
	)

	let ATTACH_SHADOW = "attachShadow" as const
	observe(doc)
	let elementAttachShadow = Element.prototype[ATTACH_SHADOW]
	Element.prototype[ATTACH_SHADOW] = function (this, ...args) {
		return observe(elementAttachShadow.apply(this, args))
	}
}

export type SignalOrValue<T> = T | Readonly<Signal<T>>
export type SignalOrValueOrFn<T> = SignalOrValue<T> | ((...args: unknown[]) => T)
export type SignalOrFn<T> = Readonly<Signal<T>> | ((...args: unknown[]) => T)
export interface Signal<T> {
	ref: T
	follow(follower: Signal.Follower<T>, options?: Signal.Follow.Options): Signal.Follow
	follow$<T extends Node>(node: T, ...args: Parameters<this["follow"]>): void
	ping(): void
	asReadonly(): Readonly<this>
}
export namespace Signal {
	export type Builder = <T>(initial: T, pong?: Pong<T>) => Signal<T>
	export type Pong<T> = (set: (value: T) => void) => (() => void) | void

	export type Follow = { unfollow: Unfollow }
	export type Unfollow = () => void
	export namespace Follow {
		export type Options = {
			mode?: typeof FOLLOW_MODE_ONCE | typeof FOLLOW_MODE_NORMAL | typeof FOLLOW_MODE_IMMEDIATE
		}
	}
	export type Follower<T> = (value: T) => void
}

let FOLLOW = "follow" as const
let FOLLOW$ = (FOLLOW + "$") as `${typeof FOLLOW}$`
let UNFOLLOW = ("un" + FOLLOW) as `un${typeof FOLLOW}`
let FOLLOW_MODE_ONCE = "once" as const
let FOLLOW_MODE_NORMAL = "normal" as const
let FOLLOW_MODE_IMMEDIATE = "immediate" as const

let FOLLOW_IMMEDIATE_OPTION = { mode: FOLLOW_MODE_IMMEDIATE } as const satisfies Signal.Follow.Options

let signals = new WeakSet<Signal<unknown>>()

export let isSignal: <U extends boolean = false>(
	value: any,
	castAsWritable?: U
) => value is U extends true ? Signal<unknown> : Readonly<Signal<unknown>> = (
	value: any
): value is Readonly<Signal<unknown>> => signals.has(value)

export let isSignalOrFn = <T>(value: any): value is SignalOrFn<T> => isSignal(value) || isFunction(value)

export let signalFrom = <T>(src: SignalOrFn<T>): Readonly<Signal<T>> => (isFunction(src) ? derive(src) : src)

export let signal: Signal.Builder = (currentValue, pong) => {
	type T = typeof currentValue

	let followers = new Set<Signal.Follower<T>>()

	let ping: Signal<T>["ping"] = () => followers[FOR_EACH]((follower) => follower(currentValue))
	let set = (value: T) => value !== currentValue && ((currentValue = value), ping())

	let cleanup: (() => void) | void
	let passive = () => cleanup && (cleanup(), (cleanup = void 0))
	let active = () => pong && !cleanup && (cleanup = pong(set))

	let self: Signal<T> = {
		set ref(value) {
			set(value)
		},
		get ref() {
			active(), timeout(() => followers.size || passive(), 5000)
			usedSignalsTail?.add(self)
			return currentValue
		},
		ping,
		[FOLLOW]: (follower, options = {}) => (
			active(),
			options.mode === FOLLOW_MODE_IMMEDIATE && follower(currentValue),
			followers.add(follower),
			{
				[UNFOLLOW]() {
					followers.delete(follower), followers.size || passive()
				}
			}
		),
		[FOLLOW$]: (node, ...args) => onConnected$(node, () => self[FOLLOW](...args)[UNFOLLOW]),
		asReadonly: () => self
	}
	signals.add(self)
	return self
}

let usedSignalsTail: Set<Signal<unknown>> | undefined
let callAndCaptureUsedSignals = <T, TArgs extends unknown[]>(
	fn: (...args: TArgs) => T,
	usedSignals?: Set<Signal<unknown>>,
	...args: TArgs
): T => {
	let userSignalsBefore = usedSignalsTail
	usedSignalsTail = usedSignals
	try {
		return fn(...args)
	} catch (error) {
		throw error
	} finally {
		usedSignalsTail = userSignalsBefore
	}
}

let deriveCache = new weakMap<Function, Signal<unknown>>()
export let derive = <T>(fn: () => T, staticDependencies?: readonly Signal<unknown>[]): Readonly<Signal<T>> => {
	let value = deriveCache.get(fn) as Signal<T> | undefined
	if (!value) {
		let dynamicDependencies: Set<Signal<unknown>> | undefined
		let dependencies = staticDependencies ?? (dynamicDependencies = new Set())
		let dependencyFollows = new weakMap<Signal<unknown>, Signal.Follow>()

		let update = () => (value!.ref = callAndCaptureUsedSignals(fn, dynamicDependencies))
		let scheduled = false
		let schedule = () =>
			scheduled || ((scheduled = true), timeout(() => scheduled && ((scheduled = false), update())))

		value = signal<T>(
			undefined!,
			() => (
				update(),
				dependencies[FOR_EACH]((dependency) => dependencyFollows.set(dependency, dependency[FOLLOW](schedule))),
				() => (
					(scheduled = false),
					dependencies[FOR_EACH]((dependency) => dependencyFollows.get(dependency)![UNFOLLOW]())
				)
			)
		)

		deriveCache.set(fn, value)
	}
	return value
}

let bindSignalAsFragment = <T>(signalOrFn: SignalOrFn<T>): DocumentFragment => {
	let start = createComment("")
	let end = createComment("")
	let signalFragment = fragment(start, end)

	// TODO: Make all of these smaller
	type Item = { v: unknown; s: Comment; e: Comment }
	let itemNodes = new weakMap<ChildNode, Readonly<Item>>()
	let createItem = (value: unknown, insertBefore: ChildNode): Readonly<Item> => {
		let itemStart = createComment("")
		let itemEnd = createComment("")

		let self: Item = {
			v: value,
			s: itemStart,
			e: itemEnd
		}
		itemNodes.set(itemStart, self)
		insertBefore.before(itemStart, toNode(value), itemEnd)

		return self
	}

	let removeItem = (item: Item) => {
		clearBetween(item.s, item.e)
		item.s[REMOVE]()
		item.e[REMOVE]()
	}

	// TODO: Someone help me make this shorter and more elegant
	// TODO: Welp
	let oldValue: unknown
	signalFrom(signalOrFn)[FOLLOW$](
		start,
		(value: T) => {
			if (!isArray(oldValue) || !isArray(value)) clearBetween(start, end)
			oldValue = value

			if (!isArray(value)) return end.before(toNode(value))

			let currentNode = nextSibling(start)!
			nextValue: for (let currentIndex = 0; currentIndex < value.length; currentIndex++) {
				let currentValue = value[currentIndex]
				let nextIndex = currentIndex + 1

				while (currentNode !== end) {
					let currentItem = itemNodes.get(currentNode)
					if (currentItem) {
						if (currentValue === currentItem.v) currentNode = nextSibling(currentItem.e)!
						else {
							let nextItem = itemNodes.get(nextSibling(currentItem.e)!)
							if (nextItem && currentValue === nextItem.v) {
								removeItem(currentItem)
								currentNode = nextSibling(nextItem.e)!
							} else {
								let newItem = createItem(currentValue, currentItem.s)
								nextIndex >= value.length || value[nextIndex] !== currentItem.v
									? (removeItem(currentItem), (currentNode = nextSibling(newItem.e)!))
									: ((currentIndex = nextIndex), (currentNode = nextSibling(currentItem.e)!))
							}
						}
						continue nextValue
					}
					currentNode = nextSibling(currentNode)!
				}
				createItem(currentValue, end)
			}

			currentNode !== end && (clearBetween(currentNode, end), currentNode[REMOVE]())
		},
		FOLLOW_IMMEDIATE_OPTION
	)

	return signalFragment
}

let toNode = (value: unknown): Node => {
	return value === null
		? fragment()
		: isArray(value)
		? fragment(...value.map(toNode))
		: value instanceof Node
		? value
		: isSignalOrFn(value)
		? bindSignalAsFragment(value)
		: doc.createTextNode(value + "")
}

export type Fragment = DocumentFragment & { append(...children: TagsNS.AcceptedChild[]): void }
export namespace Fragment {
	export type Builder = (...children: TagsNS.AcceptedChild[]) => Fragment
}
export let fragment: Fragment.Builder = (...children) => {
	let result = doc.createDocumentFragment()
	result.append(...children.map(toNode))
	return result
}

type InputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
type InputValueKeyMap<Type extends string> = Type extends keyof typeof inputValueKeyMap
	? (typeof inputValueKeyMap)[Type]
	: typeof VALUE
type InputValueTypeMap<Type extends string> = HTMLInputElement[InputValueKeyMap<Type>]

let CHECKED = "checked" as const
let VALUE = "value" as const
let VALUE_AS_NUMBER = (VALUE + "AsNumber") as `${typeof VALUE}AsNumber`
let VALUE_AS_DATE = (VALUE + "AsDate") as `${typeof VALUE}AsDate`
let inputValueKeyMap = {
	radio: CHECKED,
	checkbox: CHECKED,
	range: VALUE_AS_NUMBER,
	number: VALUE_AS_NUMBER,
	date: VALUE_AS_DATE,
	"datetime-local": VALUE_AS_DATE,
	month: VALUE_AS_DATE,
	time: VALUE_AS_DATE,
	week: VALUE_AS_DATE
} as const

let getInputValueKey = <Type extends keyof typeof inputValueKeyMap | (string & {})>(type: Type) =>
	(inputValueKeyMap[type as keyof typeof inputValueKeyMap] ?? VALUE) as never as InputValueKeyMap<Type>

export type TagsNS = {
	[K in keyof HTMLElementTagNameMap]: TagsNS.Builder<HTMLElementTagNameMap[K]>
} & {
	[unknownTag: string]: TagsNS.Builder<HTMLElement>
}
export namespace TagsNS {
	export type AcceptedChild = {} | null

	export type Attributes<
		T extends Element,
		TInputType extends HTMLInputElement["type"] = HTMLInputElement["type"]
	> = {
		[key: string]: unknown
	} & {
		class?: string
		style?: string
		title?: string
	} & {
		[K in `class:${string}`]?: SignalOrValueOrFn<boolean>
	} & (T extends HTMLElement
			? {
					[K in `style:${Utils.Kebab<
						Extract<keyof CSSStyleDeclaration, string>
					>}`]?: K extends `style:${Utils.Kebab<
						Extract<infer StyleKey extends keyof CSSStyleDeclaration, string>
					>}`
						? SignalOrValueOrFn<CSSStyleDeclaration[StyleKey]>
						: never
			  }
			: {}) & {
			[K in `on:${keyof HTMLElementEventMap}`]?: K extends `on:${infer EventName extends keyof HTMLElementEventMap}`
				? (event: HTMLElementEventMap[EventName]) => void
				: never
		} & {
			[K in `on:${string}`]?: (event: Event) => void
		} & (T extends InputElement
			? {
					type?: TInputType
					"bind:value"?: Signal<InputValueTypeMap<TInputType>>
			  }
			: {})

	export type Builder<T extends Element> = {
		<TInputType extends HTMLInputElement["type"]>(
			attributes?: Attributes<T, TInputType>,
			...children: AcceptedChild[]
		): T
	}
}
export let tagsNS = new Proxy(
	{},
	{
		get: (_, tagName: string) =>
			((...args: Parameters<TagsNS.Builder<HTMLElement>>) =>
				populate(doc.createElement(tagName), ...args)) as TagsNS.Builder<HTMLElement>
	}
) as TagsNS

let bindOrSet = <T>(element: Element, value: SignalOrValueOrFn<T>, then: (value: T) => void): void =>
	isSignalOrFn(value) ? signalFrom(value)[FOLLOW$](element, then, FOLLOW_IMMEDIATE_OPTION) : then(value)

let bindSignalAsValue = <T extends InputElement>(element: T, signal: Signal<InputValueTypeMap<T["type"]>>) => {
	onConnected$(element, () => {
		let onInput = (event: Event) => (signal.ref = (event.target as T)[getInputValueKey(element.type)])
		element.addEventListener("input", onInput)
		let follow = signal[FOLLOW](
			(value) => (element[getInputValueKey(element.type)] = value),
			FOLLOW_IMMEDIATE_OPTION
		)
		return () => (element.removeEventListener("input", onInput), follow[UNFOLLOW]())
	})
}

export let populate: {
	<T extends Element>(element: T, attributes?: TagsNS.Attributes<T>, ...children: TagsNS.AcceptedChild[]): T
	<T extends Node>(node: T, attributes?: Utils.EmptyObject, ...children: TagsNS.AcceptedChild[]): T
} = <T extends HTMLElement>(element: T, attributes?: TagsNS.Attributes<T>, ...children: TagsNS.AcceptedChild[]): T => (
	attributes &&
		Object.keys(attributes)[FOR_EACH]((key) =>
			key === (("bind:" + VALUE) as `bind:${typeof VALUE}`)
				? isSignal(attributes[key])
					? bindSignalAsValue(element as never, attributes[key] as never)
					: element.setAttribute(VALUE, attributes[key] + "")
				: startsWith(key, "style:")
				? bindOrSet(element, attributes[key], (value) => element.style?.setProperty(key.slice(6), value + ""))
				: startsWith(key, "class:")
				? bindOrSet(element, attributes[key], (value) => element.classList.toggle(key.slice(6), !!value))
				: startsWith(key, "on:")
				? element.addEventListener(key.slice(3), attributes[key] as EventListener)
				: bindOrSet(element, attributes[key], (value) => element.setAttribute(key, value + ""))
		),
	children?.[FOR_EACH]((child) => element.append(toNode(child))),
	element
)
