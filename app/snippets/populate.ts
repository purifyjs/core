import { populate, tagsNS } from "../../lib/core"

/* 
You can also use `populate()` to populate an already exisiting DOM element with attributes, directives, and content.
*/

const { div, span } = tagsNS

const myDiv = div()
populate(myDiv, { class: "hello" }, "Hello", span({}, "World"))
