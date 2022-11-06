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

export const Test = defineElement<Props>('x-test', ({ props, self: $ }) => 
{
    const date = $.$signalDerive(() => new Date())
    $.$interval(date.signal, 1000)

    const value = $.$signalDerive(randomId)
    $.$interval(value.signal, 500)

    const valueText = $.$signalDerive(() => `foo-${value.value}`, value)

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
        <span class=${$.$text`bar ${valueText}`}>
            ${date}
        </span>
        <x ${Test2({ number: 123 })}>
            <p>Test</p>
        </x>
        <pre>${props.number}</pre>
        `
})