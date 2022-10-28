ok this is my plans for the purify.js because i might forget them

so our first goal is rethinking signals again because they need to be better

so i wanna use signals as class base which im doing atm

but it should be better

im trying to understand what is really needed and what is not in the base class
while also keeping file size small

also have problems with the tags builder Proxy and stuff

signals are not that bad tho, i mean they are not easy to understand really
there are many protected methods and stuff which is confusing but i think i
should also work on the class based components thing

so i should be able to make my own custom element with a class also onconnected
should be a part of the builder so i can add new addons that adds functionality
to the whole thing such as input binding

i think builder proxy is a good solution but builder should be one thing, and
not two things, Builder.Proxy it should just be Builder which can extend the
proxy this way i can check what its with instanceof

another thing is signals should be a lot more simple some how

for example like svelte stores they are easy to build, just implement a watch
function and you are done.

get probably watches with the immediate options then unwatches it works good

maybe i can make something similar

i dont want user to deal with protected stuff too much and they shouldnt
impliment their own getter and stuff.

maybe signal as its base, doesnt even need a default follow function thats what
im saying

maybe all we need is a follow function, work on this, see how it works.

if you can make signals good. i can remove onConnect to just convert isConnected
to a Signal, this way we can use the existing system to watch connected state

if in the end we can simplify everything, we can add some more helper functions
built in

but as i said, bugs and missing features show up while coding an app like now

we need signal helpers like derive, readonly and etc maybe each signal doesnt
need its own whole follow system maybe only state needs it

here some starting point for the new signals:

```ts
abstract class Signal<T> {
    public abstract follow(
        follower: Signal.Follower<T>,
        immediate?: boolean
    ): Signal.Unfollower

    get val() {
        let returns: T
        this.follow((value) => (returns = value), true)()
        /// @ts-ignore // We know `follow` for will sure assign `returns` so ignore the error
        return returns
    }
}

namespace Signal {
    export class Readonly<T> extends Signal<T> {
        constructor(followHandler: Signal<T>["follow"])
        constructor(public follow: Signal<T>["follow"]) {
            super()
        }
    }

    export class State<T> extends Signal<T> {
        constructor(initial: T)
        constructor(private value: T) {
            super()
        }
    }
}

const documentVisibleSignal = new Signal.Readonly<boolean>((follower, immediate) => {
    let listener = () => follower(document.visibilityState === "visible")
    if (immediate) listener()
    document.addEventListener("visibilitychange", listener)
    return () => document.removeEventListener("visibilitychange", listener)
})
```

but this has one problem how does any Computed signal knows Readonly is used.
well one solution is throwing away call stack based detection completely and
using a list also having derive function for quick dervations from one or
~~multiple~~(maybe) sources computed can also give the values in the function so
this would optimize stuff more so instead of detecting manually we detect on the
fly or in the base constructor i can wrap the follow function to include stack
tracing i mean many projects use stack tracing, is it even that good of an idea?
what if we just you know list the dependencies, and also have a quick derive
function in each signal. just because everyone is tracing the stack call doesnt
mean we should too. i mean it causes the most of the issues, being aware of what
triggers and update is better. being in the dark was my problem with mainstream
frameworks anyway it also simplifies code. i have this weird feeling that if i
bare bone simplify everything without limitations everything will be a breeze
some how by itself not familiar, but simple without limitations

UPDATE: Ok, i defineanlty need to rewrite tags.ts file sometime. i need to
somehow simplify it. so i have more space to work with rn im almost at 1kb, so
cant do anything more

UPDATE 2: went back to dynamic depenedencies, because of the recursive
dependencies, but instead of discovering dependecies from the stack call, now i
add them manully in the callback which gives more control to me, makes it more
verbose. also kept the derive function which lets me quickly create one
dependency computed signals

I can't squize signals anymore. So if i wanna continue i should remove fat from
tags somehow maybe rethink the whole think focus on enchanced elements maybe
make it all about enchanced elements can simplify things there fore makes it
smaller, maybe
