import { defineElement } from "../framework"
import { Signal } from "../signal"
import { html } from "../template"

interface Props
{
    number: number
    string?: Signal<string | null>
}

export const Test = defineElement<Props>('x-test', async ({ props }) => 
{
    const date = new Signal(new Date())

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
        <x-text>
        <span>
            ${date}
        </span>
        <slot></slot>
        <pre>${props.number}</pre>
        </x-text>
        `
})