/**
 * @module signals
 *
 * This module provides a Signal system that allows for reactive state management.
 * Signals represent values that can be observed and updated. They are used to model reactive
 * data flows where other components can "follow" a signal and react to its changes.
 */

import { noop } from "./utils.ts";

export declare namespace Sync {
    /**
     * A function type that follows the signal's value.
     * It is invoked whenever the signal's value changes.
     *
     * @template T - The type of value being followed.
     */
    type Follower<T> = (value: T) => void;

    /**
     * A function type used to unfollow a signal.
     * It stops the signal from notifying a follower when its value changes.
     */
    type Unfollower = () => void;

    /**
     * A function type that computes the value of a computed signal.
     *
     * @template T - The type of the value returned by the computed signal.
     */
    type Getter<T> = () => T;

    /**
     * A function type that sets the value of a signal.
     *
     * @template T - The type of the value to set.
     * @param value - The value to set.
     */
    type Setter<T> = (value: T) => void;

    /**
     * A callback function type used to start the signal when it has at least one follower.
     * This callback is invoked when the signal becomes active, meaning there is at least one follower subscribed to it.
     *
     * @template T - The type of value held by the state signal.
     * @param set - A function to set the value of the signal.
     * @returns A function to stop the signal (cleanup) when there are no followers, or void if no cleanup is needed.
     */
    type Starter<T> = (set: Setter<T>) => Stoper | void;

    /**
     * A callback function type used to stop the signal and perform cleanup when there are no followers.
     * This callback is invoked when the signal becomes inactive, meaning there are no more followers.
     */
    type Stoper = () => void;
}

/**
 * Signal with the provided start/stop function.
 * The start function is invoked when the signal becomes active (has at least one follower).
 * The stop function is invoked when the signal becomes inactive (has no followers).
 *
 * @template T The type of value held by the signal.
 * @param start A callback function that takes a setter function and returns a stop function or void.
 * @returns A new signal instance.
 *
 * @example
 * ```ts
 * const time_ms = sync<number>((set) => {
 *      const interval = setInterval(update, 1000)
 *      update()
 *      function update() {
 *          set(Date.now())
 *      }
 *
 *      return () => {
 *          clearInterval(interval)
 *      }
 * });
 * ```
 */
export class Sync<T = never> {
    #followers = new Set<Sync.Follower<any>>();
    #start: Sync.Starter<T>;
    #stop: Sync.Stoper | undefined | null;

    constructor(start: Sync.Starter<T>) {
        this.#start = start;
    }

    /**
     * The last known value of the signal.
     * This value is updated whenever the signal's value changes.
     */
    protected last!: T;

    /**
     * Gets the current value of the signal.
     * This method also adds the signal to the dependency tracking system, ensuring that any function
     * depending on this signal will automatically update when the signal's value changes.
     *
     * @returns The current value of the signal.
     */
    public get(): T {
        Tracking.add(this);
        if (!this.#stop) { // if is not active
            this.follow(noop)();
        }
        return this.last;
    }

    /**
     * Sets a new value for the signal and notifies followers.
     * If the new value is the same as the current value, no action is taken.
     *
     * @param value - The new value to set for the signal.
     */
    protected set(value: T) {
        if (value === this.last) return;
        this.last = value;

        let i = this.#followers.size;
        this.#followers.forEach((follower) => {
            if (i-- > 0) {
                follower(value);
            }
        });
    }

    /**
     * Getter for `get()`.
     */
    public get val(): T {
        return this.get();
    }

    /**
     * Setter for `set()`
     */
    protected set val(newValue: T) {
        this.set(newValue);
    }

    /**
     * Adds a follower to the signal. The follower will be notified whenever the signal's value changes.
     *
     * @param follower - The function that will be called when the signal's value changes.
     * @param immediate - Whether to call the follower immediately with the current value of the signal.
     *
     * @returns A function that can be called to stop following the signal.
     */
    public follow(follower: Sync.Follower<T>, immediate?: boolean): Sync.Unfollower {
        if (!this.#stop) {
            // start might call follow internally, so we set stop as noop here to prevent recursive infinite loop of defining stop
            this.#stop = noop;

            this.#stop = this.#start((value) => this.set(value)) ?? noop;
        }

        if (immediate) follower(this.last);

        this.#followers.add(follower);

        return () => {
            this.#followers.delete(follower);
            if (!this.#followers.size) {
                this.#stop?.();
                this.#stop = null;
            }
        };
    }

    /**
     * Derives a new computed signal based on the value of this signal.
     * The computed signal will be updated whenever this signal's value changes.
     *
     * @param getter - A function that computes a new value based on the current value of the signal.
     *
     * @returns A new computed signal that derives its value from this signal.
     */
    public derive<R>(getter: (value: T) => R): Sync<R> {
        return track(() => {
            // Add `this` as signal manually
            Tracking.add(this);
            // Ignore other signals that may be called during getting the val and calling getter.
            return Tracking.track(() => getter(this.get()));
        });
    }

    /**
     * Pipes the signal to another function for further processing.
     *
     * @param fn - A function that takes the signal and returns a derived value.
     *
     * @returns The result of calling the getter function with this signal.
     */
    public pipe<R>(fn: (signal: Sync<T>) => R): R {
        return fn(this);
    }
}

