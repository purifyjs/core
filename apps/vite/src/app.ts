import { Builder, ref, tags } from "@purifyjs/core"

const time = ref(new Date().toLocaleString(), (set) => {
    const interval = setInterval(() => set(new Date().toLocaleString()), 1000)
    return () => {
        clearInterval(interval)
    }
})

new Builder(document.body).append(
    tags
        .div({ "data-time": time })
        .replaceChildren(
            ref(ref("")),
            "Hello ",
            time,
            tags.strong().textContent("World"),
            tags
                .span({ "data-time": time })
                .textContent(time)
                .attribute("data-something", "nothing")
                .attribute("data-time-2", time)
        )
)
