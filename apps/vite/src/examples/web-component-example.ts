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
