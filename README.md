<p align="center">
<img src="https://ipfs.io/ipfs/QmW6Q7ifwuaR9HKSnNcwyXu8DsJVHrXHQ4w89paEJ9qRRx" />
</p>

# MasterTS: A Breath of Fresh Air

MasterTS is a clean and lightweight TypeScript library for building user interfaces, focusing on simplicity and modularity. It leverages Signals, Web Components, and TypeScript to create single-page applications (SPAs).

**Empty MasterTS+Vite project bundle size with gzip, everything imported:** `4.29kb` 

**Warning:** MasterTS is currently a work in progress prototype and is not suitable for production use.

## Install

(BIG CHANGES HAPPENING SO MIGHT NOT WORK RIGHT, TRY OLDER VERSIONS)

To install MasterTS, please refer to the [Install Instructions](https://github.com/DeepDoge/master-ts/releases) available in the repository.

## Vite Plugin

MasterTS is a UI building library. So you may wonder, why does a library have a "Vite" plugin? The truth is, you don't actually need this plugin for MasterTS to work. The plugin simply bakes your MasterTS code, including HTML templates, at build time to improve runtime performance.

So it's recommended that you use [MasterTS Vite Plugin](https://github.com/DeepDoge/master-ts-vite-plugin)

## Documentation

Although documentation is not yet available, it will be created once breaking changes cease for a period of 2 months. In the meantime, you can explore the [Examples](#examples) provided.

## Examples

-  [MasterTS Vite Example](https://github.com/DeepDoge/master-ts-vite-demo): A demo project showcasing MasterTS with Vite.
-  [DeepDoge/eternis](https://github.com/DeepDoge/eternis): A project utilizing MasterTS. (Up to date with the latest version of the MasterTS)
-  [Chrome Extension](https://github.com/DeepDoge/youtube-custom-shortcuts): A YouTube custom shortcuts extension.

## Motivation

MasterTS aims to address the limitations of other frontend libraries for SPAs by combining the best features of SolidJS, React's TSX, and Svelte. It introduces signals for reactivity, treats components as HTMLElement(s), and offers native TypeScript support, predictable, uses function based Components like in JSX but not JSX. The library prioritizes simplicity, transparency, and modularity, providing straightforward and easy-to-use solutions without unnecessary complexity.

MasterTS is a breath of fresh air in this mad world.
