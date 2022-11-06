import { defineElement } from "../framework"
import type { Signal } from "../signal"
import { html } from "../template"
import { randomId } from "../utils/id"
import { Test2 } from "./test2"

interface Props
{
    number: number
    string?: Signal<string | null>
}

export const Test = defineElement<Props>('x-test', ({ props, self }) => 
{
    const date = self.$signal(new Date())
    self.$interval(() => date.signal(new Date()), 1000)

    const value = self.$signal(randomId())
    self.$interval(() => value.signal(randomId()), 500)

    const valueText = self.$signalDerive(() => `foo-${value.value}`, value)

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
        <span class=${self.$signalDerive(() => `bar ${valueText.value}`, valueText)}>
            ${date}
        </span>
        ${Test2({ number: 123 })}
        <pre>${props.number}</pre>
        `
})