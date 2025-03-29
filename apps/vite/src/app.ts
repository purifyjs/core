import { Builder, state, tags } from "@purifyjs/core";

const time = state(new Date().toLocaleString(), (set) => {
    const interval = setInterval(() => set(new Date().toLocaleString()), 1000);
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
