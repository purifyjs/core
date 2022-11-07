import { defineElement } from "../framework/element"
import { html } from "../framework/fragment"

export const Block = defineElement<{}>('my-block', () =>
    html`
        <style>
            :host {
                display: grid;
                place-items: stretch;
                Width: 5em;
                Height: 2em;
                background: red;
                padding: 1em;
            }

            div {
                background: blue;
            }
        </style>
        <div>
            <slot></slot>
        </div>`
)