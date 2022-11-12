import { SignalDerive, SignalDerived } from "./computed"
import { SignalValue } from "./value"

export function createSignal<T>(value: T)
{
    return new SignalValue(value)
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


