import { ComponentInstance, registerComponent } from "../component"
import { html } from "../template"
import { Test } from "./Test"

export const { Root } = registerComponent({
    Root: class extends ComponentInstance
    {
        onRender()
        {
            return (html`<div>${new Test()}</div>`)
        }
    }
})