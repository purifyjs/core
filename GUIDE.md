# purify.js Guide

Welcome to **purify.js**—a lightweight (≈1 kB) reactive DOM utility library focused on simplicity and performance. This guide will walk you
through all aspects of using **purify.js** to build reactive UIs.

## Reactivity System

### Signal Basics

At the core of **purify.js** is a powerful signal-based reactivity system. Unlike heavyweight frameworks, **purify.js** implements
reactivity with minimal abstractions:

```ts
import { computed, ref, sync } from "@purifyjs/core";

// Create a writable signal with an initial value
const count = ref(0);

// Read from a signal - two equivalent ways:
console.log(count.get()); // 0
console.log(count.val); // 0 (shorthand property for get())

// Write to a signal - two equivalent ways:
count.set(5); // Method approach
count.val = 5; // Property approach
```

Under the hood, signals are lightweight objects that track dependencies and notify subscribers when their values change. Every signal
provides both `.get()`/`.set()` methods and a `.val` property that triggers the same functionality.

### Signal Architecture

All signals in **purify.js** are built on the `Sync` class:

- `Sync` is the base class for all signals
- `Sync.Ref` extends `Sync` to add mutability (for read-write signals)
- `computed()` creates a `Sync` with automatic dependency tracking

While you can create signals with constructors like `new Sync()` or `new Sync.Ref()`, **purify.js** provides convenient function aliases:

```ts
// These are equivalent:
const time = sync((set) => {/* implementation */}); // Function alias
const time = new Sync((set) => {/* implementation */}); // Constructor

// These are equivalent too:
const count = ref(0); // Function alias
const count = new Sync.Ref(0); // Constructor
```

The function aliases are preferred for their conciseness and readability.

### Signal Types

**purify.js** offers three kinds of signals:

1. **`ref(initialValue)`**: A mutable signal you can both read and write.

2. **`computed(() => expression)`**: A derived signal that automatically recalculates when its dependencies change.

   ```ts
   const count = ref(0);
   const doubled = computed(() => count.get() * 2);

   console.log(doubled.get()); // 0
   count.set(5);
   console.log(doubled.get()); // 10
   ```

   Computed signals are clever: they only recalculate when both:
   - One of their dependencies changes
   - Someone is actively using the computed value

3. **`sync(setter => {...})`**: A signal with manual control over its lifecycle:

   ```ts
   const time = sync<number>((set) => {
       // This runs when the signal gets its first follower
       const interval = setInterval(() => set(Date.now()), 1000);

       // This cleanup runs when the signal has no more followers
       return () => clearInterval(interval);
   });
   ```

### Following Changes

To react to signal changes, use the `.follow()` method:

```ts
// Register a callback that runs whenever count changes
const stopFollowing = count.follow((value) => {
    console.log(`Count is now ${value}`);
}, true); // The 'true' means run immediately with current value

// Later, to stop following:
stopFollowing();
```

Inside `.follow()`, purify tracks when signals start and stop being used. When a signal has no followers, its resources can be cleaned up.

### Deriving New Signals

You can transform signals using `.derive()`:

```ts
const count = ref(0);
const message = count.derive((n) => `The count is ${n}`);

message.follow(console.log); // "The count is 0" when count changes
```

The `.derive()` method creates a new signal that updates whenever the source signal changes.

### derive() vs computed()

Both `.derive()` and `computed()` create reactive values, but they serve different purposes:

```ts
// derive() transforms a single signal
const count = ref(0);
const doubled = count.derive((n) => n * 2);

// computed() can depend on multiple signals
const count1 = ref(0);
const count2 = ref(0);
const sum = computed(() => count1.get() + count2.get());
```

Key differences:

1. **Dependency tracking**:
   - `.derive()` always depends on the source signal it's called on
   - `computed()` automatically tracks any signal accessed in its callback

2. **Chaining**:
   - `.derive()` is chainable for multiple transformations:
     ```ts
     count.derive((n) => n * 2).derive((n) => `Value: ${n}`);
     ```
   - `computed()` creates standalone signals, better for complex calculations

3. **Usage context**:
   - `.derive()` is perfect for transforming a single signal's value
   - `computed()` is better when combining multiple signals or for complex logic

## DOM Building

### Creating Elements

The `tags` proxy creates HTML elements with reactive capabilities:

```ts
import { tags } from "@purifyjs/core";
// Always destructure tags for cleaner usage
const { div, button, input } = tags;

// Elements can be created with initial attributes
const container = div({ class: "container", id: "app" });

// Or configured with methods after creation
const submitButton = button()
    .type("submit")
    .textContent("Submit");
```

Under the hood, `tags` creates custom elements that extend the native element types, enabling lifecycle hooks while preserving all native
behavior.

### Attributes vs Properties

The DOM offers two ways to configure elements:

- Attributes
- Properties

**purify.js** supports both approaches:

```ts
const { div, button } = tags;

// Setting via attributes object (during creation)
const div1 = div({
    id: "app", // Sets the "id" attribute
    class: "container", // Sets the "class" attribute
});

// Setting via property setter methods (after creation)
const div2 = div()
    .id("app") // Sets the id property
    .className("Hello"); // Sets the className property
```

