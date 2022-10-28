import { Signal } from "./signals"

let dependencyTrackingStack: (Set<Signal<unknown>> | undefined)[] = []

/**
 * Adds a signal to the most recent dependency tracking set on the stack, if it exists.
 *
 * @param {Signal<unknown>} signal - The signal to be added to the current tracking set.
 *
 * @example
 * ```ts
 * let signal = new Signal<number>(10);
 * track(() => {
 *     add(signal); // This is automatically done when getting a value from State or Computed signals
 * });
 * ```
 */
export let add = (signal: Signal<unknown>): void => {
    dependencyTrackingStack.at(-1)?.add(signal)
}

/**
 * Tracks dependencies by pushing a new set onto the stack, invoking a function,
 * and then popping the set off. This allows signals to be tracked during the execution
 * of `callAndTrack`.
 *
 * @template R
 * @param {() => R} callAndTrack - The function to invoke while tracking dependencies.
 * @param {Set<Signal<unknown>>} [set] - Optional set to track the signals in. If not provided, undefined is pushed.
 * @returns {R} - The result of the `callAndTrack` function.
 *
 * @example
 * ```ts
 * const signal = new Signal<number>(10);
 * const signalSet = new Set<Signal<unknown>>();
 * const result = track(() => {
 *     return signal.val * 2; // result is 20
 * }, signalSet);
 *
 * result; // 20
 * signalSet; // [signal]
 * ```
 *
 * @example
 * ```ts
 * // Using track in a computed context to ignore further tracking
 * computed(() => {
 *      add(signal); // Add the current signal for tracking
 *      return track(() => getter(signal.val)); // Ignore further adds
 * });
 * ```
 */
export let track = <R>(callAndTrack: () => R, set?: Set<Signal<unknown>>): R => {
    dependencyTrackingStack.push(set)
    let result = callAndTrack()
    dependencyTrackingStack.pop()
    return result
}
