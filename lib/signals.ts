import { noop } from "./utils.ts";

export declare namespace Signal {
    /** Signal follower function type. */
    type Follower<T> = (value: T) => void;
    /** Unfollow signal function type. */
    type Unfollow = () => void;

    /** A function that computes the value of a computed signal. */
    type Getter<T> = () => T;

    /**
     * Signal setter.
     *
     * @template T - The type of the value to set.
     * @param value - The value to set.
     */
    type Setter<T> = (value: T) => void;

    /**
     * State start callback.
     *
     * @template T The type of the value held by the state signal.
     * @param set A function to set the value of the signal.
     * @returns A function to stop the signal or nothing.
     */
    type Start<T> = (set: Setter<T>) => Stop | void;

    /** State stop callback. */
    type Stop = () => void;

    /**
     * Writable State Signal.
     *
     * @template T The type of the value.
     */
    class State<T> extends Signal<T> {
        constructor(initial: T);
    }

    /**
     * Readonly Computed Signal that derives its value from other signals.
     *
     * @template T The type of the computed value.
     */
    class Computed<T> extends Signal<T> {
        constructor(getter: Signal.Getter<T>);
    }

    namespace Dependency {
        export function add(signal: Signal<unknown>): void;
        function track<R>(callAndTrack: () => R, callback?: (signal: Signal<unknown>) => unknown): R;
    }
}

export class Signal<T> {
    #followers = new Set<Signal.Follower<any>>();

    #start: Signal.Start<T>;
    #stop: Signal.Stop | undefined | null;

    constructor(startStop: Signal.Start<T>) {
        this.#start = startStop;
    }

    public get val(): T {
        return this.get();
    }
    public set val(newValue: T) {
        this.set(newValue);
    }

    protected get(): T {
        Dependency.add(this);
        if (!this.#stop) { // if is not active
            this.follow(noop)();
        }
        return this.last;
    }

    protected last!: T;
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

    public follow(follower: Signal.Follower<T>, immediate?: boolean): Signal.Unfollow {
        if (!this.#stop) {
            // start might call follow internally, so we set stop as noop here to prevent recusive infinite loop of defining stop
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

    public derive<R>(getter: (value: T) => R): Signal.Computed<R> {
        return computed(() => {
            // Add `this` as signal manually
            Dependency.add(this);
            // Ignore other signals that maybe called during getting the val and calling getter.
            return Dependency.track(() => getter(this.get()));
        });
    }

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

    protected override get() {
        Dependency.add(this);
        return this.last;
    }
};

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

    protected override get(): T {
        Dependency.add(this);
        return this.#getter ? this.#getter() : this.last;
    }
};

export let signal = <T>(start: Signal.Start<T>): Signal.State<T> => new Signal(start);

/**
 * Creates a new state signal with an initial value.
 *
 * @template T The type of the value.
 * @param value The initial value of the signal.
 * @returns {Signal.State<T>} A new state signal with the given initial value.
 *
 * @example
 * ```ts
 * const count = state(0);
 * count.follow(console.log)
 * count.val = 5; // logs: 5
 * count.val = 10; // logs: 10
 * ```
 */
export let state = <T>(value: T): Signal.State<T> => new Signal.State(value);

/**
 * Creates a new computed signal from other signals.
 *
 * @template T The type of the computed value.
 * @param {Signal.Computed.Getter<T>} getter A function that computes the value based on the dependencies.
 * @returns {Signal.Computed<T>} A new computed signal.
 *
 * @example
 * ```ts
 * const a = state(1);
 * const b = state(2);
 * const sum = computed(() => a.val + b.val);
 * sum.follow(console.log)
 * a.val++ // logs: 4
 * ```
 */
export let computed = <T>(getter: Signal.Getter<T>): Signal.Computed<T> => new Signal.Computed(getter);
