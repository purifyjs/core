# When i first started this project:

I wanted to use TS files purely without compiling and stuff.

We don't wanna generate files or types.

Everything is typed naturally. TypeScript first.

We don't wanna use any other tool than TS.

This is a library. Well we preprocess html`` template strings but this is just changing them with a code that already exists in the library.

Also we dont wanna differentiate between components and elements. Everything is an element.

We have signals, that are the main thing, they are different from normal variables.

And this whole thing is build around the idea of signals. Our signals are different than Svelte states/stores, or React states.

We can signal subscribers without changing any value.

Svelte has $: but it becomes problamatic when you wanna have state of a state and other stuff. Basically sometimes it doesn't work as expected.

It's problamatic with Promises

Signals solves these problems.

# Now what?

I did all that, I'm happy about bundle size, even though it's not a compiler, it's pretty close to Svelte's empty bundle size.

We have signals.

We have Components as we wanted.

We are using TS files nicely.

Components are just functions that return elements. Pretty cool stuff and etc.

But now we have one problem. HTML isn't as readable as Svelte or JSX/TSX.

First of all, we have to use html`` template strings, this is not a big deal, but it's not as nice.

Second, we have to use ${} instead of {}, which looks crowded.

Each, if, await, etc. are functions, which is not a big deal, but it's not as nice as Svelte's syntax.

Since we are using TypeScript syntax, we don't have many options.

But i think we can make each, if, await, etc. functions to be more readable.

But one ugly thing is, we have to use `<x>` tag for components, so existing inline html extensions can be happy.

Basically we use components like this:

```svelte
<x ${Counter()} class="my-counter">
    My Counter
</x>
```

Or this, if we don't wanna add attributes or children:

```ts
${Counter()}
```

Now these are readable, but not that nice.

If i were to make my own syntax, i would do this:

```svelte
<Counter() class="my-counter">
    My Counter
</Counter>
```

So we can use it like a normal tag but you can clearly see that it's a function. And you can pass parameters to it as well as generic types.

But we are not having our own file type, at least not yet.

Anohter thing is, in Svelte you can do this:

```svelte
<div>{a + b}</div>
```

But in our library, you have to do this:

```html
<div>${(s) => s(a).value + s(b).value}</div>
```

I mean at least we can do this:

```html
<div>${() => a.value + b.value}</div>
```

But then we don't have a way to choose which signal to subscribe to.

But maybe if we don't add anything as a dependency, this behavior can be default.

So if you pick it only adds the ones you picked as dependencies. If you don't pick anything, it adds all of them based on context.

We can also remove the function arrow, using prepocessor.

```html
<div>${a.value + b.value}</div>
```

Maybe we also make signals callable, so we can do this:

```html
<div>${a() + b()}</div>
```

Way better probably. Or might be confusing, since we can't use this while setting a value. But we can still set value with `a.value = 5`.
