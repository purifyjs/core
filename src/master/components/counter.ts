import { defineElement } from "../framework/element"
import type { Signal } from "../framework/signal"
import { html } from "../framework/template"

interface Props
{
    number: Signal<number>
}

export const Counter = defineElement<Props>('my-counter', ({ props: { number } }) =>
    html`
        <button on:click=${() => number.signal((v) => v + 1)}>
            <slot>Placeholder</slot> ${number}
        </button>`)