import { Builder, signal, tags } from "@purifyjs/core";

const time = signal<string>((set) => {
    const interval = setInterval(update, 1000);
    update();
    function update() {
        set(new Date().toLocaleString());
    }

    return () => {
        clearInterval(interval);
    };
});

new Builder(document.body).replaceChildren$(
    tags.div({ "data-time": time }).replaceChildren$(
        "Hello ",
        tags.strong().textContent("World"),
        tags
            .span({ "data-time": time })
            .replaceChildren$([time], [[tags.div()]])
            .ariaLabel(time)
            .click()
            .setAttribute("foo", "bar"),
    ),
);
