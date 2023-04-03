export type Renderable<T = unknown> = { render(): T }
export function isRenderable(value: unknown): value is Renderable {
	return (value as Renderable)?.render instanceof Function
}
