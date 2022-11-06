import { defineFragment } from "../framework"
import { Signal } from "../signal"
import { html } from "../template"
import { Counter } from "./counter"
import { Test } from "./test"

export const App = defineFragment(() => html`
    <style>
        h1 + p, main:has(h1)  {
            color: red;
        }
    </style>
    <style :global>
        :root {
            font-size: 1.2rem
        }
    </style>
    <main>
        <h1>Master</h1>
        <p>Master is a framework for building web apps.</p>
        <p>It's a work in progress.</p>
        <p>It's not ready for production.</p>
        <p>It's not ready for anything.</p>
    
        ${Test({ number: 123 }, html`
            <p>Test</p>
        `)}

        ${Counter({ number: new Signal(0) })}
    </main>`)

const app = App({})
await app.$mount(document.querySelector('#app')!)