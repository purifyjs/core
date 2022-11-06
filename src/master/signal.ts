import { randomId } from "./utils/id"

export type SignalListener<T> = (value?: T) => Promise<void> | void
export type SignalSubscription = { unsubscribe: () => void }
export class Signal<T = any>
{
    public readonly id = randomId()
    private _listeners: SignalListener<T>[] = []
    constructor(
        public value: T
    ) {}

    subscribe(listener: SignalListener<T>): SignalSubscription
    {
        this._listeners.push(listener)
        return {
            unsubscribe: () => {
                const index = this._listeners.indexOf(listener)
                if (index !== -1) this._listeners.splice(index, 1)
            }
        }
    }

    public static readonly Empty = Symbol('empty')
    
    async signal(value: T | ((value: T) => T) | typeof Signal.Empty = Signal.Empty)
    {

        if (value !== Signal.Empty) this.value = value instanceof Function ? value(this.value) : value    
        await Promise.all(this._listeners.map((listener) => listener(this.value)))
    }
}

export function signal<T>(value: T)
{
    return new Signal(value)
}

export class SignalDerive<T> extends Signal<T>
{
    private triggerSubs: SignalSubscription[]

    constructor(private getter: () => T, ...triggerSignals: Signal[])
    {
        super(getter())
        this.triggerSubs = triggerSignals.map((signal) => signal.subscribe(() => super.signal(getter())))
    }

    cleanup()
    {
        this.triggerSubs.forEach((sub) => sub.unsubscribe())
    }

    signal: () => Promise<void> = (async (value: any = Signal.Empty) => {
        if (value !== Signal.Empty) throw new Error('Cannot set value of derived signal')
        return super.signal(this.getter())
    }) as any
}

export function signalDerive<T>(getter: () => T, ...triggerSignals: Signal[])
{
    return new SignalDerive(getter, ...triggerSignals)
}