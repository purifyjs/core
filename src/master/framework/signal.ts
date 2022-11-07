import { randomId } from "../utils/id"

export type SignalListener<T> = (value: T) => Promise<void> | void
export type SignalSubscription = { unsubscribe: () => void }
export const enum SignalMode
{
    Normal,
    Immediate,
    Once
}
export interface SignalOptions
{
    mode: SignalMode
}
export class Signal<T = any>
{
    public readonly id = randomId()
    private _listeners: SignalListener<T>[] = []
    constructor(
        public value: T
    ) { }

    subscribe(listener: SignalListener<T>, options?: SignalOptions): SignalSubscription
    {
        switch (options?.mode)
        {
            case SignalMode.Once:
                const onceCallback = () => {
                    listener(this.value)
                    this._listeners = this._listeners.filter(l => l !== onceCallback)
                }
                this._listeners.push(onceCallback)
                break
            case SignalMode.Immediate:
                listener(this.value)
            case SignalMode.Normal:
            default:
                this._listeners.push(listener)
                break
        }
        return {
            unsubscribe: () =>
            {
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
        this.triggerSubs = triggerSignals.map((signal) => 
        {
            if (!(signal instanceof Signal)) throw new Error(`SignalDerive can only be created from Signal instances. Got ${signal}`)
            return signal.subscribe(() => 
            {
                const newValue = getter()
                if (newValue !== this.value || typeof newValue === 'object') 
                    super.signal(newValue)
            })
        })
    }

    cleanup()
    {
        this.triggerSubs.forEach((sub) => sub.unsubscribe())
    }

    signal: () => Promise<void> = (async (value: any = Signal.Empty) =>
    {
        if (value !== Signal.Empty) throw new Error('Cannot set value of derived signal')
        await super.signal(this.getter())
    }) as any
}

export function signalDerive<T>(getter: () => T, ...triggerSignals: Signal[])
{
    return new SignalDerive(getter, ...triggerSignals)
}

export function textSignal(parts: TemplateStringsArray, ...values: any[])
{
    function update()
    {
        return parts.map((part, index) =>
        {
            const value = values[index]
            if (!value) return part
            return `${part}${value instanceof Signal ? value.value : value}`
        }).join('')
    }
    return signalDerive(update, ...values.filter((value) => value instanceof Signal))
}