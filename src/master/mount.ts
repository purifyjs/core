import { Component, ComponentModule } from "./types"

export async function mountComponent<M extends ComponentModule>(instance: M, element: Element): Promise<Component>
{
    const component = element as Component
    const id = component.getAttribute('component:id')!

    component.$component = {
        id,
        instance
    }

    await instance?.onMount?.()

    return component
}