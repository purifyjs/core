<h1 align="center"> purify.js </h1>

<p align="center">
    <img width="100px" height="auto" alt="purify.js logo" src="https://raw.githubusercontent.com/purifyjs/core/refs/heads/master/apps/compare/src/icons/purify.js.svg" />
</p>
<p align="center">
     <b>tiny dom magic for big ideas ✨</b>
</p>

**Experimental: Not for Production**

---

<p align="center">
    <b>purify.js</b> is a 1.0kB <i>(minified, gzipped)</i> JavaScript UI building library that encourages the usage of pure JavaScript and DOM, while providing a thin layer of abstraction for the annoying parts for better DX <i>(developer experience)</i>.
</p>

---

## Compare

### Size ⚡

| Library         | .min.js | .min.js.gz |
| --------------- | ------- | ---------- |
| **purify.js**   | 2.3kB   | 1.0kB      |
| Preact 10.19.3  | 11.2kB  | 4.5kB      |
| Solid 1.8.12    | 23kB    | 8.1kB      |
| jQuery 3.7.1    | 85.1kB  | 29.7kB     |
| Vue 3.4.15      | 110.4kB | 40kB       |
| ReactDOM 18.2.0 | 130.2kB | 42kB       |
| Angular 17.1.0  | 310kB   | 104kB      |

### Syntax

[Compare Syntax](https://bafybeicae2dnq2iqwxsfngdtx2ur3rqyxsb6ectiavoxwx5oco7eidqudm.ipfs.dweb.link)

## Installation 🍙

To install **purify.js**, follow the
[jsr.io/@purifyjs/core](https://jsr.io/@purifyjs/core).

## Examples 🍤

### Counter

```ts
import { computed, Lifecycle, ref, Signal, tags } from "@purifyjs/core"

const { div, section, button, ul, li, input } = tags

function App() {
    return div().id("app").children(Counter())
}

function Counter() {
    const count = ref(0)
    const double = count.derive((count) => count * 2)
    const half = computed(() => count.val * 0.5)

    return div().children(
        section({ class: "input" })
            .ariaLabel("Input")
            .children(
                button()
                    .title("Decrement by 1")
                    .onclick(() => count.val--)
                    .textContent("-"),
                input().type("number").effect(useBindNumber(count)).step("1"),
                button()
                    .title("Increment by 1")
                    .onclick(() => count.val++)
                    .textContent("+")
            ),
        section({ class: "output" })
            .ariaLabel("Output")
            .children(
                ul().children(
                    li().children("Count: ", count),
                    li().children("Double: ", double),
                    li().children("Half: ", half)
                )
            )
    )
}

function useBindNumber(
    state: Signal.State<number>
): Lifecycle.OnConnected<HTMLInputElement> {
    return (element) => {
        const listener = () => (state.val = element.valueAsNumber)
        element.addEventListener("input", listener)
        const unfollow = state.follow((value) => (element.valueAsNumber = value), true)
        return () => {
            element.removeEventListener("input", listener)
            unfollow()
        }
    }
}

document.body.append(App().element)
```

### ShadowRoot

```ts
import { fragment, ref, tags } from "@purifyjs/core"

const { div, button } = tags

function App() {
    return div().id("app").children(Counter())
}

function Counter() {
    const host = div()
    const shadow = host.element.attachShadow({ mode: "open" })

    const count = ref(0)

    shadow.append(
        fragment(
            button()
                .title("Click me!")
                .onclick(() => count.val++)
                .children("Count:", count)
        )
    )
    return host
}

document.body.append(App().element)
```

### Astro + WebComponents

`components/CounterElement.astro`

```html
---
type Props = { counterKey: string };
const { counterKey } = Astro.props;

const count = (await kv.get(`counter:${counterKey}`)) ?? 0;
---

<button is="my-counter" data-counter-key={counterKey}>{count}</button>

<script>
    import { Builder, WithLifecycle, fragment, ref } from "@purifyjs/core";

    class _ extends WithLifecycle(HTMLButtonElement) {
    	constructor() {
    		super();

    		const counterKey = this.getAttribute("data-counter-key")!;
    		const count = ref(Number(this.textContent));

    		const busy = ref(false);
    		async function countUp() {
    			if (busy.val) return;
    			busy.val = true;

    			try {
    				const response = await fetch("/api/count?increment", {
    					method: "POST",
    					body: JSON.stringify({ counterKey }),
    				});
    				const result = (await response.json()) as { count: number };
    				count.val = result.count;
    			} finally {
    				busy.val = false;
    			}
    		}

    		new Builder<_>(this)
    			.attributes({ class: "button" })
    			.type("button")
    			.ariaBusy(busy.derive(String))
    			.disabled(busy)
    			.onclick(countUp)
    			.replaceChildren(fragment(count));
    	}
    }
    customElements.define("my-counter", _, { extends: "button" });
</script>
```

## Guide 🥡

Coming soon.

## Why Not JSX Templating? 🍕

-   **Lack of Type Safety**: An `<img>` element created with JSX cannot have the `HTMLImageElement` type because all JSX elements must return the same type. This causes issues if you expect a `HTMLImageElement` some where in the code but all JSX returns is `HTMLElement` or something like `JSX.Element`. Also, it has some other issues related to the generics, discriminated unions and more.

-   **Build Step Required**: JSX necessitates a build step, adding complexity to the development workflow. In contrast, **purify.js** avoids this, enabling a simpler and more streamlined development process by working directly with native JavaScript and TypeScript.

-   **Attributes vs. Properties**: In **purify.js**, I can differentiate between attributes and properties of an element while building it, which is not currently possible with JSX. This distinction enhances clarity and control when defining element characteristics.

## Current Limitations 🦀

-   **Lifecycle and Reactivity**: Currently, I use Custom Elements to detect if an
    element is connected to the DOM. This means:

    -   Every element created by the `tags` proxy, are Custom Elements. But they
        look like normal `<div>`(s) and `<span>`(s) and etc on the DevTools, because
        they extend the original element and use the original tag name. This way we
        can follow the life cycle of every element. And it works amazingly.
    -   But we also have signals, which might not return an HTMLElement. So we gotta
        wrap signals with something in the DOM. So we can follow its lifecycle and
        know where it starts and ends. Traditionally this is done via `Comment`
        `Node`(s). But there is no feasible and sync way to follow a `Comment`
        `Node` on the DOM while also allowing direct DOM manipulation
        ([DOM#533](https://github.com/whatwg/dom/issues/533)). So instead of
        `Comment` `Node`(s), I used Custom Elements with `display: contents` style
        to wrap signal renders. This way, I can follow the lifecycle of the signal
        render in the DOM, and decide to follow or unfollow the signal. Since signal
        render itself is an `Element` this approach has limitations, such as
        `.parent > *` selector wouldn't select all children if some are inside a
        signal.

        As another solution to this, a persistent DocumentFrament that acts similar
        to `Element` with `display: contents` style but also intentionally skipped
        by query selectors would also be useful.
        Similar: ([DOM#739](https://github.com/whatwg/dom/issues/736))

But as long as the developer is aware of this limitation or difference, it
shouldn't cause any issues.
