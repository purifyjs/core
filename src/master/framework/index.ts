import { ComponentFunctions } from ".."

export {}

const $functions: { [componentId: string]: ComponentFunctions } = {}

function search(path: EventTarget[], attribute: string)
{
    return path
        .filter((target) => target instanceof Element && target.hasAttribute(attribute))
        .map((target) => 
        {
            const element = target as Element
            const value = element.getAttribute(attribute)!
            const id = element.getAttribute('component:id')!
            return { id, value, element }
        })
}

window.addEventListener('click', (e) => 
{
    for (const { id, value } of search(e.composedPath(), 'on:click'))
    {
        try
        {
            $functions[id]?.[value]?.(e)
        }
        catch (error)
        {
            console.error(error)
        }
    }
})