import { defineElement } from "../framework/element"
import { html } from "../framework/template"
import { Counter } from "./counter"
import { If } from "./if"

export const App = defineElement('x-app', ({ self: $ }) => 
{
    const counterCount = $.$signal(0)

    $.$subscribe(counterCount, (count) => console.log('Counter count:', count))

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
        <h1>Master.ts</h1>
        <p>Master.ts is a framework for building web apps.</p>
        <p>It's a framework for building web apps.</p>
        <p>It's a work in progress.</p>
        <p>It's not ready for production.</p>

        <h2>Counter</h2>
        <p>Click the button to increment the counter.</p>

        ${2 + 2}
        ${[123, 456, 789]}
        ${{}}
        ${new Date()}
        ${new Error()}
        ${null}
        ${undefined}
        ${Promise.resolve()}
        ${'abc'}
        <span hey="${123} ${'aaa'} ${'"'} ${counterCount}"></span>
        <span hey='${123} ${'aaa'} ${'"'} ${counterCount}'></span>
        <span hey='${123} ${'aaa'} ${"'"} ${counterCount}'></span>

        <div wtf=${counterCount}></div>

        <style>
            main:has(.hello-world) {
                background: #000
            }
        </style>
        <div class:hello-world=${counterCount}>a</div>

        <x ${Counter({ number: counterCount })} class="hey" id="counter">
            Click me!!
        </x>

        ${Counter({ number: counterCount })}
        
        ${If(
        {
            if: counterCount,
            then: () => html`<p>Counter is not 0</p>`,
            else: () => html`<p>Counter is 0</p>`
        })}

        <x ${document.createElement('div')} class="aaaaa">
            abc
        </x>

        <p>Count: ${counterCount}</p>
        <button on:click=${() => counterCount.signal((v) => v + 1)}>Increment</button>
        <button on:click=${() => counterCount.signal((v) => v - 1)}>Decrement</button>
        <button on:click=${() => counterCount.signal((v) => v * 2)}>Double</button>
        <button on:click=${() => counterCount.signal((v) => v / 2)}>Half</button>
        <button on:click=${() => counterCount.signal(0)}>Reset</button>
    </main>`
})

const app = App({})
await app.$mount(document.querySelector('#app')!)