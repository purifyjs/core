# What is this?

This is an experimental, light, minimal and reactive UI building library with support for signals.

It adds templating and reactivity features to your vanilla js.

# Update

After adding some necessary logic, core library went up to 3kb from 2.4kb.

If anyone reading this can make the core library smaller or can find a new logic that would require less code without sacraficing features, it would be great.

# Why?

After, building my own UI building library, [master-ts](https://github.com/DeepDoge/master-ts),
with some new inspiration from [VanJS](https://vanjs.org/), I decided to build a new UI building library.

After, [master-ts](https://github.com/DeepDoge/master-ts), building this was easier than I thought.
Since I already did it once, I just did it again here, but better and more clean.

[VanJS](https://vanjs.org/) is minimal, that's what makes it good, but the bare minimum I'm looking for is a bit more than that.

Core of this library is the bare minimum I need in a core, not more, not less.

I was able to make the core library in 1 day, and I'm pretty happy with the result. Although, it takes 2.4kb minified(no gzip), compared to [VanJS](https://vanjs.org/)'s 1.7kb, I think it's worth it. And I believe there is still room for improvement, to make it smaller, and also better. So pretty good.

I will add more features and tools to this library, but I will keep the core as it is.

Core is just a one file. I'm gonna the add extra features to another file.<br/>
These features will just be some built-in utilities. To make life easier.

For now I'm planning to add some more signal related features, such as `switch`, `each`, `deferred` and `await`.<br/>
Also gonna add support for html string literal tags(this thing ` html`` `), like in [master-ts](https://github.com/DeepDoge/master-ts),
it will parse html on runtime, but with a preprocessor, you can bake it into your bundle, so parse it on build time.
So when preprocessor is used, it will just tree-shake all of the html parsing stuff.<br/>
You can still use this thing `div({ "class:hello": toggleSignal }, ["Hello"])`, It's just you have choice now.
Also probably gonna bake the html to that tho. <br/>
None of these extra stuff, will be in the core file.<br/>
So basically gonna cover all of [master-ts](https://github.com/DeepDoge/master-ts), but in a more minimal way.

If this experiment goes well, this library will be the new [master-ts](https://github.com/DeepDoge/master-ts).
Same repo, just a big breaking change commit.
