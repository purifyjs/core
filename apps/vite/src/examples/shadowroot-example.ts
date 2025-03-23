import { Builder, ref, tags } from "@purifyjs/core";

const { div, button } = tags;

function App() {
    return div().id("app").children(Counter());
}

function Counter() {
    const host = div();
    const shadow = new Builder(host.node.attachShadow({ mode: "open" }));

    const count = ref(0);

    shadow.children(
        button()
            .title("Click me!")
            .onclick(() => count.val++)
            .children("Count:", count),
    );
    return host;
}

document.body.append(App().node);
