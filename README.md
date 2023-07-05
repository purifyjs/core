<p align="center">
<img src="https://ipfs.io/ipfs/QmW6Q7ifwuaR9HKSnNcwyXu8DsJVHrXHQ4w89paEJ9qRRx" />
</p>

# MasterTS: A Breath of Fresh Air

MasterTS is a clean and lightweight TypeScript library for building user interfaces, focusing on simplicity and modularity. It leverages Signals, Web Components, and TypeScript to create single-page applications (SPAs).

**Warning:** MasterTS is currently a work in progress prototype and is not suitable for production use.

## Install

To install MasterTS, please refer to the [Install Instructions](https://github.com/DeepDoge/master-ts/releases) available in the repository.

## Vite Plugin

MasterTS is a UI building library. So you may wonder, why does a library have a "Vite" plugin? The truth is, you don't actually need this plugin for MasterTS to work. The plugin simply bakes your MasterTS code, including HTML templates, at build time to improve runtime performance.

So it's recommended that you use [MasterTS Vite Plugin](https://github.com/DeepDoge/master-ts-vite-plugin)

## Documentation

Although documentation is not yet available, it will be created once breaking changes cease for a period of 2 months. In the meantime, you can explore the [Examples](#examples) provided.

## Examples

-   [MasterTS Vite Example](https://github.com/DeepDoge/master-ts-vite-demo): A demo project showcasing MasterTS with Vite.
-   [DeepDoge/eternis](https://github.com/DeepDoge/eternis): A project utilizing MasterTS. (Up to date with the latest version of the MasterTS)
-   [Chrome Extension](https://github.com/DeepDoge/youtube-custom-shortcuts): A YouTube custom shortcuts extension.

## Motivation

MasterTS aims to address the limitations of other frontend libraries for SPAs by combining the best features of SolidJS, React's TSX, and Svelte. It introduces signals for reactivity, treats components as HTMLElement(s), and offers native TypeScript support. The library prioritizes simplicity, transparency, and modularity, providing straightforward and easy-to-use solutions without unnecessary complexity.

MasterTS is a breath of fresh air in this mad world.

### Downsides of other libraries/frameworks

#### Svelte

Svelte is a language with its own compiler, and this creates some issues.

##### Svelte is not TypeScript first:

```svelte
<scirpt lang="ts">
    export let value: Foo | Bar | null = null
</script>
{#if value instanceof Foo}
    <button on:click=${() => send(value)}>Send Foo</button>
{:else if value instanceof Bar}
    <button on:click=${() => send(value)}>Send Bar</button>
{/if}
```

This will give an error because `value` is being used inside a function at `on:click`.<br/>
So we don't know if `value` is `Foo` or `Bar` in `on:click` function.<br/>
But Foo `<button>` is only being rendered when `value` is `Foo`, so it should be safe to use `value` as `Foo` in `on:click` function.<br/>
As a reflex you might try to do this:

```svelte
<button on:click=${() => send(value as Foo)}>Send Foo</button>
```

But this won't work becuase Svelte doesn't allow TypeScript outside of the `<script lang="ts">` tag.<br/>
Because Svelte is not designed to work with TypeScript. It's designed to work with Javascript.<br/>
It's not TypeScript first.

##### Svelte is not a TypeScript library:

Let's say you are making a post based app, you have a cached store for each post, so when post changes it changes everywhere.
And you have a component that get's a post based on id and renders it.

```svelte
<script lang="ts">
    const Loading = Symbol("Loading");
    type Loading = typeof Loading;

    export let postId: string;

    let post = Loading as Readable<Post> | Loading | Error
</script>

{#if post === Loading}
    <p>Loading...</p>
{:else if post instanceof Error}
    <p>{post.message}</p>
{:else}
    <p>{$post.title}</p>
{/if}
```

You would expect this code to work without any problem.
But this will yell at you and say this:

```
Cannot use 'post' as a store. 'post' needs to be an object with a subscribe method on it.
```

Even thought we narrowed down the type of `post` to `Readable<Post>` at the `else` block, Svelte doesn't care.

Svelte is compiler magic, not a library.

##### Svelte is HTML:

Svelte Components similar to HTML files. Svelte Components are not designed to be created outside of the template.<br/>
Even thought it's possible to create Svelte Components outside of the template, it's not that great and it has typing issues.

And Svelte Components are not even native `HTMLElement`s.

#### React

React.

### Why MasterTS is better

#### MasterTS is TypeScript first

MasterTS is a TypeScript library. It's designed to work with TypeScript.

#### MasterTS is a library

In MasterTS, there is no magic compiler syntax. It's just TypeScript, no `.tsx` or `.svelte` files.

MasterTS's vite plugin can still optimize and bake your MasterTS code at build time, but it's not required.<br/>
There is no syntax or functionality that requires the plugin.<br/>
So you still write TypeScript, there is no magic compiler syntax.

#### MasterTS is TypeScript

Create components anywhere in any way you want. Wrap them with anything you want. It's just TypeScript.

There is no two different reactivity systems like in Svelte.<br/>
There is no question of when will it re-render like in React.<br/>
There is no `.tsx` or `.svelte` files.<br/>
There is no magic compiler syntax.<br/>
Mount and unmount the html `Node` again and again and again.

It's just TypeScript.<br/>
It's just `HTMLElement`.<br/>
It's just Signals.<br/>
It's just fun!
