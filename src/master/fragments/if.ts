import type { MasterFragment } from "../framework/fragment"
import { Signal } from "../framework/signal"

export function If(condition: Signal | any, then: MasterFragment, else_?: MasterFragment)
{
    if (condition instanceof Signal)
        return condition.derive((value) => value ? then : else_ ?? null)
    else
        return condition ? then : else_ ?? null
}