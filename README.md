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

# Features 🌟🚀

- 🔥 **Keeps you close to the DOM.**
- ✍️ `HTMLElement` builder allows you to differentiate between attributes and properties.
- 🌐 Builder doesn't only work with `HTMLElement`(s) but works with any `Node` instance including `ShadowRoot`, `DocumentFragment`,
  `Document`... any `Node` type, including future ones.
- 🎩 Builder converts existing methods on the `Node` instance to builder pattern with `Proxy`.
- ⚡ **Signal implementation that makes sense and useable.**
- 🧙 **Signals are extendable,** allowing chaining with utilities like .pipe() and .derive() to build custom workflows..
- ✂️ Allows direct DOM manipulation.
- 📁 No special file extensions.
- 🔧 Only deal with `.ts` files, so use it with any existing formatting, linting, and other tools.
- ⚡ **No extra LSP and IDE extensions/plugins:** fast IDE responses, autocompletion, and no weird framework specific LSP issues.
- ✅ **All verifiable TypeScript code.**

---

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

---

## Installation and Docs 📦🍙

[jsr.io/@purifyjs/core](https://jsr.io/@purifyjs/core).

---

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

## Guide 📖🥡

Coming soon.

## Why Not JSX Templating? 🤔🍕

- **Lack of Type Safety**: An `<img>` element created with JSX cannot have the `HTMLImageElement` type because all JSX elements must return
  the same type. This causes issues if you expect a `HTMLImageElement` some where in the code but all JSX returns is `HTMLElement` or
  something like `JSX.Element`. Also, it has some other issues related to the generics, discriminated unions and more.

- **Build Step Required**: JSX necessitates a build step, adding complexity to the development workflow. In contrast, **purify.js** avoids
  this, enabling a simpler and more streamlined development process by working directly with native JavaScript and TypeScript.

- **Attributes vs. Properties**: In **purify.js**, I can differentiate between attributes and properties of an element while building it,
  which is not currently possible with JSX. This distinction enhances clarity and control when defining element characteristics.

JSX is not part of this library natively, but a wrapper can be made quite easily.

## Limitations ⚠️🦀

- Since I use extended custom elements, safari doesn't support this yet, so if you care about safari for some reasons, use
  [ungap/custom-elements](https://github.com/ungap/custom-elements) polyfill. You can follow support at
  [caniuse](https://caniuse.com/mdn-html_global_attributes_is).

  But I don't recommend that you support Safari.<br> _Don't suffer for Safari, let the Safari users suffer_

## Future 🔮🦀

- Right now, when a `Signal` is connected to DOM via `Builder`, we update all of the children of the `ParentNode` with
  `ParentNode.prototype.replaceChildren()`.

  This is obviously not that great, previously at `0.1.6` I was using a `<div>` element with the style `display:contents` to wrap a rendered
  `Signal` on the DOM. This was also allowing me to follow it's lifecyle via `connectedCallback`/`disconnectedCallback` which was allowing
  me to follow or unfollow the `Signal`, making cleanup easier.

  But since we wrap it with an `HTMLElement` it was causing problems with CSS selectors, since now each `Signal` is an `HTMLElement` on the
  DOM.

  So at `0.2.0` I made it so that all children of the `ParentNode` updates when a `Signal` child changes. Tho this issue can be escaped by
  seperating things while writing the code. Or make use of things like `.replaceChild()`. Since all support `Signal`(s) now.

  You might be saying "Why not just use comment nodes?": Yes, creating ranges with comment nodes is the traditional solution to this issue.
  But it's not a native ranging solution, and the frameworks that use it break as soon as you mutate the DOM without the framework, which is
  against the philosophy of the library.

  So to solve the core of this issue JS needs a real `DocumentFragment` with persistent children.

  This proposal might solve this issue:
  [DOM#739 Proposal: a DocumentFragment whose nodes do not get removed once inserted](https://github.com/whatwg/dom/issues/736).

  In the proposal they propose making the fragment undetactable with `childNodes` or `children` which I am against and don't like at all.
  `DocumentFragment` should be a `ParentNode` should have it's own children, and can be `ChildNode` of other `ParentNode`. Normal hierarchy,
  no trasparency other than CSS.

  But it's a good start, but just by having a real, working as intended, `DocumentFragment` we are not done.

  Which brings be to the next point.

- We also need a native, sync and easy to use way to follow lifecycle of any DOM `ChildNode`, or at least all `Element` and this new
  persistent `DocumentFragment`. Because without a lifecycle feature we can't bind a `Signal` to the DOM, start, stop/cleanup them
  automatically.

  An issue is open here [DOM#533 Make it possible to observe connected-ness of a node](https://github.com/whatwg/dom/issues/533).

  But also, DOM already has a sync way to follow lifecycle of custom `HTMLElement`(s). And since this is the only way, at this time we
  heavily relay on that. Currently we use auto created Custom Elements via `tags` proxy and `WithLifecycle` `HTMLElement` mixin. And allow
  `Signal` related things only on those elements.

- If this feature above doesn't come sooner we also keep an eye of this other proposal which has more attraction:
  [webcomponents#1029 Proposal: Custom attributes for all elements, enhancements for more complex use cases](https://github.com/WICG/webcomponents/issues/1029)

  This proposal doesn't fix the issue with `DocumentFragment`(s), but improves and makes `HTMLElement` based lifecycles more modular and DX
  friendly.

  Right now, we have a mixing function called `WithLifecycle` which can be used like:
  ```ts
  WithLifecycle(HTMLElement); // or
  WithLifecycle(HTMLDivElement);
  ```
  It adds a lifecycle function called `$bind()` to any `HTMLElement` type. Which can later be extended by a custom element like
  ```ts
  class MyElement extends WithLifecycle(HTMLElement)
  ```
  Allowing you to create your own custom `HTMLElement` type with lifecycle. the `tags` proxy also uses `WithLifecycle` in combination with
  `Builder` internally. so when you do `tags.div()` you are actually getting a `<div is="pure-div">` with a lifecycle. _But the `[is]`
  attribute is not visible in the DOM since this element created by JS, not HTML_.

  Anyway since this method requires you to decide if something is an element with lifecycle ahead of time, and also requires use to create
  `pure-*` variant of native `HTMLElement` types in order to make them have lifecycle, it's kinda a lot. It makes sense. But it's kind of a
  lot.

  So this new custom attributes proposal can let us have lifecycle on any `Element` easily by simily adding an attribute to it. And this can
  reshape a big portion of this codebase. And would make things connected to lifecyle of the `Element` more visible in the DOM. Which is
  great.
