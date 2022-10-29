import { ComponentInstance } from "../component"
import { html } from "../template"
import { Test } from "./test"

export class Root extends ComponentInstance
{
    async onMount()
    {
    }

    async render()
    {
        return html`
            <div id="root">
                ${new Test()}
            </div>`
    }
}