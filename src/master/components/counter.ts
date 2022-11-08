import { defineElement } from "../framework/element"
import type { SignalValue } from "../framework/signal"
import { html } from "../framework/template"

interface Props
{
    number: SignalValue<number>
}

export const Counter = defineElement<Props>('my-counter', ({ props: { number } }) =>
    html`
        <button on:click=${()=> number.update((v) => v + 1)}>
            <slot>Placeholder</slot> ${number}
        </button>`)