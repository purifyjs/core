import { fragment, ref, tags } from "@purifyjs/core"

const host = tags
    .div({ "aria-atomic": ref("true") })
    .append(tags.span().textContent("Hello").element)
    .onclick(() => alert())
    .effect(() => {
        console.log("Connected")
        return () => console.log("Disconnected")
    })

document.body.append(fragment(host))
