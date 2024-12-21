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

## Compare ⚡

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

---

## Installation 🍙

To install **purify.js**, follow the
[jsr.io/@purifyjs/core](https://jsr.io/@purifyjs/core).

---

## Features 💎

- **Tiny**: 1.0kB gzipped, perfect for lightweight applications.
- **No Build Step**: Use directly with native JavaScript or TypeScript.
- **Type-Safe**: Built with TypeScript to ensure reliable code and strong typing.
- **Reactivity Built-In**: Built-in signals and derived values for a reactive UI experience.
- **Clear Lifecycle Control**: Manage DOM lifecycles with fine-grained precision.
- **Attribute vs. Property Control**: Distinguish and manage DOM attributes and properties with ease.

---

## Quick Start 🚀

Here’s a simple example to get you up and running:

```ts
import { tags } from "@purifyjs/core";
const { div, button } = tags;

function App() {
    return div().id("app").children(
        button()
            .textContent("Click Me!")
            .onclick(() => alert("Hello, purify.js!"))
    );
}

document.body.append(App().element);
```

---

## Examples 🍤

### Counter

```ts
import { computed, ref, tags } from "@purifyjs/core";

const { div, section, button, ul, li, input } = tags;

function App() {
    return div().id("app").children(Counter());
}

function Counter() {
    const count = ref(0);
    const double = count.derive((c) => c * 2);
    const half = computed(() => count.val * 0.5);

    return div().children(
        section({ class: "input" }).children(
            button().textContent("-").onclick(() => count.val--),
            input().type("number").value(count.val).oninput((e) => count.val = +e.target.value),
            button().textContent("+").onclick(() => count.val++)
        ),
        section({ class: "output" }).children(
            ul().children(
                li().textContent(`Count: ${count.val}`),
                li().textContent(`Double: ${double.val}`),
                li().textContent(`Half: ${half.val}`)
            )
        )
    );
}

document.body.append(App().element);
```

---

### ShadowRoot

```ts
import { fragment, ref, tags } from "@purifyjs/core";

const { div, button } = tags;

function App() {
    return div().id("app").children(Counter());
}

function Counter() {
    const host = div();
    const shadow = host.element.attachShadow({ mode: "open" });

    const count = ref(0);

    shadow.append(
        fragment(
            button()
                .title("Click me!")
                .onclick(() => count.val++)
                .children("Count:", count)
        )
    );
    return host;
}

document.body.append(App().element);
```

---

## Why Not JSX? 🔍

### 1. **Type Safety**
JSX does not provide strong typing for DOM elements. For example, creating an `<img>` element with JSX will not ensure it is of type `HTMLImageElement`. **purify.js** avoids this by ensuring that all elements are strongly typed.

### 2. **No Build Step**
With JSX, a build step is required to compile your templates. **purify.js** eliminates the need for additional tooling, making development simpler and faster.

### 3. **Attribute vs. Property Control**
**purify.js** allows clear differentiation between attributes and properties when defining element characteristics, providing better control over your UI.

---

## Current Limitations 🦀

-   **Lifecycle and Reactivity**: Currently, I use Custom Elements to detect if an
    element is connected to the DOM. This means:

       Every element created by the `tags` proxy, are Custom Elements. But they
        look like normal `<div>`(s) and `<span>`(s) and etc on the DevTools, because
        they extend the original element and use the original tag name. This way we
        can follow the life cycle of every element. And it works amazingly.

       But we also have signals, which might not return an HTMLElement. So we gotta
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
