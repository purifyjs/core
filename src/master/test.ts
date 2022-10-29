import { html } from "./template"

export let hellow = "world"
let hidden = 123

export async function onMount()
{
    console.log("mounted")
}

export async function onRender()
{
    hellow = "world2"
    console.log("rendered")
}

export default () => html`<h1 on:abc="1" test="1">Hello ${hellow} ${hidden}<Abc></Abc></h1>`