# WORK IN PROGRESS - NOT FINISHED
This is not the best documentaion ever, might rewrite it.
I'm not good at this, and its not even finished yet.

# Table of Contents
- [Signals](#signals)
- [HTML Elements and Nodes](#html-elements-and-nodes)

# Signals
Signals are corner stone of the Master.ts. Signals are a way to create reactive data.<br/>
Different from other reactive libraries or frameworks, Master.ts does not require you to create a `signal` in a reactive context. You can create a signal anywhere in the code and use it anywhere in the code.

In Master.ts, there are 3 types of signals:
- [Static signals](#static-signals)
- [Settable signals](#settable-signals)
- [Derived signals](#derived-signals)

## Static signals
Static signals are the base of all signals. They are a way to create reactive data that cannot be changed.<br/>
Unlike other reactive libraries or frameworks, signals here doesn't require a value change in order to trigger subscribers.<br/>
So you can trigger subscribers by calling `signal` method any time you want.

```ts
const signal = new Signal<number>(0); // 0 is the initial value
const signal = createStaticSignal<number>(0) // same as above

signal.get(); // returns 0

const subscribtion = signal.subscribe((value) => {
    console.log(value); // will print 0
});

signal.signal(); // trigger subscribers
subscription.unsubscribe(); // unsubscribe from the signal to prevent memory leaks
```
### Signal method
`signal()` method is a way to trigger subscribers. It is useful when you want to trigger subscribers without changing the value of the signal.<br/>
`signal()` is also an async function, so you can use `await` keyword to wait for subscribers to finish.<br/>
**Important** to note here is that you don't have to await `signal()` method. If you don't await it, it will only wait for sync subscribers to finish and then continue execution. If you await it, it will wait for all subscribers to finish including async ones.
```ts
signal.subscribe(async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("async"); // will print 0 after 1 second
});
signal.subscribe((value) => {
    console.log("sync"); // will print 0 immediately
});

signal.signal(); // will print "sync" and continue execution
await signal.signal(); // will print "sync" and "async" after 1 second then continue execution
```

### Subscribtion mode
There are 3 modes:
- `immediate`: Subscriber will be triggered immediately when it is added to the signal.
- `once`: Subscriber will be triggered only once then it will be removed from the signal.
- `normal`: Subscriber will be triggered only when the signal is triggered.

```ts
signal.subscribe((value) => {
    console.log(value);
}, { mode: 'immediate' });
```

## Settable signals
Settable signals are equivalent of what you know as reactive value in other frameworks or libraries.<br/> 
They are a way to create reactive data that can be changed.

```ts
const signal = new SignalSettable<number>(0); // 0 is the initial value
const signal = createSignal<number>(0) // same as above

signal.set(1); // set the value to 1
signal.set(2); // set the value to 2

signal.get(); // returns 2

signal.value++; // value is now 3
signal.value; // returns 3

signal.update((value) => value + 1); // value is now 4
```
As you can see, there are two ways to get and set the value of the signal. The first one is using `get`, `set` and `update` methods. The second one is using `value` property. There is no difference between them. They are just different ways to do the same thing.<br/>
Using `value` property is more convenient.

But this has one caveat. Since `set()` and `update()` methods are calling `signal()` method after changing the value, they are an async function.<br/> 
So you can use `await` keyword to wait for async subscribers to finish. But you can't do that with `value` property. <br/>
So if you want to wait for async subscribers to finish, you have to use `set()` or `update()` methods. See [Signal method](#signal-method) for more information.

## Derived signals
Derived signals are a way to create reactive data that is derived from other signals.<br/>
Derived signal gets other signals as dependencies. When any of the dependencies changes, the derived signal will be triggered.<br/>

```ts
const signal1 = createSignal<number>(1);
const signal2 = createSignal<number>(2);

const derivedSignal = new SignalDerived<number>(() => `${signal1.value} and ${signal2.value}`, [signal1, signal2]); // addition of signal1 and signal2
const derivedSignal = createDerivedSignal<number>(() => `${signal1.value} and ${signal2.value}`, [signal1, signal2]); // same as above
const derivedSignal = createDerivedSignal<number>(($) => `${$(signal1)} and ${$(signal2)}`); // same as above

derivedSignal.get(); // returns "1 and 2"
derivedSignal.subscribe((value) => {
    console.log(value); // will print "1 and 2" then "3 and 2"
}, { mode: 'immediate' });

signal1.value = 3; // derivedSignal will be triggered
```
You can see there are two ways to add dependencies to derived signal. You can either pass them as an array to the constructor or you can use `$(signal)` function inside the callback function.<br/>
With both ways, you can have control over what dependencies you want to add to the derived signal.<br/>
The second way is more convenient and recommended.

### Activating/deactivating derived signals
You can active or deactivate derived signals.<br/>
When a derived signal is deactivated, it will unsubscribe from all its dependencies.<br/>
When a derived signal is activated, it will subscribe to all its dependencies.<br/>
This is useful when you want to temporarily stop a derived signal from being triggered.<br/>
Don't forget deactive a derived signal when you don't need it anymore to prevent memory leaks.<br/>
By default, derived signals are activated.

```ts
someDerivedSignal.deactivate();
someDerivedSignal.activate();
```

# Html Elements and Nodes
Unlike many other frameworks or libraries, in Master.ts every UI part is either an element or a node.<br/>
Meaning that there is no difference between a div element or a custom element(component).<br/>

In Master.ts, there are 2 ways to create html:
- [Fragments without a root element](#fragments)
- [And Custom Elements aka Components](#custom-elements)

## Custom Elements
Custom Elements are based Web Components and Shadow DOM.<br/>

Creating a custom element:
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    
    return element.html`
        <div>hello</div>
        <style>
            div {
                color: red;
            }
        </style>
    `;
}
```
Here we first define a custom element using `defineMasterElement` method.<br/>
Inside the function, we create an instance of the custom element using `Element` method.<br/>
Then we use `html` method to create html for the element.<br/>
and finally we return the element.

Since all custom elements are based on Shadow DOM, styles are scoped to the element.<br/>
So you don't have to worry about styles conflicting with other elements.<br/>

### Event listeners
You can add event listeners to elements.<br/>
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    
    return element.html`
        <div on:click=${() => alert('clicked')}>hello</div>
    `;
}
```

### Mount and unmount
You can use `onMount` and `onUnmount` methods to run code when the element is mounted and unmounted.<br/>
Don't forget that a node or element can be mounted and unmounted multiple times.<br/>
Mounting means that the node or element is in the DOM.<br/>
Unmounting means that the node or element is not in the DOM.<br/>
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    const { m } = element // MasterApi for managing the node, element
    
    m.onMount(() => {
        console.log('mounted');
    });
    
    m.onUnmount(() => {
        console.log('unmounted');
    });
    
    return element.html`
        <div>hello</div>
    `;
}
```

### Using signals in elements
You can use signals in elements.<br/>
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    const counter = createSignal<number>(0);
    
    return element.html`
        <div>hello ${counter}</div>
    `;
}
```
In the example above, whenever the value of in `counter` signal changes, that exact part of the html will be updated.<br/>
This is because the value of `counter` signal is a reactive data.<br/>
The html template there will automatically subscribe and unsubscribe to the signal.<br/>

But, what if we wanna create a derived signal?<br/>
First thing that comes to mind is doing something like this:
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    const { m } = element; // MasterApi for managing the node, element
    const counter = createSignal<number>(0);
    const derivedCounter = createDerivedSignal<number>(() => counter.value * 2);

    m.onMount(() => derivedCounter.activate());
    m.onUnmount(() => derivedCounter.deactivate());

    return element.html`
        <div>hello ${derivedCounter}</div>
    `;
}
```
While this works and is a valid solution, it's not the best solution.<br/>
The problem with this solution is that we have to manually activate and deactivate the derived signal.<br/>
This is not a big deal in this example, but in a real world application, you will have a lot of derived signals and you will have to manually activate and deactivate them.<br/>
This is where `m.derived` method comes in.<br/>
Remember that `m` is an instance of `MasterApi` and it has a lot more methods than just `onMount` and `onUnmount`.<br/>
`m.derived` method is a shortcut for creating derived signals and automatically activating and deactivating them.<br/>
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    const { m } = element; // MasterApi for managing the node, element
    const counter = m.signal<number>(0); // yes, you can use m.signal instead of createSignal
    const derivedCounter = m.derived(() => counter.value * 2); // automatically activated and deactivated

    return element.html`
        <div>hello ${derivedCounter}</div>
    `;
}
```

### Slots
Slots are a way to pass html to a custom element.<br/>
You can pass html to a custom element using `slot` method.<br/>
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    
    return element.html`
        <div>hello <slot/></div>
    `;
}

const App = defineMasterElement()
function myApp() {
    const element = App();
    
    return element.html`
        <x ${myElement()}>
            world
        </x>
    `;
}
```
Which gives us:
```html
<x-fewoifjw> This is the root of myApp
    <x-cjoeiew> This is the root of myElement
        <div>hello world</div>
    </x-cjoeiew>
</x-fewoifjw>
```

Notice that in the above example while we were using `<x ${myElement()}>`, we have a clear separation between props/arguments and attributes.<br/>
Because there is no such thing as `props`, what ever you pass to the function is the props.<br/>
So we can just use `class`, `id` `style` or any other attribute naturally.<br/>
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    
    return element.html`
        <div>hello <slot/></div>
    `;
}

const App = defineMasterElement()
function myApp() {
    const element = App();
    
    return element.html`
        <x ${myElement()} class="my-class" id="my-id" style="color: red;">
            world
        </x>
    `;
}
```
Which gives us:
```html
<x-fewoifjw> This is the root of myApp
    <x-cjoeiew class="my-class" id="my-id" style="color: red;"> This is the root of myElement
        <div>hello world</div>
    </x-cjoeiew>
</x-fewoifjw>
```

You can also do this:
```ts
const Element = defineMasterElement()
function myElement() {
    const element = Element();
    
    return element.html`
        <div>hello <slot/></div>
    `;
}

const App = defineMasterElement()
function myApp() {
    const element = App();
    const { m } = element;
    const toggle = m.signal(true);
    const someStyleVar = m.signal('red');
    
    return element.html`
        <x ${myElement()} 
            class:my-class=${toggle} 
            class:my-other-class=${true} 
            style:--my-var=${someStyleVar} 
            style:--my-other-var=${'blue'}
        >
            world
        </x>
        <button on:click=${() => toggle.value = !toggle.value}>toggle my-class</button>
    `;
}
```



## Fragments
Fragments are similar to Svelte Components, so they don't have a root element.<br/>
Fragments are useful when you want to create a reusable piece of html that doesn't have a root element.<br/>

You can create a fragment by using `html` method anywhere in your code.<br/>
```ts
const fragment = html`
    <div>hello</div>`;
const fragment2 = html`
    ${fragment}
    <div>world</div>`;

// You can also do this
const element = document.createElement('div');
element.textContent = 'hello';
const fragment = html`
    ${element}
    <div>world</div>`;
```
Note that `html` method here is not returning `DocumentFragment`, it is returning `Node[]`.<br/>
Reason for that is so we can mount and move fragments multiple times.

It's recommended to use `html` method within a function so you can pass arguments to it and create multiple clones of the same fragment.<br/>
```ts
function myFragment(name: string) 
{
    return html`
        <div>hello ${name}</div>`;
}
```

### Using signals in fragments
You can use signals in fragments.<br/>
```ts
const time = createDerivedSignal(() => Date.now());
setInterval(() => time.signal(), 1000);

function myTime()
{
    return html`
        <div>time: ${time}</div>`;
}
```
