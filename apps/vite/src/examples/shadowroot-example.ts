import { Builder, state, tags } from "@purifyjs/core";

const { div, button } = tags;

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
