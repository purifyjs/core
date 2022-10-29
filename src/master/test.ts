import { component, ComponentInstance } from "./component"
import { html } from "./template"

export const Test = component(class extends ComponentInstance
{
    hellow = "world"
    hidden = 123


    async onMount()
    {
        console.log("mounted")
    }

    async render()
    {
        this.hellow = "world2"
        console.log("rendered")
        return html`<h1 on:abc="1" test="1">Hello ${this.hellow} ${this.hidden}<Abc></Abc></h1>`
    }
})