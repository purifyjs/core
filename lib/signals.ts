/**
 * @module Signal
 *
 * This module provides a Signal system that allows for reactive state management.
 * Signals represent values that can be observed and updated. They are used to model reactive
 * data flows where other components can "follow" a signal and react to its changes.
 *
 * The module includes:
 * - Signal class: Represents a reactive value that can be followed by other components.
 * - State class: A writable signal that allows for modifying the value.
 * - Computed class: A readonly signal that derives its value from other signals.
 * - Dependency system: Tracks signal dependencies for automatic updates.
 *
 * Signals can have followers that react to changes in the signal's value. When a signal has followers,
 * it becomes "active" and can invoke a start function. When there are no followers, the signal becomes
 * "inactive," and a stop function is invoked to perform cleanup.
 */

import { noop } from "./utils.ts";

export declare namespace Signal {
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
    type Unfollow = () => void;

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
    type Start<T> = (set: Setter<T>) => Stop | void;

    /**
     * A callback function type used to stop the signal and perform cleanup when there are no followers.
     * This callback is invoked when the signal becomes inactive, meaning there are no more followers.
     */
    type Stop = () => void;

    /**
     * A writable state signal class that holds a mutable value.
     * This class allows you to get and set the value of the signal, with automatic tracking of any followers
     * that are dependent on the signal's value.
     *
     * @template T - The type of the value held by the signal.
     */
    class State<T> extends Signal<T> {
        /**
         * Constructs a new writable state signal with an initial value.
         *
         * @param initial - The initial value of the state signal.
         */
        constructor(initial: T);

        /**
         * Gets the current value of the state signal.
         * This method also adds the signal to the dependency tracking system, ensuring that any function
         * depending on this signal will automatically update when the signal's value changes.
         *
         * @returns The current value of the state signal.
         */
        public get val(): T;

        /**
         * Sets the value of the state signal.
         * This method triggers updates to any followers that are observing this signal.
         *
         * @param newValue - The new value to set for the state signal.
         */
        public set val(newValue: T);

        /**
         * Gets the current value of the state signal.
         * This method also adds the signal to the dependency tracking system, ensuring that any function
         * depending on this signal will automatically update when the signal's value changes.
         *
         * @returns The current value of the signal.
         */
        public get(): T;

        /**
         * Sets the value of the state signal and notifies all followers.
         * If the value has not changed, no action is taken.
         *
         * @param newValue - The new value to set for the state signal.
         */
        public set(newValue: T): void;
    }

    /**
     * A readonly computed signal class that derives its value from other signals.
     * The value of this signal is automatically updated whenever any of the signals it depends on change.
     *
     * @template T - The type of the computed value derived from other signals.
     */
    class Computed<T> extends Signal<T> {
        /**
         * Constructs a new computed signal based on the provided getter function.
         * The getter function will compute the value of the computed signal based on the current values
         * of other signals.
         *
         * @param getter - A function that computes the value of the signal based on other signals.
         */
        constructor(getter: Signal.Getter<T>);

        /**
         * Gets the current value of the computed signal.
         * This method also adds the computed signal to the dependency tracking system, ensuring that any function
         * depending on this signal will automatically update when the computed value changes.
         *
         * @returns The current value of the computed signal.
         */
        public get val(): T;

        /**
         * Gets the current value of the computed signal.
         * This method also adds the signal to the dependency tracking system, ensuring that any function
         * depending on this signal will automatically update when the computed value changes.
         *
         * @returns The current value of the computed signal.
         */
        public get(): T;
    }

    namespace Dependency {
        /**
         * Adds a signal to the dependency tracking system.
         * Signals added to the system can be tracked for changes and dependencies.
         *
         * @param signal - The signal to add to the dependency system.
         */
        function add(signal: Signal<unknown>): void;

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
        function track<R>(callAndTrack: () => R, callback?: (signal: Signal<unknown>) => unknown): R;
    }
}

export class Signal<T = never> {
    #followers = new Set<Signal.Follower<any>>();
    #start: Signal.Start<T>;
    #stop: Signal.Stop | undefined | null;

    /**
     * Creates a new signal with the provided start/stop function.
     * The start function is invoked when the signal becomes active and has at least one follower.
     * The stop function is invoked when the signal becomes inactive, meaning there are no more followers.
     *
     * @param start - A callback function that takes a setter function and returns a stop function or void.
     *                The setter function is used to update the value of the signal.
     */
    constructor(start: Signal.Start<T>) {
        this.#start = start;
    }

    /**
     * Gets the current value of the signal.
     *
     * @returns The current value of the signal.
     */
    public get val(): T {
        return this.get();
    }

    /**
     * Sets the value of the signal.
     *
     * @param newValue - The value to set for the signal.
     */
    protected set val(newValue: T) {
        this.set(newValue);
    }

