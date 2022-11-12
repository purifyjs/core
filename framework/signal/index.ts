import { SignalCompute, SignalComputed } from "./computed"
import { SignalValue } from "./value"

export function signal<T>(value: T)
{
    return new SignalValue(value)
}

export function signalComputed<T>(compute: SignalCompute<T>)
{
    return new SignalComputed(compute)
}

export function signalPromise<T, P>(then: Promise<T>, placeholder: P)
{
    let n = signal<T | P>(placeholder)
    then.then(value => n.set(value))
    return n
}


