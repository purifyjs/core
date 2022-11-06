import { defineFragment } from "../framework"
import type { Signal } from "../signal"
import { html } from "../template"

interface Props
{
    number: Signal<number>
}

export const Counter = defineFragment<Props>(({ props }) =>
    html`<button on:click=${()=> props.number.signal((v) => v + 1)}>Click Me! ${props.number}</button>`)