import { SignalDerive, SignalDerived } from "./derived"
import { SignalSettable } from "./settable"

export function createSignal<T>(value: T)
{
    return new SignalSettable(value)
}

export function createSignalDerive<T>(compute: SignalDerive<T>)
{
    return new SignalDerived(compute)
}

export function signalPromise<T, P>(then: Promise<T>, placeholder: P)
{
    let n = createSignal<T | P>(placeholder)
    then.then(value => n.set(value))
    return n
}


