export function addEventListener(
	element: HTMLElement,
	type: string,
	listener: (this: HTMLElement, ev: Event) => any,
	options?: boolean | AddEventListenerOptions
): void {
	return element.addEventListener(type, listener, options)
}

export function removeEventListener<K extends string>(
	element: HTMLElement,
	type: K,
	listener: (this: HTMLElement, ev: Event) => any,
	options?: boolean | EventListenerOptions
): void {
	return element.removeEventListener(type, listener, options)
}

export function querySelector(element: ParentNode, selector: string): Element | null {
	return element.querySelector(selector)
}

export function querySelectorAll(element: ParentNode, selector: string): NodeListOf<Element> {
	return element.querySelectorAll(selector)
}

export function setAttribute(element: Element, name: string, value: string): void {
	element.setAttribute(name, value)
}

export function removeAttribute(element: Element, name: string): void {
	element.removeAttribute(name)
}

export function getAttribute(element: Element, name: string): string | null {
	return element.getAttribute(name)
}

export function append(parent: ParentNode, ...nodes: (Node | string)[]): void {
	parent.append(...nodes)
}

export function insertBefore(node: ChildNode, ...nodes: (Node | string)[]): void {
	return node.before(...nodes)
}

export function insertAfter(node: ChildNode, ...nodes: (Node | string)[]): void {
	return node.after(...nodes)
}

export function remove(node: ChildNode): void {
	return node.remove()
}

export function nextSibling(node: ChildNode): ChildNode | null {
	return node.nextSibling
}

export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] {
	return document.createElement(tagName)
}

export function createComment(data: string): Comment {
	return document.createComment(data)
}

export function createFragment(): DocumentFragment {
	return document.createDocumentFragment()
}

export function createTextNode(data: string): Text {
	return document.createTextNode(data)
}

export function log(...args: any[]): void {
	console.log(...args)
}

export function isFunction(value: any): value is Function {
	return isFunction(value)
}
export function isString(value: any): value is string {
	return typeof value === "string"
}
export function isNumber(value: any): value is number {
	return typeof value === "number"
}
export function isBoolean(value: any): value is boolean {
	return typeof value === "boolean"
}
export function isSymbol(value: any): value is symbol {
	return typeof value === "symbol"
}
export function isUndefined(value: any): value is undefined {
	return typeof value === "undefined"
}
export function isNull(value: any): value is null {
	return value === null
}
export function isObject(value: any): value is object {
	return typeof value === "object" && value !== null
}
export function isBigInt(value: any): value is bigint {
	return typeof value === "bigint"
}
export function isArray(value: any): value is unknown[] {
	return Array.isArray(value)
}

export function arrayFrom<T>(arrayLike: ArrayLike<T>): T[] {
	return Array.from(arrayLike)
}
