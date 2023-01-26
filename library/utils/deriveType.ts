import type { SignalDependencyAdder } from "../signal/derived"

export function $<T extends ($: SignalDependencyAdder) => any>(derive: T): T
{
    return derive
}