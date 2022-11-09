import { randomId } from "../utils/id"

export interface SignalListener<T>
{
    (value: T): Promise<void> | void
}
export interface SignalSubscription { unsubscribe(): void }
export interface SignalUpdater<T> { (value: T): T }
export interface SignalDerivation<T>{ (): T }

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

export function signal<T>(value: T)
{
    return new SignalValue(value)
}

export function signalDerive<T>(derivation: () => T, ...derivers: Signal[])
{
    return new SignalDerive(derivation, ...derivers)
}

export function signalText(parts: TemplateStringsArray, ...values: any[])
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

export class Signal<T = any>
{
    public readonly id = randomId()
    private _listeners: SignalListener<T>[] = []
    constructor(protected _value: T) { }

    get value() { return this._value }

    subscribe(listener: SignalListener<T>, options?: SignalOptions): SignalSubscription
    {
        switch (options?.mode)
        {
            case SignalMode.Once:
                const onceCallback = () =>
                {
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

    protected static readonly Empty = Symbol('empty')

    async signal()
    {
        await Promise.all(this._listeners.map((listener) => listener(this.value)))
    }
}

export class SignalValue<T> extends Signal<T>
{
    async set(value: T | typeof SignalValue.Empty = SignalValue.Empty)
    {
        if (value === this.value && typeof value !== 'object') return
        if (value !== SignalValue.Empty) this._value = value
        await this.signal()
    }

    async update(updater: SignalUpdater<T>)
    {
        await this.set(updater(this.value))
    }
}

export class SignalDerive<T> extends Signal<T>
{
    private deriverSubscriptions: SignalSubscription[]
    private derivers: Signal[]
    protected derivation: SignalDerivation<T>

    constructor(derivation: SignalDerivation<T>, ...derivers: Signal[])
    {
        super(derivation())
        this.derivation = derivation
        this.derivers = derivers
        this.deriverSubscriptions = []
        this.activate()
    }

    activate()
    {
        if (this.deriverSubscriptions.length) return
        this.deriverSubscriptions = this.derivers.map((signal) => 
        {
            if (!(signal instanceof Signal)) throw new Error(`SignalDerive can only be created from Signal instances. Got ${signal}`)
            return signal.subscribe(async () => await this.signal())
        })
    }
    
    deactivate()
    {
        if (!this.deriverSubscriptions.length) return
        this.deriverSubscriptions.forEach((subscription) => subscription.unsubscribe())
        this.deriverSubscriptions = []
    }

    async signal()
    {
        const value = this.derivation()
        if (value === this.value && typeof value !== 'object') return
        this._value = value
        await super.signal()
    }
}