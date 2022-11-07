import type { MasterFragment } from "../framework/fragment"
import { Signal, signalDerive } from "../framework/signal"

export function If(condition: Signal<any> | any, then: MasterFragment, else_?: MasterFragment)
{
    if (condition instanceof Signal)
        return signalDerive(() => condition.value ? then : else_ ?? null, condition)
    return condition ? then : else_ ?? null
}