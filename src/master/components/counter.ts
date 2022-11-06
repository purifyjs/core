import { defineFragment } from "../framework"
import type { Signal } from "../signal"
import { html } from "../template"

interface Props
{
    number: Signal<number>
}

export const Counter = defineFragment<Props>(async ({ props }) => 
{
    return html`<button on:click=${() => props.number.signal((props.number.value ?? 0) + 1)}>Click Me! ${props.number}</button>`
})