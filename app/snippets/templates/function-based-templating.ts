import { tagsNS } from "@/../../lib/core"

const { div, span } = tagsNS

div({ class: "hello", "on:click": () => alert("Hello World") }, "Hello", span({}, "World"))

/* 
In the example above, you import `tagsNS` proxy, and you destructure `div` and `span` from it. 
You then create the DOM elements using a function call and provide the element's attributes, directives, and content as arguments. 
This approach is more function-oriented and requires you to explicitly call functions to create elements.
*/
