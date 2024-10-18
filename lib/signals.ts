/**
 * An abstract class representing a signal that holds a value and allows followers to react to changes.
 *
 * @template T The type of the value held by the signal.
 */
export abstract class Signal<T> {
    /** The current value of the signal. */
    public abstract readonly val: T

    /**
     * Registers a follower that will be called when the signal's value changes.
     *
     * @param {Signal.Follower<T>} follower - The function to be called with the updated value.
     * @param {boolean} [immediate] - Whether to call the follower immediately with the current value.
     * @returns {Signal.Unfollower} A function to unregister the follower.
     */
    public abstract follow(
        follower: Signal.Follower<T>,
        immediate?: boolean
    ): Signal.Unfollower

    /**
     * Derives a new computed signal from this signal using a getter function.
     *
     * @template R The type of the derived value.
     * @param {function(T): R} getter - A function that computes a value based on this signal's value.
     * @returns {Signal.Computed<R>} A new computed signal.
     *
     * @example
     * ```ts
     * // Updates only when `urlHref` changes
     * urlHref.derive(() => urlSearchParams.val.get('foo') ?? urlPathname.val)
     * ```
     */
    public derive<R>(getter: (value: T) => R): Signal.Computed<R> {
        return computed(() => {
            Dependency.add(this)
            return Dependency.track(() => getter(this.val))
        })
    }
}

/** A namespace for signal-related types and classes. */
export declare namespace Signal {
    /** Signal follower function type. */
    type Follower<T> = (value: T) => void
    /** Unfollow signal function type. */
    type Unfollower = () => void

    /**
     * Writable State Signal.
     *
     * @template T The type of the value.
     */
    class State<T> extends Signal<T> {
        constructor(initial: T, startStop?: Signal.State.Start<T>)
        public get val(): T
        public set val(newValue: T)
        public follow(follower: Follower<T>, immediate?: boolean): Signal.Unfollower
        /**
         * Notifies all followers of the current value without changing it.
         *
         * @example
         * ```ts
         * const arraySignal = ref([] as number[])
         * const lastAdded = computed(() => arraySignal.val.at(-1))
         * lastAdded.follow(console.log)
         * arraySignal.push(123)
         * arraySignal.emit() // logs: 123
         * ```
         */
        public emit(): void
    }

    namespace State {
        /**
         * Signal setter.
         *
         * @template T - The type of the value to set.
         * @param value - The value to set.
         */
        type Setter<T> = (value: T) => void

        /**
         * State start callback.
         *
         * @template T The type of the value held by the state signal.
         * @param set A function to set the value of the signal.
         * @returns A function to stop the signal or nothing.
         */
        type Start<T> = (set: Setter<T>) => Stop | void

        /** State stop callback. */
        type Stop = () => void
    }

    /**
     * Readonly Computed Signal that derives its value from other signals.
     *
     * @template T The type of the computed value.
     */
    class Computed<T> extends Signal<T> {
        constructor(getter: Signal.Computed.Getter<T>)
        public get val(): T
        public follow(follower: Follower<T>, immediate?: boolean): Signal.Unfollower
    }

    namespace Computed {
        /** A function that computes the value of a computed signal. */
        type Getter<T> = () => T
    }

    namespace Dependency {
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
        export function add(signal: Signal<unknown>): void

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
        function track<R>(callAndTrack: () => R, set?: Set<Signal<unknown>>): R
    }
}

let dependencyTrackingStack: (Set<Signal<unknown>> | undefined)[] = []

let Dependency = (Signal.Dependency = {
    add(signal: Signal<unknown>): void {
        dependencyTrackingStack.at(-1)?.add(signal)
    },
    track<R>(callAndTrack: () => R, set?: Set<Signal<unknown>>): R {
        dependencyTrackingStack.push(set)
        let result = callAndTrack()
        dependencyTrackingStack.pop()
        return result
    }
})

