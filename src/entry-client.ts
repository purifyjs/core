import { createComponentFactory } from "./master"
import "./master/framework"
import { html } from "./master/template"

const TestComponent = createComponentFactory<{ value: string }>({ value: "test" },
    (props) => html`
    <div component:id="0" on:click="0">
        ${props.value}
    </div>
`)

TestComponent.renderMount({ value: "test" }, document.body)