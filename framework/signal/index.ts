import { Signal } from "./base"
import { SignalComputed } from "./compute"
import { SignalValue } from "./value"

export function signal<T>(value: T)
{
    return new SignalValue(value)
}

export function signalComputed<T>(compute: () => T, ...updaters: Signal[])
{
    return new SignalComputed(compute, ...updaters)
}

export function signalDerived<T, U>(signal: Signal<T>, derive: (value: T) => U)
{
    return new SignalComputed(() => derive(signal.value), signal)
}

export function signalText(parts: TemplateStringsArray, ...values: any[])
{
    function update()
    {
        return parts.map((part, index) =>
        {
            const value = values[index]
            if (!value) return part
            return `${part}${value instanceof Signal ? value.value : value}`
        }).join('')
    }
    return signalComputed(update, ...values.filter((value) => value instanceof Signal))
}

export function signalPromise<T, P>(then: Promise<T>, placeholder: P)
{
    let n = signal<T | P>(placeholder)
    then.then(value => n.set(value))
    return n
}