    /**
     * Gets the current value of the signal.
     * This method also adds the signal to the dependency tracking system, ensuring that any function
     * depending on this signal will automatically update when the signal's value changes.
     *
     * @returns The current value of the signal.
     */
    public get(): T {
        Dependency.add(this);
        if (!this.#stop) { // if is not active
            this.follow(noop)();
        }
        return this.last;
    }

    /**
     * The last known value of the signal.
     * This value is updated whenever the signal's value changes.
     *
     * @private
     */
    protected last!: T;

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
     * Adds a follower to the signal. The follower will be notified whenever the signal's value changes.
     *
     * @param follower - The function that will be called when the signal's value changes.
     * @param immediate - Whether to call the follower immediately with the current value of the signal.
     *
     * @returns A function that can be called to stop following the signal.
     */
    public follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollow {
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
    public derive<R>(getter: (value: T) => R): Signal.Computed<R> {
        return computed(() => {
            // Add `this` as signal manually
            Dependency.add(this);
            // Ignore other signals that may be called during getting the val and calling getter.
            return Dependency.track(() => getter(this.get()));
        });
    }

    /**
     * Pipes the signal to another function for further processing.
     *
     * @param getter - A function that takes the signal and returns a derived value.
     *
     * @returns The result of calling the getter function with this signal.
     */
    public pipe<R>(getter: (signal: Signal<T>) => R): R {
        return getter(this);
    }
}

let dependencyTrackingStack: (((signal: Signal<unknown>) => unknown) | undefined)[] = [];

let Dependency = (Signal.Dependency = {
    add(signal: Signal<unknown>): void {
        dependencyTrackingStack.at(-1)?.(signal);
    },
    track<R>(callAndTrack: () => R, callback?: (signal: Signal<unknown>) => unknown): R {
        dependencyTrackingStack.push(callback);
        let result = callAndTrack();
        dependencyTrackingStack.pop();
        return result;
    },
});

Signal.State = class<T> extends Signal<T> {
    constructor(initial: T) {
        super(noop);
        this.last = initial;
    }

    public override get() {
        Dependency.add(this);
        return this.last;
    }
} satisfies new <T>(initial: T) => Omit<Signal.State<T>, "set"> as never;

Signal.Computed = class<T> extends Signal<T> {
    #getter: Signal.Getter<T> | undefined | null;

    constructor(getter: Signal.Getter<T>) {
        super((notify) => {
            let update = () => {
                let newDependencies = new Set<Signal<any>>();
                let newValue = Dependency.track(getter, (dependency) => {
                    newDependencies.add(dependency);
                    if (!dependencies.has(dependency)) {
                        dependencies.set(dependency, dependency.follow(update));
                    }
                });
                newDependencies.delete(this);
                notify(newValue);

                for (let [dependency, unfollow] of dependencies) {
                    if (!newDependencies.has(dependency)) {
                        unfollow();
                        dependencies.delete(dependency);
                    }
                }
            };
            update();
            this.#getter = null;

            return () => {
                this.#getter = getter;
                dependencies.forEach((unfollow) => unfollow());
                dependencies.clear();
            };
        });
        let dependencies = new Map<Signal<unknown>, Signal.Unfollow>();
        this.#getter = getter;
    }

    public override get(): T {
        Dependency.add(this);
        return this.#getter ? this.#getter() : this.last;
    }
};

/**
 * Creates a new signal with the provided start/stop function.
 * The start function is invoked when the signal becomes active (has at least one follower).
 * The stop function is invoked when the signal becomes inactive (has no followers).
 *
 * @template T The type of value held by the signal.
 * @param start A callback function that takes a setter function and returns a stop function or void.
 * @returns A new signal instance.
 *
 * @example
 * ```ts
 * const time_ms = signal<number>((set) => {
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
export let signal = <T = never>(start: Signal.Start<T>): Signal<T> => new Signal(start);

/**
 * Creates a new state signal with the provided initial value.
 * State signals are writable, meaning their value can be directly set.
 *
 * @template T The type of the value held by the state signal.
 * @param value The initial value of the state signal.
 * @returns A new state signal with the given initial value.
 *
 * @example
 * ```ts
 * const count = state(0);
 * count.follow(console.log); // logs: 0
 * count.val = 5; // logs: 5
 * count.val = 10; // logs: 10
 * ```
 */
export let state = <T>(value: T): Signal.State<T> => new Signal.State(value);

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
 * const a = state(1);
 * const b = state(2);
 * const sum = computed(() => a.val + b.val);
 * sum.follow(console.log); // logs: 3 (since a.val + b.val = 1 + 2)
 * a.val++; // logs: 4 (since a.val + b.val = 2 + 2)
 * ```
 */
export let computed = <T>(getter: Signal.Getter<T>): Signal.Computed<T> => new Signal.Computed(getter);