Some important distinctions:

- Use the attribute syntax for attributes: `div({ class: "x" })`
- Use method calls for properties: `div().textContent("x")`
- Both approaches are chainable, but attributes must be set during element creation

### The Builder Pattern

Every element you create with `tags` is wrapped in a `Builder` instance:

```ts
const { div } = tags;
const element = div(); // Returns a Builder<WithLifecycle<HTMLDivElement>>

// Access the raw DOM node with $node
document.body.append(element.$node);
```

You can also create a Builder from any existing DOM node:

```ts
import { Builder } from "@purifyjs/core";

// Works with any Node type (Element, Document, ShadowRoot, DocumentFragment, etc)
const bodyBuilder = new Builder(document.body);
const shadowBuilder = new Builder(element.$node.attachShadow({ mode: "open" }));

// Use the builder to modify the node
bodyBuilder.append$(
    div({ class: "container" }).append$(
        "Hello world",
    ),
);
```

### Understanding `$` in Method and Property Names

**purify.js** uses the `$` character in two important ways to distinguish special functionality.

#### Methods with `$` Suffix

Methods ending with `$` accept signals and arrays as arguments and automatically convert them to DOM nodes recursively:

```ts
const { div, span } = tags;
const count = ref(0);

div({ class: "container" }).append$(
    "Regular text", // Plain string
    count, // Signal (wrapped in a container element)
    [span(), div()], // Array (converted to DocumentFragment)
);
```

Without the `$` suffix, you'd need to manually convert everything to DOM nodes using `toChild()`.

The internal conversion for signals wraps them in a container element with `display: contents`:

```ts
// What happens internally when you append a signal
tags.div({ style: "display:contents" })
    .$bind((element) =>
        signal.follow(
            (value) => element.replaceChildren(toChild(value)),
            true,
        )
    );
```

##### CSS Selector Considerations

Although container elements use `display: contents`, they still exist in the DOM tree. This can impact CSS selectors like:

```css
.parent > .child {} /* Won't match if there's a signal wrapper in between */
.parent :first-child {} /* Might select the wrapper instead of content */
```

To avoid these issues with signal containers, consider:

1. Using property setters for text content where possible:
   ```ts
   // Better than append$(textSignal) for simple text
   div().textContent(computed(() => `Welcome ${currentUser.get().name}`));
   ```

2. Creating custom helper functions for specific DOM updates (see the "Helper Functions" section)

#### Properties with `$` Prefix

Properties beginning with `$` are for custom additions to elements so they don't conflict with standard DOM properties:

```ts
const { input } = tags;

// $bind connects a function to an element's lifecycle
input().type("text").$bind((element) => {
    // Runs when element connects to DOM
    const listener = () => console.log(element.value);
    element.addEventListener("input", listener);

    // Return optional cleanup function
    return () => element.removeEventListener("input", listener);
});
```

### Working with Signals in the DOM

When you include a signal in `.append$()` or similar methods, purify automatically sets up subscriptions:

```ts
const { div } = tags;
const currentUser = ref("Guest");

div({ class: "greeting" }).append$("Welcome, ", currentUser);
```

As mention before `$` suffix removes the need for `toChild()`:

```ts
const { div } = tags;
const currentUser = ref("Guest");

div({ class: "greeting" }).append("Welcome, ", toChild(currentUser));
```

If we try to inline what `toChild()` is doing above, under the hood, each signal is wrapped in a hidden container element (a div with
`display: contents`):

```ts
// What happens internally when you append a signal:
div({ class: "greeting" }).append(
    "Welcome, ",
    // Signal wrapping (simplified internal implementation):
    tags.div({ style: "display:contents" })
        .$bind((element) => currentUser.follow((value) => element.replaceChildren(value), true)).$node,
);
```

This approach ensures:

- The signal's value is properly displayed
- Updates only affect the specific signal's wrapper element
- The wrapper element is invisible in the rendered output (thanks to `display: contents`)
- The element is automatically cleaned up when disconnected from the DOM

### Helper Functions for DOM Updates

You can create reusable helper functions for common DOM manipulation patterns. By convention, these helpers are prefixed with `use` when
they're intended for `$bind()`:

```ts
// Helper for replacing element children with signal values
export function useReplaceChildren<T extends Member>(signal: Sync<T>): Lifecycle.OnConnected {
    return (element) =>
        signal.follow(
            (value) => element.replaceChildren(toChild(value)),
            true,
        );
}

// Using the helper
div().$bind(useReplaceChildren(computed(() => ["Welcome", currentUser.get()])));

// Helper for class toggling based on a signal
export function useToggleClass(className: string, condition: Sync<boolean>): Lifecycle.OnConnected {
    return (element) =>
        condition.follow((value) => {
            element.classList.toggle(className, value);
        }, true);
}

// Using the helper
div().$bind(useToggleClass("active", isActiveSignal));
```

This pattern helps keep your code clean and encourages reusability.

### Signals Require Lifecycle Support

An important restriction to know is that signals can only be used with elements that have the `WithLifecycle` mixin applied:

