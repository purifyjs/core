import { components, SerializedProperties } from "./component"
import { mountComponent } from "./component/mount"

async function importComponentModuleBasedOnName(name: string)
{
    if (components[name]) return
    const module = await import(`./components/${name}.ts`)
    return module[name]
}

const windowAny = window as any
windowAny.$initComponent = async function (instanceId: string, serializedProps: SerializedProperties)
{
    const component = document.querySelector(`[\\:id='${instanceId}']`)!
    const name = component.getAttribute(':name')!
    try
    {
        component.nextElementSibling!.remove()
        await importComponentModuleBasedOnName(name)
        const instance = new (components[name] as any)()
        instance.deserialize(serializedProps)
        await mountComponent(instance, component)
    } 
    catch (error)
    {
        console.log('Components', components)
        console.error(`Failed to initialize component ${name} with id ${instanceId}.`, error)
    }
}