export type IsHandled<T> = T extends never ? true : false
export function unhandled<T, M extends string>(_message: M, _: IsHandled<T> extends true ? T : M) {}
