import { defineElement } from "../framework"
import type { Signal } from "../signal"
import { html } from "../template"

interface Props
{
    number: number
    string?: Signal<string | null>
}

export const Test2 = defineElement<Props>('x-test2', ({ props, self }) => 
{
    const date = self.$signal(new Date())
    self.$interval(() => date.signal(new Date()), 1000)
    
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
        <span>
            ${date}
        </span>
        <slot></slot>
        <pre>${props.number}</pre>
        `
})