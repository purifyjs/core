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
     * Call this function to clean up and prevent memory leaks.
     */
    type Unfollower = () => void;

    /**
     * A function type that gets the value of a signal.
     * Used primarily in computed signals to retrieve the current value.
     *
     * @template T - The type of the value returned by the getter.
     */
    type Getter<T> = () => T;

    /**
     * A function type that sets the value of a signal.
     * Used primarily in sync signals to update the signal's value.
     *
     * @template T - The type of the value to set.
     * @param value - The new value to set.
     */
    type Setter<T> = (value: T) => void;

    /**
     * A callback function used to start the signal when it has at least one follower.
     * This callback is invoked when the signal transitions from inactive to active.
     *
     * @template T - The type of the Signal.
     * @param set - A function to set the value of the signal.
     * @returns A function to stop the signal (cleanup) when there are no followers, or void if no cleanup is needed.
     */
    type Starter<T> = (set: Setter<T>) => Stopper | void;

    /**
     * A callback function used to stop the signal and perform cleanup when there are no followers.
     * This callback is invoked when the signal becomes inactive, meaning there are no more followers.
     * Use this to clean up resources like timers, subscriptions, or event listeners.
     */
    type Stopper = () => void;
}

/**
 * A reactive signal that manages a value and notifies followers when that value changes.
 * This base signal class provides the foundation for all reactive state in purify.js.
 *
 * Signals become active when they have at least one follower and inactive when they have none.
 * The start function is invoked when the signal becomes active, and the stop function when it becomes inactive.
 *
 * @template T The type of value held by the signal.
 * @param start A callback function that takes a setter function and returns a stop function or void.
 * @returns A new signal instance.
 *
 * @example
 * ```ts
 * const time_ms = sync<number>((set) => {
 *      // This runs when the signal gets its first follower
 *      const interval = setInterval(() => set(Date.now()), 1000)
 *      set(Date.now()) // Set initial value
 *
 *      // This cleanup runs when the signal has no more followers
 *      return () => clearInterval(interval)
 * });
 * ```
 */
export class Sync<T = never> {
    #followers = new Set<Sync.Follower<any>>();
    #starter: Sync.Starter<T>;
    #stopper: Sync.Stopper | undefined | null;

    constructor(starter: Sync.Starter<T>) {
        this.#starter = starter;
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
        if (!this.#stopper) { // if is not active
            this.follow(noop)();
        }
        return this.last;
    }

    /**
     * Sets a new value for the signal and notifies followers if the value has changed.
     * If the new value is the same as the current value (by strict equality ===),
     * no update occurs and followers are not notified.
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
     * Getter property that provides syntactic sugar for accessing the signal's value.
     * Equivalent to calling .get() but with property access syntax.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * console.log(count.val); // Same as count.get()
     * ```
     */
    public get val(): T {
        return this.get();
    }

    /**
     * Setter property that provides syntactic sugar for updating the signal's value.
     * Equivalent to calling .set() but with property assignment syntax.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * count.val++; // Same as count.set(count.get() + 1)
     * ```
     */
    protected set val(newValue: T) {
        this.set(newValue);
    }

    /**
     * Adds a follower to the signal that will be notified whenever the signal's value changes.
     * If this is the first follower, the signal becomes active and starts its internal processes.
     *
     * @param follower - The function that will be called when the signal's value changes.
     * @param immediate - When true, immediately calls the follower with the current value.
     * @returns A function that can be called to stop following the signal and clean up resources.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * const unfollow = count.follow(value => console.log(`Count changed to ${value}`));
     * count.val = 5; // Console logs: "Count changed to 5"
     * unfollow(); // Stop following
     * ```
     */
    public follow(follower: Sync.Follower<T>, immediate?: boolean): Sync.Unfollower {
        if (!this.#stopper) {
            // start might call follow internally, so we set stop as noop here to prevent recursive infinite loop of defining stop
            this.#stopper = noop;

            this.#stopper = this.#starter((value) => this.set(value)) ?? noop;
        }

        if (immediate) follower(this.last);

        this.#followers.add(follower);

        return () => {
            this.#followers.delete(follower);
            if (!this.#followers.size) {
                this.#stopper?.();
                this.#stopper = null;
            }
        };
    }

    /**
     * Derives a new computed signal based on the value of this signal.
     * The computed signal will be updated whenever this signal's value changes.
     * This provides a simple way to transform a signal's value without creating dependencies manually.
     *
     * @param getter - A function that computes a new value based on the current value of the signal.
     * @returns A new computed signal that derives its value from this signal.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * const doubled = count.derive(n => n * 2);
     * doubled.follow(console.log); // Logs 0 initially
     * count.val = 5; // Logs 10 automatically
     * ```
     */
    public derive<R>(getter: (value: T) => R): Sync<R> {
        return computed(() => {
            // Add `this` as signal manually
            Tracking.add(this);
            // Ignore other signals that may be called during getting the val and calling getter.
            return Tracking.track(() => getter(this.get()));
        });
    }

    /**
     * Pipes the signal to another function for further processing.
     * This is a utility method that enables functional-style composition with signals.
     *
     * @param fn - A function that takes the signal and returns a derived value.
     * @returns The result of calling the provided function with this signal.
     *
     * @example
     * ```ts
     * const count = ref(0);
     * const element = count.pipe(signal =>
     *   div().textContent(computed(() => `Count: ${signal.get()}`))
     * );
     * ```
     */
    public pipe<R>(fn: (signal: Sync<T>) => R): R {
        return fn(this);
    }
}

