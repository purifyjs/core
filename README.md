<p align="center">
  <img src="https://ipfs.io/ipfs/QmW6Q7ifwuaR9HKSnNcwyXu8DsJVHrXHQ4w89paEJ9qRRx" />
</p>

# MasterTS : A Breath of Fresh Air

A straight and clean TypeScript library for building user interfaces.

MasterTS is a library for building single-page applications (SPAs) using Signals, Web Components and TypeScript. It is designed to be lightweight and easy to use, with a focus on transparency and simplicity.

### Warning

Please note that MasterTS is currently a work in progress prototype and is not ready for production use (probably).

## Install

```bash
npm i github:DeepDoge/master-ts#0.0.1 -D
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

There are many frontend libraries available for building SPAs, but most of them are either too complex or a mess of "features" that are just duct tape solutions.<br/>
Many have good sides, and some are better than others, but still have bad sides.

In React, reactivity is not great, most of the time you have to ask yourself "Will it re-render?".
And Svelte's problem is the components. Components in Svelte have this nice reactivity thanks to their compiler.<br/>
But when you try to make more complex combinations of reactive values with it, it starts to become problematic.<br/>
It becomes even more problematic when you try to combine stores with compiled reactive values that you have to find hacky solutions around.<br/>
MasterTS only has one thing that is reactive, and that is the signals; they are easy to see, detect, and use.<br/>
They can be used anywhere anyway in any combination, without the need for hacks and boilerplate code.

Another problem with Svelte, React, and many other frameworks is that components are not HTML Nodes, especially in Svelte using components as a value mostly feels hacky with no full TypeScript support.<br/>
MasterTS uses Web-Components like Lit, so a component is just another HTML Node that you can use and store in any way. It's not special and doesn't have any pitfalls.

In SolidJS and React, we use TSX, which lets you define components in any way you want; they are just functions returning a component.<br/>
MasterTS follows the same path; components can be defined and created in any way, so it's modular. <br/>
But also in MasterTS these functions can be async.

Svelte expects you to rely on the compiler so much. It expects you to use `.svelte` file extension for your components, which is not really modular and free and doesn't have full TypeScript support, and when it has TypeScript support, it's not always great.<br/>
In MasterTS, we use `.ts` files, so TypeScript is the first-class citizen and natively supported.<br/>

So MasterTS is the combination of these (with some changes):

-   It gets signals from SolidJS but doesn't return it with a getter, setter tuple and makes it easy to detect at runtime.
-   It gets function-based components from React's TSX, and even more flexible.
-   It gets HTML template syntax and stores from Svelte, but stores are signals.
-   It uses Web-Components like Lit while also lets you use fragments without Web-Components.
-   It's just a TS library.

So, MasterTS is designed to be simple and easy to use, with a focus on transparency, simplicity, and modularity.

**Simple:** It does what you expect it to do. Everything is either an HTML Node or a Signal.

**Transparent:** It prioritizes not hiding things from you. Everything is where it should be.

**Modular:** It doesn't tell you where and how to define things. Everything is easy to understand and combine.

### Note

Initially, the goal of MasterTS was to create a library with resumable server-side rendering (SSR), similar to Qwik. While it was possible to achieve this, it became clear that significant sacrifices would need to be made in order to make it work correctly. Since MasterTS is intended for use with platforms like IPFS, which do not have a server or cloud infrastructure, it was decided that an SPA was sufficient for now. It is possible that additional features and changes will be made in the future.

### Development

If you wanna work on development of the MasterTS, it is recommended to use the [MasterTS Workspace](https://github.com/DeepDoge/master-ts-workspace) for a better developer experience.
