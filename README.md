<h1 align="center"> purify.js ⚡ </h1>

<p align="center">
    <img width="100px" height="auto" alt="purify.js logo" src="https://avatars.githubusercontent.com/u/173010374" />
</p>
<p align="center">
     <strong>tiny dom magic for big ideas 🎉</strong>
</p>
<p align="center">
    <i>fresh and light 🍃</i>
</p>

---

<p align="center">
    <b>purify.js</b> is a 1.0kB <i>(minified, gzipped)</i> DOM utility library, focusing on building reactive UI.
</p>

```js
import { ref, tags } from "@purifyjs/core";

const { div, button } = tags;

export function Hello() {
    const counter = ref(0);
    return div().append$(
        ["Hello, ", counter.derive((n) => new Array(n).fill("👋"))],
        button().onclick(() => counter.val++).textContent("Hi!"),
    );
}

document.body.append(Hello().$node);
```

👉 [Play on JSFiddle](https://jsfiddle.net/nomadshiba/zjgqxd83/4/)

## ✨ Features

### DOM

- **Keeps you close to the DOM.**
- Works well with existing DOM methods, properties and features.
- Everything you can do with DOM is allowed, and expected.
- Allows direct DOM manipulation.
- **Doesn't break after a direct DOM manipulation.**
- Allows you to work with any `Node` instance using the builder pattern, `Element`, `ShadowRoot`, `DocumentFragment`, `Document`, even
  `Attr` and any future ones.
- Allows you to bind any custom lifecycle logic to `HTMLElement`(s) with lifecycle.

### Signals

- **Everything reactive is just signals.**
- Signals are extendable, allowing chaining with utilities like `.pipe()` and `.derive()` to build custom workflows.

### Typescript/Javascript

- No special file extensions.
- Only deal with `ts/js` files.
- Use it with any existing formatting, linting, and other tools.
- **No extra LSP and IDE extensions/plugins:** fast IDE responses, autocompletion, and no weird framework-specific LSP issues.
- ✅ **All verifiable TypeScript/Javascript code.**

## 📦 Size

| Package         | .min.js | .min.js.gz |
| --------------- | ------- | ---------- |
| **purify.js**   | 2kB     | 1kB        |
| Preact 10.26.2  | 12kB    | 5kB        |
| Solid 1.8.12    | 23kB    | 8kB        |
| jQuery 3.7.1    | 85kB    | 29kB       |
| Vue 3.4.15      | 110kB   | 40kB       |
| ReactDOM 18.2.0 | 130kB   | 42kB       |
| Angular 17.1.0  | 310kB   | 104kB      |

## 🚀 Installation and Docs

At: [jsr.io/@purifyjs/core](https://jsr.io/@purifyjs/core)

### Quick CLI Install

#### Deno (via jsr.io)

```bash
deno add jsr:@purifyjs/core
```

#### npm, bun, yarn, pnpm (via jsr.io)

```bash
npx jsr add @purifyjs/core      # npm
bunx jsr add @purifyjs/core     # bun
yarn dlx jsr add @purifyjs/core # yarn
pnpm dlx jsr add @purifyjs/core # pnpm
```

<details>
<summary><strong>Importing</strong></summary>

#### Deno (via jsr.io)

```ts
import { ... } from "jsr:@purifyjs/core";
```

#### Deno or Browser (via esm.sh)

```js
import { ... } from "https://esm.sh/jsr/@purifyjs/core";
```

</details>

<details>
<summary><strong>Import Maps</strong></summary>

#### Browser (via esm.sh)

```html
<script type="importmap">
    {
        "imports": {
            "@purifyjs/core": "https://esm.sh/jsr/@purifyjs/core"
        }
    }
</script>
```

#### Deno (via jsr.io)

```json
{
    "imports": {
        "@purifyjs/core": "jsr:@purifyjs/core"
    }
}
```

#### Deno (via esm.sh)

```json
{
    "imports": {
        "@purifyjs/core": "https://esm.sh/jsr/@purifyjs/core"
    }
}
```

</details>

## 🥡 Guide

Coming soon. At 1.0.0 if not sooner. I don't wanna write something that will become outdated 6 months later.

## 🔥 Examples

### Core Concepts

```ts
import { Builder, Lifecycle, ref, Sync, sync, tags, track } from "@purifyjs/core";

const { button, ul, li, input } = tags;

const time = sync<number>((set) => {
    const update = () => set(Date.now());
    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
});

const count = ref(0);
const double = count.derive((count) => count * 2);
const half = computed(() => count.val * 0.5);

new Builder(document.body).append$(
    button()
        .onclick(() => count.val--)
        .textContent("-"),
    input().type("number")
        .$bind(useValueAsNumber(count))
        .step("1"),
    button()
        .onclick(() => count.val++)
        .textContent("+"),
    ul().append$(
        li().append$("Count: ", count),
        li().append$("Double: ", double),
        li().append$("Half: ", half),
        li().append$("Time: ", time),
    ),
);

function useValueAsNumber(
    state: Sync.Ref<number>,
): Lifecycle.OnConnected<HTMLInputElement> {
    return (element) => {
        const abortController = new AbortController();
        element.addEventListener(
            "input",
            () => (state.val = element.valueAsNumber),
            { signal: abortController.signal },
        );
        const unfollow = state.follow(
            (value) => (element.valueAsNumber = value),
            true,
        );
        return () => {
            abortController.abort();
            unfollow();
        };
    };
}
```

### ShadowRoot

```ts
import { Builder, ref, tags } from "@purifyjs/core";

const { div, button } = tags;

function Counter() {
    const host = div();
    const shadow = new Builder(host.$node.attachShadow({ mode: "open" }));

    const count = ref(0);

    shadow.append$(
        button()
            .title("Click me!")
            .onclick(() => count.val++)
            .append$("Count:", count),
    );
    return host;
}
```

### Web Components

```ts
import { Builder, ref, tags, WithLifecycle } from "@purifyjs/core";

const { button } = tags;

class CounterElement extends WithLifecycle(HTMLElement) {
    static {
        customElements.define("x-counter", CounterElement);
    }

    #count = ref(0);

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
```

## 🤷‍♂️ Why Not JSX Templating?

- **Lack of Type Safety**: An `<img>` element created with JSX cannot have the `HTMLImageElement` type because all JSX elements must return
  the same type. This causes issues if you expect an `HTMLImageElement` somewhere in the code but all JSX returns is `HTMLElement` or
  `JSX.Element`. It also has issues with generics, discriminated unions, and more.

- **Build Step Required**: JSX necessitates a build step, adding complexity to the development workflow. In contrast, **purify.js** avoids
  this, enabling a simpler and more streamlined development process by working directly with native JavaScript and TypeScript.

- **Attributes vs. Properties**: In purify.js, you can clearly distinguish between attributes and properties while building elements, which
  is not currently possible with JSX. This distinction enhances clarity and control when defining element characteristics.

JSX is not part of this library natively, but a wrapper can be made quite easily.

## 🗑️ SSR?

**Will purify.js ever support SSR?**\
**No. And it never will.**

purify.js is a **DOM utility library**, not a framework. It’s built for the browser — where apps are meant to _actually run_.

Supporting SSR means sacrificing what makes SPAs powerful. It breaks the direct connection with the DOM — the very thing purify.js is
designed to embrace.

Let’s be honest: **SSR has no place in the future of the web**.

Projects like **Nostr**, **Cachu**, **Blossom**, **IPFS**, and others are shaping a web that’s decentralized, distributed, and
browser-native.

That world doesn’t need server-rendered HTML. It needs small, portable apps that run fully in the client — fast, simple, self-contained, and
aggressively cached.

**purify.js is built for that world.**

---

> The problem was never the SPA.\
> The problem was React — and the bloated, over-engineered mess it encouraged.

Embrace SPA. Embrace PWA.\
Heck, bundle everything into a single HTML file.\
Servers don’t need to render UI — that’s the browser’s job. Rendering isn’t just data, it’s behavior. Offload that computation. Distribute
it. Don’t centralize it.

Your frontend should be nothing more than a CDN-hosted file.\
You don’t need a thousand nodes rendering your UI logic around the world.\
**Let the browser do what it was built to do.**

---

<img alt="all 100s on Chrome Lighthouse" src="./assets/ssr-is-overrated.png">

<sub><i>Full-fledged dashboard built for a private project, running entirely with purify.js and PicoCSS. SSR is overrated.</i></sub>

## 🙄 Limitations

- Since purify.js uses extended custom elements, **Safari doesn’t support this yet**. If you care about Safari for some reason, use the
  [ungap/custom-elements](https://github.com/ungap/custom-elements) polyfill. You can follow support status at
  [caniuse](https://caniuse.com/mdn-html_global_attributes_is).

  But **I don’t recommend that you support Safari.**\
  _Don't suffer for Safari, let Safari users suffer._

## 🔮 The Future: DOM Dreams & Proposals

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

- **Something like `.toNode()` or `Symbol.toNode`** would allow us to insert anything into the DOM without manually unwrapping them. This
  would simplify DOM manipulation by letting custom objects, structures, or even signals to be automatically converted into valid DOM nodes
  when inserted.

## 

> “Nah. I’ll build my own stack. From scratch. On top of the raw DOM — with hookers and blackjack!”



> **5 years.**  
> **5 name changes.**  
> **4 rewrites.**  
> **2 license flips with full commit purge.**  
> And many more tweaks later.   
>  
> ⚡ *It's finally here.*  
> **purify.js** — tiny DOM magic for big ideas.


