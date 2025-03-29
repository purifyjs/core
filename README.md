<h1 align="center"> purify.js ✨</h1>

<p align="center">
    <img width="100px" height="auto" alt="purify.js logo" src="https://avatars.githubusercontent.com/u/173010374" />
</p>
<p align="center">
     <strong>tiny dom magic for big ideas 🎉</strong>
</p>
<p align="center">
    <i>fresh and light ✨🍃</i>
</p>

---

<p align="center">
    <b>purify.js</b> is a 1.0kB <i>(minified, gzipped)</i> 1.0kB DOM utility library, focusing on building reactive UI. 🚀
</p>

## Features 🌟🚀

- 🔥 **Keeps you close to the DOM.**
- ✍️ `HTMLElement` builder allows you to differentiate between attributes and properties.
- 🌐 Builder doesn't only work with `HTMLElement`(s) but works with any `Node` instance including `ShadowRoot`, `DocumentFragment`,
  `Document`... any `Node` type, including future ones.
- 🎩 Builder converts existing methods on the `Node` instance to builder pattern with `Proxy`.
- ⚡ **Signal implementation that makes sense and useable.**
- 🧙 **Signals are extendable,** allowing chaining with utilities like `.pipe()` and `.derive()` to build custom workflows.
- ✂️ Allows direct DOM manipulation.
- 📁 No special file extensions.
- 🔧 Only deal with `.ts` files, so use it with any existing formatting, linting, and other tools.
- ⚡ **No extra LSP and IDE extensions/plugins:** fast IDE responses, autocompletion, and no weird framework-specific LSP issues.
- ✅ **All verifiable TypeScript code.**

## Compare 📏⚖️

### Size ⚡📊

| Package         | .min.js | .min.js.gz |
| --------------- | ------- | ---------- |
| **purify.js**   | 2.2kB   | 1.0kB      |
| Preact 10.19.3  | 11.2kB  | 4.5kB      |
| Solid 1.8.12    | 23kB    | 8.1kB      |
| jQuery 3.7.1    | 85.1kB  | 29.7kB     |
| Vue 3.4.15      | 110.4kB | 40kB       |
| ReactDOM 18.2.0 | 130.2kB | 42kB       |
| Angular 17.1.0  | 310kB   | 104kB      |

## Installation and Docs 📦🍙

