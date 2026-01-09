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
