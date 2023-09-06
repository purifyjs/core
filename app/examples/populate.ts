import { populate, tagsNS } from "../../lib/core"

const { div, span } = tagsNS

const myDiv = div()
populate(myDiv, { class: "hello" }, "Hello", span({}, "World"))
