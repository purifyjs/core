import { ComponentInstance, registerComponent } from "../component"
import { Signal } from "../signal"
import { html } from "../template"

export const { Test } = registerComponent({
    Test: class extends ComponentInstance
    {
        someText = new Signal<string | null>(null)

        updateSomeText()
        {
            this.someText.signal(`Random: ${Math.random()}`)
        }

        async onMount()
        {
            setInterval(() => this.updateSomeText(), 1000)
        }

        onRender()
        {
            this.updateSomeText()
            return (html`<div>Hello world! ${this.someText}</div>`)
        }
    }
})