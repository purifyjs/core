import { defineElement } from "../master/framework/element"
import type { SignalValue } from "../master/framework/signal"
import { html } from "../master/framework/template"

interface Props
{
    number: SignalValue<number>
}

export const Counter = defineElement<Props>('my-counter', ({ props: { number } }) =>
    html`
        <button on:click=${()=> number.update((v) => v + 1)}>
            <slot>Placeholder</slot> ${number}
        </button>`)