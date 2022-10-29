import { Component, ComponentInstance } from "."


export async function mountComponent<T extends ComponentInstance>(instance: T, element: Element): Promise<Component<T>>
{
    const component = element as Component<T>
    const id = component.getAttribute('component:id')!
    instance.id = id
    component.$component = instance

    const templateData = await instance.render()
    for (let index = 0; index < templateData.params.length; index++)
    {
        const param = templateData.params[index]
        if (param instanceof ComponentInstance)
        {
            const child = element.querySelector(`[component\\:child="${id}-${index}"]`)!
            await mountComponent(param, child)
        }
    }

    await instance.onMount()

    return component

}