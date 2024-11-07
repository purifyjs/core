import { awaited, Builder, fragment, ref, tags } from "@purifyjs/core"

const { div, span } = tags

const promise = new Promise<Builder<HTMLDivElement>>((resolve) =>
    setTimeout(() => {
        const textDiv = div().textContent("loaded")
        console.log(textDiv)
        resolve(textDiv)
    }, 1000)
)

promise.then(() => {
    console.log("then")
})
promise.finally(() => {
    console.log("finally")
})

const host = div({ "aria-atomic": ref("true") })
    .append(span().textContent("Hello").element)
    .onclick(() => alert())
    .effect(() => {
        console.log("Connected")
        return () => console.log("Disconnected")
    })
    .children(awaited(promise, "loading"))

document.body.append(fragment(host))
