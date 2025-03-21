import { Builder, computed, ref, tags } from "@purifyjs/core"
console.log(computed, ref, tags)

const time = ref(new Date().toLocaleString(), (set) => {
    const interval = setInterval(() => set(new Date().toLocaleString()), 1000)
    return () => {
        clearInterval(interval)
    }
})

new Builder(document.body).append(
    tags.div().replaceChildren("Hello ", tags.strong().textContent("World"), tags.span().textContent(time))
)
