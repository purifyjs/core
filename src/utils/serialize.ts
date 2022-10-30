import { ComponentInstance, SerializedProperties } from "../master/component"
import { Signal } from "../master/signal"
import { Template } from "../master/template"

export const enum SerializableType
{
    Null,
    String,
    Number,
    Boolean,
    Object,
    Array,
    Date,
    RegExp,
    Signal,
    Template,
    Component
}

type SerializableValue = string | number | boolean | null | Date | RegExp | Signal | Template | ComponentInstance
type SerializableObject = { [key: string]: Serializable }
type SerializableArray = Serializable[]
export type Serializable = SerializableValue | SerializableObject | SerializableArray

type SerializedValue = string | number | boolean | null
type SerializedObject = { [key: string]: Serialized }
type SerializedArray = Serialized[]
type SerializedSignal = [string, Serialized]
type SerializedTemplate = [TemplateStringsArray, Serialized[]]
type SerializedComponent = [string, SerializedProperties]
export type Serialized = [SerializableType, Serialized | SerializedValue | SerializedArray | SerializedObject | SerializedSignal | SerializedTemplate | SerializedComponent]

export function serialize(value: Serializable): Serialized
{
    if (value === null) return [SerializableType.Null, null]
    if (typeof value === "string") return [SerializableType.String, value]
    if (typeof value === "number") return [SerializableType.Number, value]
    if (typeof value === "boolean") return [SerializableType.Boolean, value]
    if (value instanceof Date) return [SerializableType.Date, value.getTime()]
    if (value instanceof RegExp) return [SerializableType.RegExp, value.toString()]
    if (value instanceof Signal) return [SerializableType.Signal, [value.id, serialize(value.value)]]
    if (value instanceof Template) return [SerializableType.Template, [value.parts, value.values.map(serialize)]]
    if (value instanceof ComponentInstance) return [SerializableType.Component, [value.id, value.serialize()]]
    if (Array.isArray(value)) return [SerializableType.Array, value.map(serialize)]
    if (typeof value === "object")
    {
        const serialized: SerializedObject = {}
        for (const key in value)
        {
            serialized[key] = serialize(value[key])
        }
        return [SerializableType.Object, serialized]
    }
    throw new Error(`Failed to serialize value of type ${typeof value}`)
}

export function deserialize(serialized: Serialized): Serializable
{
    const [type, v] = serialized
    switch (type)
    {
        case SerializableType.Null: return null
        case SerializableType.String: return v as string
        case SerializableType.Number: return v as number
        case SerializableType.Boolean: return v as boolean
        case SerializableType.Date: return new Date(v as number)
        case SerializableType.RegExp: return new RegExp(v as string)
        case SerializableType.Signal:
            {
                const [id, value] = v as SerializedSignal
                const signal = new Signal(value)
                Object.defineProperty(signal, 'id', { value: id, writable: false })
                return signal
            }
        case SerializableType.Template:
            {
                const [parts, values] = v as SerializedTemplate
                return new Template(parts, values.map(deserialize))
            }
        case SerializableType.Component:
            {
                const [id, properties] = v as SerializedComponent
                const component = new (window as any)[id]()
                component.deserialize(properties)
                return component
            }
        case SerializableType.Array: return (v as Serialized[]).map(deserialize)
        case SerializableType.Object:
            {
                const object: SerializableObject = {}
                for (const key in v as SerializedObject)
                {
                    object[key] = deserialize((v as SerializedObject)[key] as Serialized)
                }
                return object
            }
    }
}