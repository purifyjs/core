<p align="center">
  <img src="https://ipfs.io/ipfs/QmW6Q7ifwuaR9HKSnNcwyXu8DsJVHrXHQ4w89paEJ9qRRx" />
</p>

# MasterTS : A Breath of Fresh Air

A straight and clean TypeScript library for building user interfaces

MasterTS is a frontend library for building single-page applications (SPAs) using Web Components and TypeScript. It is designed to be lightweight and easy to use, with a focus on transparency and simplicity.

### Warning

Please note that MasterTS is currently a work in progress prototype and is not ready for production use (probably).

## Install

```bash
npm i https://github.com/DeepDoge/master-ts.git -D
```

### Extensions
Recommended extensions for inline html syntax highlight, intellij and formatting: [MasterTS Recommended Extensions](https://github.com/DeepDoge/master-ts-vite-demo/blob/master/.vscode/extensions.json)

### Documentation

Too early for that, but gonna make one when I stop making breaking changes.<br/>
IDK when this will happen but if I don't make any breaking change for 2 months, then I'm writing the documentation.<br/>
Until then check out the [Vite Example](#example)

### Example

For an example of how to use MasterTS, see the [MasterTS Vite Example](https://github.com/DeepDoge/master-ts-vite-demo).

### Motivation

There are many frontend libraries available for building SPAs, but most of them are either too complex or a mess of "features" that are just duct tape solutions.

MasterTS is designed to be simple and easy to use, with a focus on transparency and simplicity.

-   MasterTS uses TS files which allows for a more natural and intuitive development experience.
-   MasterTS can work with any other libraries and frameworks.
-   It's lightweight and has no dependencies.
-   It uses the syntax that is already available in TS and HTML.
-   It's reactive like SolidJS so it only updates the changing parts of the DOM, which is more efficient than other libraries.
-   It's also fast and efficient because its built on top of native Shadow DOM and Web Components API.
-   It uses Template Literals to create HTML elements which let's you write HTML in a more natural way with in a TS file.
-   It doesn't hide anything from you and doesn't do anything without your knowledge. It's transparent and simple.

Basically it combines the best parts of Svelte, Lit, React and SolidJS into one library.<br/>
Like Svelte it's trying to be simple and readable<br/>
Like React it uses functions to create HTML elements and components, so it's natural and intuitive to use.<br/>
It's also similar to Lit that it uses Template Literals to create HTML elements which let's you write HTML in a more natural way with in a TS file.<br/>
And different from any other frameworks or libraries, while it's allowing you to use attributes on your components such as class, id, style, etc.
as well as directives such as `on:` which let's you bind to events, it also has a clear seperation between props and attributes, without any prefix or suffix.<br/>
Like Svelte it has a syntax to toggle classes or change style properties, eg. `class:active` and `style:color`.<br/>
It also has a syntax to bind to events, eg. `on:click`.<br/>

Take a look at the [#Example](#example)

### Note

Initially, the goal of MasterTS was to create a library with resumable server-side rendering (SSR), similar to Qwik. While it was possible to achieve this, it became clear that significant sacrifices would need to be made in order to make it work correctly. Since MasterTS is intended for use with platforms like IPFS, which do not have a server or cloud infrastructure, it was decided that an SPA was sufficient for now. It is possible that additional features and changes will be made in the future.

### Development

If you wanna work on MasterTS, it is recommended to use the [MasterTS Workspace](https://github.com/DeepDoge/master-ts-workspace) for a better developer experience.
