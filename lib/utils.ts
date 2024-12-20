/* eslint-disable @typescript-eslint/no-explicit-any */

import { WithLifecycle } from "./tags"

export type IsProxyable<T, K extends keyof T> = [
    // Anything part of the Lifecycle
    K extends Exclude<keyof WithLifecycle<HTMLElement>, keyof HTMLElement> ? true : false,
    // Any non readonly non functions, basically mutable values
    Not<IsReadonly<T, K>> & Not<IsFunction<T[K]>>,
    // Any nullable functions, basically mutable functions such as event listeners
    IsFunction<T[K]> & IsNullable<T[K]>,
    // Any function that returns void exclusivly
    IsFunction<T[K], void>
][number]

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
