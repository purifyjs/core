import { defineElement } from "../framework"
import { html } from "../template"
import { Counter } from "./counter"

export const App = defineElement('x-app', ({ self: $ }) => 
{
    const someSignal = $.$signal(0)

    return html`
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

        <x ${Counter({ number: someSignal })} class="hey" id="counter">
            Click me!!
        </x>

        ${html`
            <p>Hey</p>
        `}

        ${2 + 2}
        ${[123, 456, 789]}
        ${{}}
        ${new Date()}
        ${new Error()}
        ${null}
        ${undefined}
        ${Promise.resolve()}
    </main>`
})

const app = App({})
await app.$mount(document.querySelector('#app')!)