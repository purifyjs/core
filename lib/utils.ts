export type _Event = Event;

export type Extends<T, U> = T extends U ? true : false;

export type Equal<T, U> = [T] extends [U] ? [U] extends [T] ? true : false : false;

export type If<T extends boolean, Then = true, Else = never> = true extends T ? Then : Else;

export type Not<T extends boolean> = true extends T ? false : true;

export type EscapeNever<T, U> = [T] extends [never] ? U : T;

export type Fn = (...args: any) => any;

export type IsReadonly<T, K extends keyof T> = (<T_1>() => T_1 extends { [Q in K]: T[K] } ? 1 : 2) extends (
    <T_2>() => T_2 extends {
        readonly [Q_1 in K]: T[K];
    } ? 1
        : 2
) ? true
    : false;

export let noop = (): void => {};

export let instancesOf = <T extends abstract new (...args: never) => unknown, U>(
    target: U,
    constructor: T,
): target is EscapeNever<Extract<U, InstanceType<T>>, U & InstanceType<T>> => target instanceof constructor;
