import { defineElement } from "../framework"
import type { Signal } from "../signal"
import { html } from "../template"

interface Props
{
    number: Signal<number>
}

export const Counter = defineElement<Props>('my-counter', ({ props: { number } }) =>
    html`
        <button on:click=${() => number.signal((v) => v + 1)}>
            <slot>Placeholder</slot> ${number}
        </button>`)