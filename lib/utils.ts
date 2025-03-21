/* eslint-disable @typescript-eslint/no-explicit-any */

export type _Event = Event

export type And<T, U> = T | U extends true ? true : false

export type If<T extends boolean, Then, Else = never> = true extends T ? Then : Else
export type Not<T extends boolean> = false extends T ? true : false
export type Fn = (...args: any) => any
export type IsFunction<T, TReturns = any> =
    Fn extends T ?
        T extends (...args: any) => infer R ?
            R extends TReturns ?
                true
            :   false
        :   false
    :   false
export type IsNullable<T> = null extends T ? true : false
export type IsReadonly<T, K extends keyof T> =
    (<T_1>() => T_1 extends { [Q in K]: T[K] } ? 1 : 2) extends (
        <T_2>() => T_2 extends {
            readonly [Q_1 in K]: T[K]
        } ?
            1
        :   2
    ) ?
        true
    :   false
