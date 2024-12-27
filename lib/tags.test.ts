/* eslint-disable @typescript-eslint/no-unused-vars */

import { ref } from "./signals"
import { Builder, MemberOf, tags as tags_type, WithLifecycle } from "./tags"
declare const tags: typeof tags_type

function _(fn: () => void) {}

_(() => {
    // Elements should still satisfy the native types
    tags.a().node satisfies HTMLAnchorElement
    tags.form().node satisfies HTMLFormElement
})

declare function foo(x: Builder<HTMLElement>): void
declare const bar: Builder<HTMLDivElement>
declare const baz: Builder<WithLifecycle<HTMLElement>>

_(() => {
    // Elements should still satisfy the native types
    foo(bar)
    foo(baz)
})

declare const svgElement: SVGSVGElement
declare const divElement: HTMLDivElement
declare const divElementWithLifecycle: WithLifecycle<HTMLDivElement>
_(() => {
    const svgBuilder = new Builder(svgElement)
    svgBuilder.children("123")
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    svgBuilder.ariaLabel(ref("foo"))
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    svgBuilder.effect(() => {})

    const divBuilder = new Builder(divElement)
    divBuilder.children("123")
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    divBuilder.ariaLabel(ref("foo"))
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    divBuilder.effect(() => {})

    const divWithLifecycleBuilder = new Builder(divElementWithLifecycle)
    divWithLifecycleBuilder.children("123")
    divWithLifecycleBuilder.ariaLabel(ref("foo"))
    divWithLifecycleBuilder.effect(() => {})
})

_(() => {
    /// @ts-expect-error No comment, just make sure this works
    false satisfies Builder<HTMLDivElement> extends MemberOf<ParentNode> ? true : false
})
