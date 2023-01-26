import { createSignal, SignalSettable } from "./settable"

export function createAwaitSignal<T, P, E>(then: Promise<T>, placeholder?: P, onError?: <T extends Error>(error: T) => E): 
    P extends undefined 
    ? E extends undefined 
        ? SignalSettable<T | null> 
        : SignalSettable<T | E | null> 
    : E extends undefined 
        ? SignalSettable<T | P> 
        : SignalSettable<T | P | E>
{
    if (placeholder !== undefined && onError instanceof Function)
    {
        const signal = createSignal<T | P | E>(placeholder)
        then.then(value => signal.set(value)).catch((error) => signal.set(onError(error)))
        return signal as any
    }

    if (placeholder !== undefined)
    {
        const signal = createSignal<T | P>(placeholder)
        then.then(value => signal.set(value))
        return signal as any
    }

    if (onError instanceof Function)
    {
        const signal = createSignal<T | E | null>(null)
        then.then(value => signal.set(value)).catch((error) => signal.set(onError(error)))
        return signal as any
    }

    const signal = createSignal<T | null>(null)
    then.then(value => signal.set(value))
    return signal as any
}