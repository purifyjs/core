import type { Component, ComponentInstance } from "."
import { Signal } from "../signal"
import { renderParam } from "./render"


export async function mountComponent<T extends ComponentInstance>(instance: T, element: Element): Promise<Component<T>>
{
    const component = element as Component<T>
    const id = component.getAttribute(':id')!
    Object.defineProperty(instance, 'id', { value: id, writable: false })
    component.$component = instance

    for (const key in instance)
    {
        const descriptor = Object.getOwnPropertyDescriptor(instance, key)
        if (descriptor?.get || descriptor?.set) continue
        if (descriptor?.value instanceof Signal)
        {
            const signal = descriptor.value
            const signalNodeWrapper = document.querySelector(`[\\:signal="${signal.id}"]`)
            if (!signalNodeWrapper) continue
            const signalNode = signalNodeWrapper.firstChild!

            const startComment = document.createComment(`signal ${signal.id}`)
            const endComment = document.createComment(`/signal ${signal.id}`)
            
            signalNodeWrapper.parentElement?.insertBefore(startComment, signalNodeWrapper)
            signalNodeWrapper.parentElement?.insertBefore(signalNode, signalNodeWrapper)
            signalNodeWrapper.parentElement?.insertBefore(endComment, signalNodeWrapper)

            signalNodeWrapper.remove()

            signal.subscribe(async (value) => {
                if (signalNode instanceof Text)
                {
                    signalNode.textContent = await renderParam(value)
                }
                else if (signalNode instanceof Element)
                {
                    signalNode.innerHTML = await renderParam(value)
                }
            })
        }
    }

    await instance.onMount()

    return component
}