export declare namespace Sync {
    /**
     * Dependency tracking system that allows signals to automatically detect and
     * manage dependencies in computed values.
     */
    namespace Tracking {
        /**
         * Adds a signal to the current dependency tracking context.
         * When a signal's value is accessed inside a tracked function, this method
         * is called to register the signal as a dependency.
         *
         * @param signal - The signal to add to the dependency system.
         */
        function add(signal: Sync<unknown>): void;

        /**
         * Tracks a function and its dependencies by creating a tracking context.
         * Any signals accessed during the function's execution will be registered as dependencies
         * through the provided callback.
         *
         * @template R - The return type of the tracked function.
         * @param callAndTrack - A function that will be tracked for dependencies.
         * @param callback - An optional callback function invoked when a signal is accessed.
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
     * A writable (mutable) signal that allows both reading and writing values.
     * Use this when you need to create a piece of reactive state that can be updated.
     *
     * The Ref class extends the base Sync signal with direct read/write capabilities,
     * making it ideal for storing application state that changes over time.
     *
     * @template T - The type of the value held by the signal.
     *
     * @example
     * ```ts
     * const count = ref(0); // Creates a new Sync.Ref instance
     * count.follow(console.log, true); // Logs: 0
     * count.val = 5; // Logs: 5
     * count.set(10); // Logs: 10
     *
     * // Using getter/setter methods
     * const newValue = count.get() + 1; // Get current value
     * count.set(newValue); // Update the value
     * ```
     */
    class Ref<T> extends Sync<T> {
        /**
         * Creates a new writable signal with the provided initial value.
         *
         * @param initial The initial value of the signal.
         * @param starter An optional starter function that can be used to initialize
         *                custom behavior when the signal becomes active.
         */
        constructor(initial: T, starter?: Sync.Starter<T>);

        /**
         * Gets the current value of this writable signal.
         */
        public override get val(): T;

        /**
         * Sets a new value for this writable signal.
         *
         * @param newValue The new value to set.
         */
        public override set val(newValue: T);

        /**
         * Gets the current value of this writable signal.
         *
         * @returns The current value.
         */
        public override get(): T;

        /**
         * Sets a new value for this writable signal.
         *
         * @param newValue The new value to set.
         */
        public override set(newValue: T): void;
    }
}

Sync.Ref = class<T> extends Sync<T> {
    constructor(initial: T, starter: Sync.Starter<T> = noop) {
        super(starter);
        this.last = initial;
    }
} as typeof Sync.Ref;

/**
 * Creates a signal with custom lifecycle management through a start/stop function.
 * This is the most flexible way to create signals that need to manage external resources.
 *
 * @template T The type of value held by the signal.
 * @param start A callback function that takes a setter function and returns a stop function or void.
 * @returns A new signal instance that will start when it gets its first follower and stop when it has no followers.
 *
 * @example
 * ```ts
 * const time = sync<number>((set) => {
 *   // Start: runs when the signal gets its first follower
 *   const interval = setInterval(() => set(Date.now()), 1000);
 *   set(Date.now()); // Set initial value
 *
 *   // Stop/cleanup: runs when the signal has no more followers
 *   return () => clearInterval(interval);
 * });
 * ```
 */
export let sync = <T = never>(start: Sync.Starter<T>): Sync<T> => new Sync(start);

/**
 * Creates a writable signal with the provided initial value.
 * This is the most common way to create a piece of reactive state that can be both read and modified.
 *
 * @template T The type of the initial value.
 * @param initial The initial value for the signal.
 * @param starter An optional function that runs when the signal gets its first follower.
 *                This allows for custom setup and teardown logic, similar to the sync function.
 * @returns A new writable signal (Sync.Ref) that can be both read from and written to.
 *
 * @example
 * ```ts
 * // Basic usage
 * const count = ref(0);
 * console.log(count.val); // 0
 * count.val = 5;
 * console.log(count.val); // 5
 *
 * // With custom starter logic
 * const timestamp = ref(Date.now(), (set) => {
 *   const interval = setInterval(() => set(Date.now()), 1000);
 *   return () => clearInterval(interval);
 * });
 * ```
 */
export let ref = <T>(initial: T, starter?: Sync.Starter<T>): Sync.Ref<T> => new Sync.Ref(initial, starter);

/**
 * Creates a computed signal that automatically tracks its dependencies.
 * A computed signal derives its value from other signals and updates automatically
 * when any of its dependencies change.
 *
 * @template T The type of the computed value.
 * @param getter A function that computes the value based on other signals.
 * @returns A read-only signal that updates when its dependencies change.
 *
 * @example
 * ```ts
 * const firstName = ref('John');
 * const lastName = ref('Doe');
 * const fullName = computed(() => `${firstName.val} ${lastName.val}`);
 *
 * fullName.follow(console.log); // Logs: "John Doe"
 * firstName.val = 'Jane'; // Logs: "Jane Doe"
 * ```
 */
export let computed = <T>(getter: Sync.Getter<T>): Sync<T> => {
    type DependencyDetails =
        | [unfollower: Sync.Unfollower, version: boolean]
        | [unfollower: Sync.Unfollower];

    let dependencies = new Map<Sync<unknown>, DependencyDetails>();

    let currentVersion = false;
    let details: DependencyDetails | undefined;
    let update: () => void;

    let self = sync<T>((notify) => {
        update = () => {
            currentVersion = !currentVersion;
            notify(
                Tracking.track(getter, (dependency) => {
                    details = dependencies.get(dependency);
                    if (!details) dependencies.set(dependency, details = [dependency.follow(update)]);
                    details[1] = currentVersion;
                }),
            );

            for (let [dependency, [unfollow, version]] of dependencies) {
                if (version === currentVersion) continue;
                unfollow();
                dependencies.delete(dependency);
            }
        };
        update();

        return () => {
            dependencies.forEach(([unfollow]) => unfollow());
            dependencies.clear();
        };
    });
    return self;
};
