import { Builder, ref, tags } from "@purifyjs/core";

const time = ref(new Date().toLocaleString(), (set) => {
    const interval = setInterval(() => set(new Date().toLocaleString()), 1000);
    return () => {
        clearInterval(interval);
    };
});

new Builder(document.body).replaceChildren(
    tags
        .div({ "data-time": time })
        .click()
        .replaceChildren(
            "Hello ",
            tags.strong().textContent("World"),
            tags
                .span({ "data-time": time })
                .replaceChildren(time)
                .setAttribute("data-something", "nothing")
                .ariaLabel(time)
        )
);
