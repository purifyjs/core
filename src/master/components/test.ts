import { ComponentInstance } from "../component"
import { html } from "../template"

export class Test extends ComponentInstance
{
    test: string = "test"

    async onMount()
    {
        alert(this.test)
    }

    async render()
    {
        this.test = 'test2'
        return html`<p>Hellow World ${this.test}</p>`
    }
}