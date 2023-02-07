import type { SignalReadable } from "./readable"
import { createWritable } from "./writable"

/**
 * Derives a signal from a promise.
 * 
 * When the promise is resolved, the signal is set to the resolved value.
 * @param promise The promise to derive the signal from.
 * @param then The function that derives the value of the signal from the resolved value of the promise.
 * @param placeholder The value to set the signal to while the promise is pending.
 * @param onError The function that derives the value of the signal from the error of the promise.
 * @returns The signal that is derived from the promise.
 * @example
 * const signal = m.await(AsyncFooComponent(), 'loading') 
**/
export function createAwait<T, R, P, E>(promise: Promise<T>, then: (awaited: T) => R, placeholder?: P, onError?: <T extends Error>(error: T) => E):
    P extends undefined
    ? E extends undefined
    ? SignalReadable<R | null>
    : SignalReadable<R | E | null>
    : E extends undefined
    ? SignalReadable<R | P>
    : SignalReadable<R | P | E>
{
    if (placeholder !== undefined && onError instanceof Function)
    {
        const signal = createWritable<R | P | E>(placeholder)
        promise.then(value => signal.set(then(value))).catch((error) => signal.set(onError(error)))
        return signal as any
    }

    if (placeholder !== undefined)
    {
        const signal = createWritable<R | P>(placeholder)
        promise.then(value => signal.set(then(value)))
        return signal as any
    }

    if (onError instanceof Function)
    {
        const signal = createWritable<R | E | null>(null)
        promise.then(value => signal.set(then(value))).catch((error) => signal.set(onError(error)))
        return signal as any
    }

    const signal = createWritable<R | null>(null)
    promise.then(value => signal.set(then(value)))
    return signal as any
}