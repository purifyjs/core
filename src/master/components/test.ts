import { defineElement } from "../framework"
import { Signal } from "../signal"
import { html } from "../template"
import { Test2 } from "./test2"

interface Props
{
    number: number
    string?: Signal<string | null>
}

export const Test = defineElement<Props>('x-test', ({ props, element }) => 
{
    const date = new Signal(new Date())
    const interval = setInterval(() => date.signal(new Date()), 1000)
    element.$onDestroy(() => clearInterval(interval))

    return html`
        <style>
            :host {
                display: grid;
                gap: 1em;
                grid-template-columns: 1fr 1fr 1fr;
                place-items: center;
                background: green;
                color: white
            }
        </style>
        <span class=${date}>
            ${date}
        </span>
        ${Test2({ number: 123 })}
        <pre>${props.number}</pre>
        `
})