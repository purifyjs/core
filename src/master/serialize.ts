import { isClassInstace } from "../utils/clone"

export function serializeFunction(func: Function): string
{
    return func.toString()
}

export function deserializeFunction(func: string): Function
{
    return eval(func)
}

export function toSerializable<T extends any>(obj: T): T
{
    if (obj === null || typeof obj !== "object") return obj
    if (isClassInstace(obj)) throw "Class instances are not supported yet"

    const clone = (Array.isArray(obj) ? [] : {}) as T

    for (const key in obj)
    {
        const value = obj[key]

        switch (typeof value)
        {
            case "function":
                clone[key] = serializeFunction(value) as any
                break
            case "object":
                clone[key] = toSerializable(value)
                break
            default:
                clone[key] = value
                break
        }
    }

    return clone
}

export function fromSerializable<T extends any>(obj: T): T
{
    if (obj === null || typeof obj !== "object") return obj
    if (isClassInstace(obj)) throw "Class instances are not supported yet"

    const clone = (Array.isArray(obj) ? [] : {}) as T

    for (const key in obj)
    {
        const value = obj[key]

        switch (typeof value)
        {
            case "string":
                clone[key] = deserializeFunction(value) as any
                break
            case "object":
                clone[key] = fromSerializable(value)
                break
            default:
                clone[key] = value
                break
        }
    }

    return clone
}