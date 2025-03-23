import { Builder, ref, tags, WithLifecycle } from "@purifyjs/core";

const { div, button } = tags;

function App() {
    return div().id("app").replaceChildren$(new CounterElement());
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

    #count = ref(0);

    constructor() {
        super();
        const self = new Builder<CounterElement>(this);

        self.replaceChildren$(
            button()
                .title("Click me!")
                .onclick(() => this.#count.val++)
                .replaceChildren$("Count:", this.#count),
        );
    }
}

document.body.append(App().$node);
