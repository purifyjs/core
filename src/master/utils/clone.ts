export function deepClone<T extends any>(obj: T): T
{
    if (obj === null || typeof obj !== "object") return obj
    if (isClassInstace(obj)) return deepCloneClassInstance(obj)

    const clone = (Array.isArray(obj) ? [] : {}) as T

    for (const key in obj)
    {
        const value = obj[key]
        clone[key] = typeof value === "object" ? deepClone(value) : value
    }

    return clone
}

export function isClassInstace<T extends object>(obj: T)
{
    return obj.constructor && obj.constructor.name !== "Object"
}

export function deepCloneClassInstance<T extends object>(obj: T): T
{
    const clone = Object.create(Object.getPrototypeOf(obj))
    Object.assign(clone, deepClone(obj))
    return clone
}