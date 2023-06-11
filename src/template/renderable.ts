export const RenderSymbol = Symbol("render")
export interface Renderable<T = unknown> {
	[RenderSymbol](): T
}
export function isRenderable(value: unknown): value is Renderable {
	return (value as Renderable)?.[RenderSymbol] instanceof Function
}
