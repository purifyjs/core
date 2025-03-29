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
