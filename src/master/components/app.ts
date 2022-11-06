import { defineElement } from "../framework"
import { Signal } from "../signal"
import { html } from "../template"
import { Counter } from "./counter"
import { Test } from "./test"

export const App = defineElement('x-app', () => html`
    <style>
        h1 + p, main:has(h1)  {
            color: red;
        }

        .hey {
            background: blue;
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

        <x ${Test({ number: 123 })} class="hey" on:click=${() => alert('Hello World')}>
            <p>Test</p>
        </x>
    
        ${Test({ number: 123 }, html`
            <p>Test</p>
        `)}

        ${Counter({ number: new Signal(0) })}
    </main>`)

const app = App({})
await app.$mount(document.querySelector('#app')!)