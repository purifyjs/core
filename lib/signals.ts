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
     * Derives a new value from this signal based on a getter function.
     * The derived value will only update when the source signal's value changes,
     * other signals used inside the `getter` will not be added as dependencies dynamically.
     *
     * @template R The type of the derived value.
     * @param getter - A function that computes a derived value from the current signal's value.
     * @returns A new computed signal that holds the derived value.
     *
     * @example
     * ```ts
     * const a = ref(1);
     * const b = ref(2);
     * const derivedValue = a.derive((a) => a * b.val);
     * ```
     * `derivedValue` will only update when `a` changes, not when `b` changes.
     */
    public derive<R>(getter: (value: T) => R): Signal.Computed<R> {
        return computed(() => {
            Dependency.add(this)
            return Dependency.track(() => getter(this.val))
        })
    }

    /**
     * Allows chaining of additional signal transformations or computations.
     * This method applies a getter function to the current signal and directly returns the result.
     * It does not return a new signal.
     *
     * @template R The type of the result from the getter function.
     * @param getter - A function that receives the current signal and returns a transformed value or result.
     * @returns The result of applying the getter function to the current signal.
     *
     * @example
     * ```ts
     * const nestedSignal = ref(ref(ref(123)))
     * const unrolledSignal = nestedSignal.pipe(unroll)
     *
     * type SignalUnroll<T> = T extends Signal<infer U> ? SignalUnroll<U> : T;
     * function unroll<T>(signal: T): SignalUnroll<T>;
     * function unroll(signal: Signal<unknown>) {
     * 	return computed(() => {
     * 		let value: unknown = signal;
     * 		while (value instanceof Signal) {
     * 			value = value.val;
     * 		}
     * 		return value;
     * 	});
     * }
     * ```
     */
    public pipe<R>(getter: (signal: Signal<T>) => R): R {
        return getter(this)
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
        export function add(signal: Signal<unknown>): void
        function track<R>(
            callAndTrack: () => R,
            callback?: (signal: Signal<unknown>) => unknown
        ): R
    }
}

let dependencyTrackingStack: (((signal: Signal<unknown>) => unknown) | undefined)[] = []

let Dependency = (Signal.Dependency = {
    add(signal: Signal<unknown>): void {
        dependencyTrackingStack.at(-1)?.(signal)
    },
    track<R>(callAndTrack: () => R, callback?: (signal: Signal<unknown>) => unknown): R {
        dependencyTrackingStack.push(callback)
        let result = callAndTrack()
        dependencyTrackingStack.pop()
        return result
    }
})

let noop = () => {}

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
        if (!this.#stop) {
            this.follow(() => {})()
        }
        return this.#value
    }
    public set val(newValue: T) {
        if (this.#value === newValue) return
        this.#value = newValue
        this.emit()
    }

    #start: Signal.State.Start<T> | undefined
    #stop: Signal.State.Stop | undefined | null

    public follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollower {
        if (!this.#stop) {
            this.#stop = noop // start might call follow internally, so we set stop as noop here to prevent recusive infinite loop of defining stop
            this.#stop = this.#start?.((value) => (this.val = value)) ?? noop
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
                let newValue = Dependency.track(getter, (dependency) => {
                    newDependencies.add(dependency)
                    if (!dependencies.has(dependency)) {
                        dependencies.set(dependency, dependency.follow(update))
                    }
                })
                newDependencies.delete(this)
                set(newValue)

                for (let [dependency, unfollow] of dependencies) {
                    if (!newDependencies.has(dependency)) {
                        unfollow()
                        dependencies.delete(dependency)
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
