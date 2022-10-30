import { deserialize, serialize, Serialized } from "../../utils/serialize"
import type { Template } from "../template"

export interface Component<T extends ComponentInstance> extends Element
{
    $component: T
}

export type SerializedProperties = Record<string, Serialized>

export abstract class ComponentInstance
{
    readonly id!: string
    async onMount(): Promise<void> {}
    async onDestroy(): Promise<void> {}
    abstract onRender(): Promise<Template> | Template

    serialize(): SerializedProperties
    {
        const serialized: SerializedProperties = {}
        for (const key in this)
        {
            if (key === 'id') continue
            if (key[0] === '_') continue

            const descriptor = Object.getOwnPropertyDescriptor(this, key)
            if (descriptor?.get || descriptor?.set) continue

            const value = this[key]
            if (typeof value === "function") continue

            try
            {
                serialized[key] = serialize(value as any)
            }
            catch (error)
            {
                console.warn(`Failed to serialize property ${key} of component ${(this.constructor as any).__name}`)
            }

        }

        return serialized
    }

    deserialize(serialized: SerializedProperties)
    {
        const thisAny = this as any
        for (const key in serialized)
        {
            const value = serialized[key]
            try
            {
                thisAny[key] = deserialize(value) as any
            }
            catch (error)
            {
                console.warn(`Failed to deserialize property ${key} of component ${(this.constructor as any).__name}`)
            }
        }
    }
}



export const components: Record<string, typeof ComponentInstance> = {}

export function registerComponent<T extends Record<string, typeof ComponentInstance>>(values: T): { [K in keyof T]: T[K] & { __name: string } } 
{
    for (const key in values)
    {
        const name = `${key}`
        Object.defineProperty(values[key], '__name', { value: name })
        components[name] = values[key]
    }

    return values as any
}