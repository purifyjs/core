/* eslint-disable @typescript-eslint/no-unused-vars */

import { ref } from "./signals.ts";
import { Builder, type tags as tags_type, type WithLifecycle } from "./tags.ts";
declare const tags: typeof tags_type;

function _(_fn: () => void) {}

_(() => {
    // Elements should still satisfy the native types
    tags.a().$node satisfies HTMLAnchorElement;
    tags.form().$node satisfies HTMLFormElement;
});

declare function foo(x: Builder<Node>): void;
declare const bar: Builder<HTMLDivElement> | Builder<WithLifecycle<HTMLElement>> | Builder<ShadowRoot>;

_(() => {
    foo(bar);
});

declare const svgElement: SVGSVGElement;
declare const divElement: HTMLDivElement;
declare const divElementWithLifecycle: WithLifecycle<HTMLDivElement>;
_(() => {
    const svgBuilder = new Builder(svgElement);
    const divBuilder = new Builder(divElement);
    const divWithLifecycleBuilder = new Builder(divElementWithLifecycle);

    svgBuilder.replaceChildren("123");
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    svgBuilder.replaceChildren(ref("123"));
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    svgBuilder.ariaLabel(ref("foo"));
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    svgBuilder.$effect(() => {});

    divBuilder.replaceChildren("123");
    divBuilder.replaceChildren$(divWithLifecycleBuilder);
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    divBuilder.replaceChildren(ref("123"));
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    divBuilder.ariaLabel(ref("foo"));
    /// @ts-expect-error Don't allow signals on elements without lifecycle
    divBuilder.$effect(() => {});

    divWithLifecycleBuilder.replaceChildren("123");
    divWithLifecycleBuilder.replaceChildren(ref("123"));
    divWithLifecycleBuilder.replaceChildren$(divWithLifecycleBuilder);
    divWithLifecycleBuilder.ariaLabel(ref("foo"));
    divWithLifecycleBuilder.$effect(() => {});
});
