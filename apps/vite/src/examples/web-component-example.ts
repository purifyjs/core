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
