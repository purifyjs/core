import { defineFragment } from "../framework"
import { html } from "../template"
import { Test } from "./test"

export const App = defineFragment(async () => html`
    <style>
        h1 + p, main:has(h1)  {
            color: red;
        }
    </style>
    <main>
        <h1>Master</h1>
        <p>Master is a framework for building web apps.</p>
        <p>It's a work in progress.</p>
        <p>It's not ready for production.</p>
        <p>It's not ready for anything.</p>
    
        ${await Test({ number: 123 }, 
            await html`
            <p>Test</p>
        `)}
    </main>`)

document.body.append(await App({}))