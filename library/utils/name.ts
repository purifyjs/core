export function name(of: unknown)
{
    if (of instanceof Function) return of.name
    return of!.constructor.name ?? `${of}`
}