export declare namespace Sync {
    /**
     * Dependency namespace
     */
    namespace Tracking {
        /**
         * Adds a signal to the dependency tracking system.
         * Signals added to the system can be tracked for changes and dependencies.
         *
         * @param signal - The signal to add to the dependency system.
         */
        function add(signal: Sync<unknown>): void;

        /**
         * Tracks a function and its dependencies. Any signals accessed during the function's execution
         * will be tracked as dependencies.
         *
         * @template R - The return type of the tracked function.
         * @param callAndTrack - A function that will be tracked for dependencies.
         * @param callback - An optional callback function that will be invoked when a signal is accessed.
         *
         * @returns The result of the `callAndTrack` function.
         */
        function track<R>(callAndTrack: () => R, callback?: (signal: Sync<unknown>) => unknown): R;
    }
}

let dependencyTrackingStack: (((signal: Sync<unknown>) => unknown) | undefined)[] = [];
let Tracking = (Sync.Tracking = {
    add(signal: Sync<unknown>): void {
        dependencyTrackingStack.at(-1)?.(signal);
    },
    track<R>(callAndTrack: () => R, callback?: (signal: Sync<unknown>) => unknown): R {
        dependencyTrackingStack.push(callback);
        let result = callAndTrack();
        dependencyTrackingStack.pop();
        return result;
    },
});

export declare namespace Sync {
    /**
     * A writable state signal that holds a mutable value.
     * This signal allows you to get and set the value of the signal.
     *
     * @template T - The type of the value held by the signal.
     * @param initial The initial value of the signal.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * count.follow(console.log, true); // logs: 0
     * count.val = 5; // logs: 5
     * count.val = 10; // logs: 10
     * ```
     */
    class Ref<T> extends Sync<T> {
        constructor(initial: T);

        public override get val(): T;
        public override set val(newValue: T);
        public override get(): T;
        public override set(newValue: T): void;
    }
}

Sync.Ref = class<T> extends Sync<T> {
    constructor(initial: T) {
        super(noop);
        this.last = initial;
    }

    public override get() {
        Tracking.add(this);
        return this.last;
    }
} as typeof Sync.Ref;

/**
 * @alias ```ts
 * new Sync<T>(start: Sync.Starter<T>)
 * ```
 */
export let sync = <T = never>(start: Sync.Starter<T>): Sync<T> => new Sync(start);

/**
 * @alias ```ts
 * new Sync.Ref<T>(initial: T)
 * ```
 */
export let ref = <T>(initial: T): Sync.Ref<T> => new Sync.Ref(initial);

/**
 * Creates a new computed signal that derives its value from other signals.
 * Computed signals are readonly and cannot have their value directly set.
 * They automatically update when the signals they depend on change.
 *
 * @template T The type of the computed value.
 * @param getter A function that computes the value based on the values of other signals.
 * @returns A new computed signal that reflects the value derived from other signals.
 *
 * @example
 * ```ts
 * const a = ref(1);
 * const b = ref(2);
 * const sum = track(() => a.val + b.val);
 * sum.follow(console.log, true); // logs: 3
 * a.val++; // logs: 4
 * ```
 */
export let track = <T>(getter: Sync.Getter<T>): Sync<T> => {
    let dependencies = new Map<Sync<unknown>, Sync.Unfollower>();
    let self = new Sync<T>((notify) => {
        let update = () => {
            let newDependencies = new Set<Sync<any>>();
            let newValue = Tracking.track(getter, (dependency) => {
                newDependencies.add(dependency);
                if (!dependencies.has(dependency)) {
                    dependencies.set(dependency, dependency.follow(update));
                }
            });
            newDependencies.delete(self);
            notify(newValue);

            for (let [dependency, unfollow] of dependencies) {
                if (!newDependencies.has(dependency)) {
                    unfollow();
                    dependencies.delete(dependency);
                }
            }
        };
        update();

        return () => {
            dependencies.forEach((unfollow) => unfollow());
            dependencies.clear();
        };
    });
    return self;
};
