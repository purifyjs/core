export type WithLifecycle<T extends HTMLElement> = T & HTMLElementWithLifecycle
export interface HTMLElementWithLifecycle extends HTMLElement {
    effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected
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
export let withLifecycle = <T extends keyof HTMLElementTagNameMap>(
    tagname: T,
    newTagName = `pure-${tagname}`,
    constructor = customElements.get(newTagName) as new () => HTMLElementWithLifecycle
) => {
    if (!constructor) {
        customElements.define(
            newTagName,
            (constructor = class
                extends (
                    (document.createElement(tagname).constructor as typeof HTMLElement)
                )
                implements HTMLElementWithLifecycle
            {
                #connectedCallbacks = new Set<Lifecycle.OnConnected<this>>()
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

                effect(callback: Lifecycle.OnConnected<this>): Lifecycle.OffConnected {
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