Signal.State = class<T> extends Signal<T> {
    #followers = new Set<Signal.Follower<T>>()
    #value: T

    constructor(initial: T, startStop?: Signal.State.Start<T>) {
        super()
        this.#value = initial
        this.#start = startStop
    }

    public get val() {
        Dependency.add(this)
        return this.#value
    }
    public set val(newValue: T) {
        if (this.#value === newValue) return
        this.#value = newValue
        this.emit()
    }

    #start: Signal.State.Start<T> | undefined
    #stop: Signal.State.Stop | undefined | void | null

    public follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollower {
        if (!this.#followers.size) {
            this.#stop = this.#start?.((value) => (this.val = value))
        }

        if (immediate) {
            follower(this.#value)
        }

        this.#followers.add(follower)

        return () => {
            this.#followers.delete(follower)
            if (!this.#followers.size) {
                this.#stop?.()
                this.#stop = null
            }
        }
    }

    public emit() {
        let i = this.#followers.size
        for (let follower of this.#followers) {
            if (i-- > 0) follower(this.#value)
        }
    }
}

Signal.Computed = class<T> extends Signal<T> {
    #getter: Signal.Computed.Getter<T> | undefined | null
    #state: Signal.State<T>

    constructor(getter: Signal.Computed.Getter<T>) {
        super()
        this.#getter = getter

        let dependencies = new Map<Signal<unknown>, Signal.Unfollower>()

        this.#state = ref<T>(0 as never, (set) => {
            let update = () => {
                let newDependencies = new Set<Signal<unknown>>()
                let newValue = Dependency.track(getter, newDependencies)
                newDependencies.delete(this)
                set(newValue)

                for (let [dependency, unfollow] of dependencies) {
                    if (!newDependencies.has(dependency)) {
                        unfollow()
                        dependencies.delete(dependency)
                    }
                }

                for (let dependency of newDependencies) {
                    if (!dependencies.has(dependency)) {
                        dependencies.set(dependency, dependency.follow(update))
                    }
                }
            }
            update()
            this.#getter = null

            return () => {
                this.#getter = getter
                dependencies.forEach((unfollow) => unfollow())
                dependencies.clear()
            }
        })
    }

    public get val(): T {
        Dependency.add(this)
        return this.#getter ? this.#getter() : this.#state.val
    }

    public follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollower {
        return this.#state.follow(follower, immediate)
    }
}
/**
 * Creates a new state signal with an initial value.
 *
 * @template T The type of the value.
 * @param value The initial value of the signal.
 * @param {Signal.State.Start<T>} [startStop] An optional start/stop function.
 * @returns {Signal.State<T>} A new state signal with the given initial value.
 *
 * @example
 * ```ts
 * const count = ref(0);
 * count.follow(console.log)
 * count.val = 5; // logs: 5
 * count.val = 10; // logs: 10
 * ```
 */
export let ref = <T>(value: T, startStop?: Signal.State.Start<T>): Signal.State<T> =>
    new Signal.State(value, startStop)

/**
 * Creates a new computed signal from other signals.
 *
 * @template T The type of the computed value.
 * @param {Signal.Computed.Getter<T>} getter A function that computes the value based on the dependencies.
 * @returns {Signal.Computed<T>} A new computed signal.
 *
 * @example
 * ```ts
 * const a = ref(1);
 * const b = ref(2);
 * const sum = computed(() => a.val + b.val);
 * sum.follow(console.log)
 * a.val++ // logs: 4
 * ```
 */
export let computed = <T>(getter: Signal.Computed.Getter<T>): Signal.Computed<T> =>
    new Signal.Computed(getter)

/**
 * Creates a new signal that will resolve with the result of a promise.
 *
 * @template T The type of the resolved value.
 * @template U The type of the initial value (usually `null`).
 * @param {Promise<T>} promise The promise that will resolve the value.
 * @param {U} [until] The initial value before the promise resolves.
 * @returns {Signal<T | U>} A signal that updates when the promise resolves.
 *
 * @example
 * ```ts
 * const dataSignal = awaited(fetchDataPromise, null);
 * dataSignal.follow((data) => console.log(data)); // logs the resolved data when ready
 * ```
 */
export let awaited = <T, const U = null>(
    promise: Promise<T>,
    until: U = null as never
): Signal<T | U> => {
    let signal = ref<T | U>(until)
    promise.then((value) => (signal.val = value))
    return signal
}
