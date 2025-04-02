import { Builder, signal, tags, toChild } from "@purifyjs/core";

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

new Builder(document.body).append$(
    tags.div({ "data-time": time }).append$(
        "Hello ",
        tags.strong().textContent("World"),
        tags
            .span({ "data-time": time })
            .append$([time], [[tags.div()]])
            .ariaLabel(time)
            .click()
            .setAttribute("foo", "bar"),
        tags.div().$bind((element) =>
            time.follow((time) => element.replaceChildren(toChild(time)))
        ),
    ),
);