[jsr.io/@purifyjs/core](https://jsr.io/@purifyjs/core)

## Guide 📖🥡

Coming soon.

## Examples 🍤

### Counter

```ts
import { computed, Lifecycle, Signal, state, tags } from "@purifyjs/core";

const { div, section, button, ul, li, input } = tags;

function App() {
    return div().id("app").append$(Counter());
}

function Counter() {
    const count = state(0);
    const double = count.derive((count) => count * 2);
    const half = computed(() => count.val * 0.5);

    return div().append$(
        section({ class: "input" })
            .ariaLabel("Input")
            .append$(
                button()
                    .title("Decrement by 1")
                    .onclick(() => count.val--)
                    .textContent("-"),
                input().type("number").$bind(useBindNumber(count)).step("1"),
                button()
                    .title("Increment by 1")
                    .onclick(() => count.val++)
                    .textContent("+"),
            ),
        section({ class: "output" })
            .ariaLabel("Output")
            .append$(
                ul().append$(
                    li().append$("Count: ", count),
                    li().append$("Double: ", double),
                    li().append$("Half: ", half),
                ),
            ),
    );
}

function useBindNumber(
    state: Signal.State<number>,
): Lifecycle.OnConnected<HTMLInputElement> {
    return (element) => {
        const listener = () => (state.val = element.valueAsNumber);
        element.addEventListener("input", listener);
        const unfollow = state.follow(
            (value) => (element.valueAsNumber = value),
            true,
        );
        return () => {
            element.removeEventListener("input", listener);
            unfollow();
        };
    };
}

document.body.append(App().$node);
```

### ShadowRoot

```ts
import { Builder, state, tags } from "@purifyjs/core";

const { div, button } = tags;

function App() {
    return div().id("app").append$(Counter());
}

function Counter() {
    const host = div();
    const shadow = new Builder(host.$node.attachShadow({ mode: "open" }));

    const count = state(0);

    shadow.append$(
        button()
            .title("Click me!")
            .onclick(() => count.val++)
            .append$("Count:", count),
    );
    return host;
}

document.body.append(App().$node);
```

### Web Components

```ts
import { Builder, state, tags, WithLifecycle } from "@purifyjs/core";

const { div, button } = tags;

function App() {
    return div().id("app").append$(new CounterElement());
}

declare global {
    interface HTMLElementTagNameMap {
        "x-counter": CounterElement;
    }
}

class CounterElement extends WithLifecycle(HTMLElement) {
    static {
        customElements.define("x-counter", CounterElement);
    }

    #count = state(0);

    constructor() {
        super();
        const self = new Builder<CounterElement>(this);

        self.append$(
            button()
                .title("Click me!")
                .onclick(() => this.#count.val++)
                .append$("Count:", this.#count),
        );
    }
}

document.body.append(App().$node);
```

## Why Not JSX Templating? 🤔🍕

- **Lack of Type Safety**: An `<img>` element created with JSX cannot have the `HTMLImageElement` type because all JSX elements must return
  the same type. This causes issues if you expect an `HTMLImageElement` somewhere in the code but all JSX returns is `HTMLElement` or
  `JSX.Element`. It also has issues with generics, discriminated unions, and more.

- **Build Step Required**: JSX necessitates a build step, adding complexity to the development workflow. In contrast, **purify.js** avoids
  this, enabling a simpler and more streamlined development process by working directly with native JavaScript and TypeScript.

- **Attributes vs. Properties**: In **purify.js**, you can differentiate between attributes and properties of an element while building it,
  which is not currently possible with JSX. This distinction enhances clarity and control when defining element characteristics.

JSX is not part of this library natively, but a wrapper can be made quite easily.

## Limitations ⚠️🦀

- Since purify.js uses extended custom elements, **Safari doesn’t support this yet**. If you care about Safari for some reason, use the
  [ungap/custom-elements](https://github.com/ungap/custom-elements) polyfill. You can follow support status at
  [caniuse](https://caniuse.com/mdn-html_global_attributes_is).

  But **I don’t recommend that you support Safari.**\
  _Don't suffer for Safari, let Safari users suffer._

## Future 🔮🦀

- Right now, when a `Signal` is connected to the DOM via `Builder`, it updates all children of the `ParentNode` with
  `ParentNode.prototype.replaceChildren()`.

  This is obviously not great. In version `0.1.6`, I was using a `<div>` element with `display:contents` to wrap a rendered `Signal` in the
  DOM. This allowed tracking its lifecycle via `connectedCallback`/`disconnectedCallback`, making cleanup easier.

  However, wrapping it with an `HTMLElement` caused **CSS selector issues**, since each `Signal` became an actual `HTMLElement`.

  So, in version `0.2.0`, I made it so that **all children** of a `ParentNode` update when a `Signal` child changes. This issue can be
  managed by structuring code carefully or using `.replaceChild()`, since all nodes now support `Signal`(s).

  ---
  **UPDATE:** Switched back to using `<div>` with `display:contents`.

  ---

  Some might ask, _"Why not just use comment nodes?"_ Yes, using comment nodes for tracking ranges is a traditional solution. But it’s not
  **a native ranging solution**, and frameworks that rely on it **break if the DOM is mutated manually**, which goes against this library’s
  philosophy.

  **The real solution?** JavaScript needs a **real** `DocumentFragment` with persistent children.

  A relevant proposal:\
  [DOM#739 Proposal: a DocumentFragment whose nodes do not get removed once inserted](https://github.com/whatwg/dom/issues/736).

  However, they propose making the fragment **undetectable** via `childNodes` or `children`, which I don’t support. A `DocumentFragment`
  should be a `ParentNode` with its own children, and it should behave hierarchically like any other `ParentNode`.

  But it’s a start. However, just **having a working DocumentFragment is not enough**.

- We also need a **native, synchronous, and easy way to follow the lifecycle of any `ChildNode`** (or at least `Element` and the proposed
  persistent `DocumentFragment`).

  An open issue on this:\
  [DOM#533 Make it possible to observe connected-ness of a node](https://github.com/whatwg/dom/issues/533).

  Right now, **Custom Elements are the only sync way** to track element lifecycle. This is why **purify.js heavily relies on them**. We
  auto-create Custom Elements via the `tags` proxy and `WithLifecycle` `HTMLElement` mixin.

- If the above feature is not introduced soon, we also keep an eye on this proposal:\
  [webcomponents#1029 Proposal: Custom attributes for all elements, enhancements for more complex use cases](https://github.com/WICG/webcomponents/issues/1029).

  This **doesn’t solve the DocumentFragment issue** but improves and modularizes `HTMLElement` lifecycles.

  Currently, we use a mixin function called `WithLifecycle`, like this:

  ```ts
  WithLifecycle(HTMLElement); // or
  WithLifecycle(HTMLDivElement);
  ```

  It adds a `$bind()` lifecycle function to any `HTMLElement`. Later, it can be extended into a custom element:

  ```ts
  class MyElement extends WithLifecycle(HTMLElement)
  ```

  This allows defining custom `HTMLElement` types with lifecycles. The `tags` proxy also uses `WithLifecycle` internally.

  So when you do:

  ```ts
  tags.div();
  ```

  You’re actually getting a `<div is="pure-div">` with lifecycle tracking. **The `[is]` attribute is invisible in the DOM because the
  element is created via JavaScript, not HTML.**

  However, since this method requires you to **decide lifecycle elements ahead of time**, it also means we must create **"pure-*" versions
  of native elements**. While it makes sense, it’s a bit cumbersome.

  This is why the **custom attributes proposal** could significantly improve how lifecycles work. It would make lifecycle-related behavior
  **explicit in the DOM**, which is a big advantage.
