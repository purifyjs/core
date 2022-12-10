import type { PickMatch } from "typescript-util-types"

export function importAsync<T extends Record<string, any>, K extends keyof PickMatch<T, Function>>(module: Promise<T>, x: K)
{
    const fn = async (...args: Parameters<T[K]>): Promise<ReturnType<T[K]>> => (await module)[x](...args)
    return { [x]: fn } as { [P in K]: typeof fn }
}