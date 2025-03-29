import { Builder, state, tags } from "@purifyjs/core";

const { div, button } = tags;

function App() {
    return div().id("app").replaceChildren$(Counter());
}

function Counter() {
    const host = div();
    const shadow = new Builder(host.$node.attachShadow({ mode: "open" }));

    const count = state(0);

    shadow.replaceChildren$(
        button()
            .title("Click me!")
            .onclick(() => count.val++)
            .replaceChildren$("Count:", count),
    );
    return host;
}

document.body.append(App().$node);