```ts
import { Builder, ref } from "@purifyjs/core";
const { div } = tags;
const count = ref(0);

// This works - elements from tags have lifecycle capabilities
div().textContent(count); // ✓ OK - Builder<WithLifecycle<HTMLDivElement>>

// This doesn't work - regular DOM elements don't have lifecycle support
const regularDiv = document.createElement("div");
new Builder(regularDiv).textContent(count); // ❌ Error: type and runtime

// To use signals with regular DOM elements, apply WithLifecycle first
import { WithLifecycle } from "@purifyjs/core";
const LifecycleDiv = WithLifecycle(HTMLDivElement);
const enhancedDiv = new LifecycleDiv();
new Builder(enhancedDiv).textContent(count); // ✓ OK
```

This limitation exists because purify needs to track when elements connect and disconnect from the DOM to properly manage signal
subscriptions and cleanup.

## Lifecycle Management

### WithLifecycle Mixin

The `WithLifecycle` mixin adds connection awareness to elements:

```ts
import { WithLifecycle } from "@purifyjs/core";

// Add lifecycle capabilities to any HTMLElement type
const LifecycleButton = WithLifecycle(HTMLButtonElement);
const button = new LifecycleButton();

// The mixin is cached, so subsequent calls return the same extended class
const SameLifecycleButton = WithLifecycle(HTMLButtonElement); // Uses cached version

// Most commonly used through the tags proxy, which applies WithLifecycle automatically
const { button: buttonTag } = tags;
const lifecycledButton = buttonTag(); // Already has lifecycle capabilities
```

The mixin only works with HTMLElement subclasses, not other Node types like Text or DocumentFragment.

### Using $bind for Lifecycle Events

Elements with lifecycle capabilities can use the `$bind` method:

```ts
const { div } = tags;

// The callback runs when the element connects to the DOM
div().$bind((el) => {
    console.log("Element connected!");

    // Optional return function runs when disconnected
    return () => console.log("Element disconnected!");
});
```

This is how purify implements efficient cleanup of event listeners and signal subscriptions.

### Building Components

**purify.js** doesn't have an idea of "components". It doesn't enforce any specific structure for building components like larger
frameworks, but you can create reusable UI pieces using the Builder pattern:

```ts
function Counter() {
    const { div, button } = tags;
    const count = ref(0);

    return div({ class: "counter" }).append$(
        "Count: ",
        count,
        button()
            .textContent("+")
            .onclick(() => count.val++),
        button()
            .textContent("-")
            .onclick(() => count.val--),
    );
}

// Use it with a Builder
new Builder(document.body).append$(
    Counter(),
);
// Or directly append the node
document.body.append(Counter().$node);
// Or change the body
document.body.replaceWith(
    tags.body().append$(Counter()),
);
```

## Advanced Patterns

### Two-way Binding

Create two-way bindings between form controls and signals:

```ts
function useValue(value: Sync.Ref<string>): Lifecycle.OnConnected<HTMLInputElement> {
    return (element) => {
        const abortController = new AbortController();
        element.addEventListener("input", () => value.set(element.value), { signal: abortController.signal });
        const unfollow = value.follow((value) => element.value = value, true);

        return () => {
            abortController.abort();
            unfollow();
        };
    };
}

const { input } = tags;

function TextInput(value: Sync.Ref<string>) {
    return input()
        .type("text")
        .$bind(useValue(value));
}
```

### Shadow DOM Integration

Work directly with Shadow DOM for encapsulated components:

```ts
function ShadowComponent() {
    const host = tags.div();

    // Create Shadow DOM and Builder for it
    const shadow = new Builder(
        host.$node.attachShadow({ mode: "open" }),
    );

    // Build inside the shadow root
    shadow.append$(
        tags.div().textContent("I'm inside shadow DOM!"),
    );

    return host;
}
```

### Web Components

Create standards-compliant custom elements:

```ts
import { Builder, ref, WithLifecycle } from "@purifyjs/core";

const { button } = tags;

class CounterElement extends WithLifecycle(HTMLElement) {
    static {
        // Define the element in the registry
        customElements.define("x-counter", CounterElement);
    }

    #count = ref(0);

    constructor() {
        super();
        const self = new Builder<CounterElement>(this);

        self.append$(
            "Count: ",
            this.#count,
            button()
                .textContent("+")
                .onclick(() => this.#count.val++),
        );
    }
}
```

## Performance Considerations

- Signal followers are called synchronously during updates.
- Signals only update when their value actually changes (equality check).
- If a signal has no followers, it cleans up resources automatically.
- Computed signals only recalculate when both accessed and dependent values change
- For simplicity, maximum flexibility, and control, DOM updates are decided by the user, not the library, allowing for fine-grained control
  over when and how the DOM is updated.

## Summary

**purify.js** provides a minimalist yet powerful approach to building reactive UIs:

- Use signals (`ref`, `computed`, `sync`) for reactivity
- Create elements with the `tags` proxy
- Configure elements with the `Builder` pattern
- Use `$` suffix methods for working with signals and arrays
- Manage lifecycles with `WithLifecycle` and `$bind`

With these core concepts mastered, you can build complex, performant UIs with minimal code and maximum flexibility.
