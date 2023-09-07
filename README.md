<p align="center">
<img width="420px" height="auto" src="https://ipfs.io/ipfs/QmRzB62LaAwh8JFMSr6PDtedodBuSX9yZbScLwNjPUcn9z" />
</p>
<p align="center">
A lightweight TypeScript library designed for creating Single Page Applications (SPAs) that supercharge vanilla JS. This lightweight library introduces powerful features, including a robust signaling system and seamless templating with full support for signals.
</p>

## Features ⚡

### Core ( no-gzip 3.0kb )

-  Signals with `signal` and `derive` - all of reactivity is possible thanks to signals
-  Templating with `TagsNS` - makes it easier to build dom elements within JS/TS, with support for signals
-  `populate` - Easily populate dom elements with children, attributes and directives such as `style:*`, `class:*`, `on:*` and `bind:value`, with support for signals
-  `onConnected$` - Get a callback when ever a Node (Element, Comment, Text, ...) gets connected/disconnected to/from dom.

### Extra ( no-gzip 2.5kb )

-  Templating tags `html` and `css` - write HTML and CSS within JS/TS
-  `defer` - Deferring signals
-  `each` - Map a array signal while memoizing results with a key for minimum DOM change
-  `awaited` - Await a promise using signals
-  `match` - Pattern matching for both signals and values
-  `keyedCache` - Memoizing anything else you want using keys

## Installation 🍙

[Install Instructions](https://github.com/DeepDoge/master-ts/releases)

## Documentation 🍱

Work in progress

[Currently Available Unfinished Documentation](https://ipfs.io/ipfs/Qma4ZGCFWCKK3iEpyhhc9zVjZE8tPN6iv1UsPFLYyQQPQC)

## Motivation 🍣

In the ever-evolving landscape of web development, we often see a lot of buzz around server-side rendering (SSR) frameworks and libraries. However, when it comes to single-page applications (SPAs), it feels like things have hit a bit of a standstill. Most SPA libraries have stopped growing, leaving developers like you on the hunt for a fresh and lightweight solution to elevate your vanilla JavaScript projects.

Enter "master-ts." This is more than just a library; it's your new secret weapon. While the world is racing toward SSR, "master-ts" is all about revitalizing SPAs to meet today's needs. Our aim is to end the search for a reliable, lightweight SPA library that can seriously amp up your vanilla JavaScript game.

Forget about those heavyweight frameworks; "master-ts" is your go-to for simplicity and efficiency. Whether you're a seasoned developer looking for a smoother workflow or a newcomer eager to dive into web development, "master-ts" has got your back.

The motivation behind "master-ts" is crystal clear: it's about embracing the power of straightforward, efficient development. This isn't just another framework; it's a minimalist TypeScript library that makes building elegant user interfaces a breeze.

So, why "master-ts"? Because it's time to bring back the spark to SPAs. Let's leave behind unnecessary complexities and rediscover the joy of coding with a library that's as dependable as it is fun to use.

— Writen by ChatGPT

## Vite Plugin

Vite plugin doesn't support the latest version of master-ts atm.

~~MasterTS is a UI building library. So you may wonder, why does a library have a "Vite" plugin? The truth is, you don't actually need this plugin for MasterTS to work. The plugin simply bakes your MasterTS code, including HTML templates, at build time to improve runtime performance.~~

~~So it's recommended that you use [MasterTS Vite Plugin](https://github.com/DeepDoge/master-ts-vite-plugin)~~
