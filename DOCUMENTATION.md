# IGNORE THIS FILE
This project is way to early in development to have any documentation. <br/>
Things are kept changing and the documentation is not up to date.<br/>
You can instead check http://github.com/DeepDoge/master-ts-vite-template it's always up to date with the latest version of Master.ts.


# Quick Start
Quick start guide for using Master.ts using the best recommended practices.
## Counter
Counters are a great way to get started with Master.ts. They are simple enough to be easy to understand.

*counter.ts*
```ts
import { defineMasterElementCached } from "master-ts/library/component"
import type { SignalSettable } from "master-ts/library/signal/settable"

const Element = defineMasterElementCached()
export function Counter(count: SignalSettable<number>)
{
  const element = Element()
  const { m } = element

  return element.html`
        <button part="button" on:click=${()=> count.value--}>-</button>
        <slot></slot>
        <span> ${count}</span>
        <button part="button" on:click=${()=> count.value++}>+</button>
    `
}
```

*app.ts* 
```ts
import { defineMasterElementCached } from "master-ts/library/component"
import { Counter } from "./counter"

const Element = defineMasterElementCached()
export function App()
{
    const element = Element()
    const { m } = element
    const count = m.signal(0)
    const isOdd = m.derive(($) => $(count).value % 2 === 0 ? false : true)

    return element.html`
        <x ${Counter(count)} class="my-counter">
            Counter:
        </x>

        <div class:is-odd=${isOdd}>
            Number is ${($) => $(isOdd).value ? 'odd' : 'even'}
        </div>

        <div>Double is ${($) => $(count).value * 2}</div>

        <style>
            .my-counter::part(button) {
                background: red;
            }

            .is-odd {
                color: red;
            }
        </style>
    `
}

document.body.appendChild(App())
```


## Todo
Todo is another great way to get started with Master.ts. It is easy to understand, but complex enough to show off some of the more advanced features of Master.ts.

*todo.ts*
```ts
import { defineMasterElementCached } from "master-ts/library/component"
import { html } from "master-ts/library/template"
import { randomId } from "master-ts/library/utils/id"

interface Todo
{
    id: string
    text: string
}

const Element = defineMasterElementCached()
export function Todo()
{
    const element = Element()
    const { m } = element
    const todos = m.signal<Todo[]>([])
    const newTodo = m.signal('')

    function addTodo(todo: string)
    {
        todos.change((todos) => todos.push({ id: randomId(), text: todo }))
    }

    function removeTodoAt(index: number)
    {
        todos.change((todos) => todos.splice(index, 1))
    }

    addTodo('Buy milk')
    addTodo('Buy eggs')
    addTodo('Buy bread')

    return element.html`
        <div>
            <input type="text" value=${newTodo} on:input=${(event: InputEvent) => newTodo.value = (event.target as
            HTMLInputElement).value} />
            <button on:click=${() => addTodo(newTodo.value)}>Add</button>
        </div>
        <ul>
            ${m.each(todos, (todo, index) => html`
            <li>
                ${todo.text}
                <button on:click=${() => removeTodoAt(index.value)}>Remove</button>
            </li>`, (todo) => todo.id)}
        </ul>
    `
}
```

*app.ts*
```ts
const Element = defineMasterElementCached()
export function App()
{
    const element = Element()
    const { m } = element

    return element.html`
        <x ${Todo()} class="my-todo" />
    `
}

document.body.appendChild(App())
```


# Documentation
Explaning everything about Master.ts one by one starting from the core concepts.

## Signals
Signals are the core of Master.ts. They are used to store data and to update the DOM when the data changes.<br/>
Master.ts does not use the concept of a "state". Instead, Master.ts uses signals to store reactive data. This allows for more flexibility and control over the data.<br/>
There are three types of signals:
- [Static Signal](#static-signal)
- [Settable Signal](#settable-signal)
- [Derived Signal](#derived-signal)] 

And two additional types of utility signals:
- [Await Signal](#await-signal)
- [Each Signal](#each-signal)

### Static Signal
Static signals are the simplest type of signal. They are used to store static data that will never change.<br/>
Unlike other frameworks and libraries, signals in Master.ts doesn't require value to change in order to trigger the subscribers.<br/>
This allows for more flexibility and control over the reactivity of the data.

#### Creating Static Signals
```ts
const foo = createStaticSignal<string>('foo')
const foo = new Signal<string>('foo')
```

#### Signal Methods
Common methods for all signals:
##### Signal Subscription
Unlike other frameworks and libraries, signals in Master.ts doesn't require value to change in order to trigger the subscribers.<br/>
when you use the `signal()` method, it will trigger the subscribers of the signal, no matter if the value has changed or not.<br/>
This allows for more flexibility and control over the reactivity of the data.

Signals subscriptions has three different modes:
- `immediate` - will trigger the subscriber immediately with the current value of the signal.
- `once` - will trigger the subscriber only once, when the signal is first subscribed to.
- `normal` - will trigger the subscriber only when the value of the signal changes.

```ts
const foo = createStaticSignal<string>('foo')
const subscription = foo.subscribe((value) => console.log(value), { immediate: true }) // will log 'foo' twice
foo.signal() // triggers the subscribers
subscription.unsubscribe() // Unsubscribe from the signal in order to prevent memory leaks
```
Don't forget to unsubscribe from the signal in order to prevent memory leaks.

Also see [Signal Subscription in MasterAPI](#signal-subscription-in-masterapi)

###### Signaling a Signal
`signal()` is a method that is common to all signals.<br/>
It will trigger the subscribers of the signal, no matter if the value has changed or not.<br/>
**Important** thing to note is that `signal()` is an async method, but you don't need to `await` for it to finish.<br/>
If you await for it, you will also wait for async subscribers to finish.<br/>
If you don't await for it, you will only wait for sync subscribers to finish.
```ts
const foo = createStaticSignal<string>('foo')
foo.signal() // triggers the subscribers
```


##### Getting the Value of a Signal
There are two ways to get the value of a signal:
```ts
const foo = createStaticSignal<string>('foo')
const value = foo.get() // returns 'foo'
const value = foo.value // returns 'foo'
```
Both of these methods are equivalent.

### Settable Signal
Settable signals are equivalent of what you know as reactive variables in other frameworks and libraries.<br/>
Settable signal as the name suggests, can be set to a new value. This will trigger the subscribers of the signal.

#### Creating Settable Signals
```ts
const foo = createSettableSignal<string>('foo')
const foo = new SignalSettable<string>('foo')
```
Also see [Settable Signal in MasterAPI](#settable-signal-in-masterapi)

#### Settable Signal Methods
While settable signals are inheriting all the methods of [Signal Methods](#signal-methods), they also have their own methods:

##### Setting the Value of a Signal
There are three ways to set the value of a signal:
```ts
const foo = createSettableSignal({ value: 'foo' })
foo.change(v => v.value = 'bar') // sets the value of foo to 'bar'
foo.set({ value: 'bar' }) // sets the value of foo to 'bar'
foo.value = { value: 'bar' } // sets the value of foo to 'bar'
```
You can also trigger the `signal()` method manually after setting the value of the signal:
```ts
foo.value.value = 'bar'
foo.signal()
```
- `change()` method provides a callback that will be called with the current value of the signal. After running the callback it will just run the `signal()` method to trigger the subscribers. It doesn't doesn't expecting the callback to return a value.
- `set()` method will set the value of the signal and then run the `signal()` method to trigger the subscribers.
- `value` will just run the `set()` method with the value that you are setting it to.

**Important** thing to note is that since `set()` and `change()` are calling `signal()` method,
so they are async methods, but you don't need to `await` for them to finish. See [Signaling a Signal](#signaling-a-signal) for more info.



### Derived Signal
Derived signals are equivalent of computed properties in other frameworks and libraries.<br/>
Derived signals are signals that are derived from other signals. This means that the value of the derived signal is dependent on the value of the other signals.<br/>

#### Creating Derived Signals
```ts
const foo = createSettableSignal<string>('foo')
const bar = createSettableSignal<string>('bar')

const foobar = createDerivedSignal<string>($ => `${$(foo).value} ${$(bar).value}`) // foobar will be 'foo bar'
```
Also see [Derived Signal in MasterAPI](#derived-signal-in-masterapi)

#### Derived Signal Methods
While derived signals are inheriting all the methods of [Signal Methods](#signal-methods), they also have their own methods:

##### Activating/Deactivating Derived Signals
Derived signals are activated by default, but you can deactivate them by calling the `deactivate()` method.<br/>
When a derived signal is deactivated, it will unsubscribe from all of its dependencies.<br/>
When a derived signal is activated, it will subscribe to all of its dependencies.<br/>
This is useful when you want to prevent a derived signal from being triggered when you are setting the value of one of its dependencies.<br/>
```ts
const foo = createSettableSignal<string>('foo')
const bar = createSettableSignal<string>('bar')

const foobar = createDerivedSignal<string>($ => `${$(foo).value} ${$(bar).value}`) // foobar will be 'foo bar'
foobar.deactivate() // foobar will not be triggered when foo or bar changes
```
Don't forget to deactivate the derived signal when you are done with it, in order to prevent memory leaks.

Also see [Derived Signal in MasterAPI](#derived-signal-in-masterapi)

### Await Signal
Await signals are created around [Settable Signals](#settable-signal). They let you await for a value with a placeholder.<br/>

#### Creating Await Signals
```ts
const foo = createAwaitSignal(fetch('./hello.txt').then(res => res.text()), 'Loading...')
foo.subscribe((value) => console.log(value), { mode: 'immediate' }) // 'Loading...' -> 'Hello World!'
```
Also see [Await Signal in MasterAPI](#await-signal-in-masterapi)

### Each Signal
Each signals are created around [Derived Signals](#derived-signal). They let you iterate over an array or signal array.<br/>
Different from using map on an array, each signal will keep track of the key for each item in the array.<br/>
That way when the array gets updated, only the items that changed will be updated and re-rendered.<br/>
```ts
const foo = createSettableSignal<string[]>(['foo', 'bar'])
const foos = createEachSignal(foo, (item) => item.toUpperCase(), (item) => item)
``` 
Also see [Todo Example](#todo) for a more practical example.
Also see [Each Signal in MasterAPI](#each-signal-in-masterapi)

## MasterAPI
MasterAPI is a set of functions useful functions that are connected to a HTML Node.<br/>

### Creating MasterAPI
```ts
const foo = document.createComment('foo')
const api = injectOrGetMasterAPI(foo)
```

### Mount/Unmount
MasterAPI can track if a HTML Node is mounted or not to the DOM.<br/>
A node can be mounted and unmounted multiple times.<br/>
Mounted means that the node is connected to the DOM.<br/>
Unmounted means that the node is disconnected from the DOM.<br/>

```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
api.onMount(() => console.log('mounted'))
api.onUnmount(() => console.log('unmounted'))

document.body.appendChild(foo) // this will trigger the 'mounted' callback
document.body.removeChild(foo) // this will trigger the 'unmounted' callback
document.body.appendChild(foo) // this will trigger the 'mounted' callback again
```

### Signals in MasterAPI
Since MasterAPI is connected to a HTML Node and keeps track of the mounted state of the node, 
it can be used to create signals that are disposed/cleared when the node is unmounted.<br/>

#### "Settable" Signal in MasterAPI
Wrapper around `createSignal()`

```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
const bar = api.settableSignal('bar')
```
Also see [Settable Signal](#settable-signal)

#### "Derived" Signal in MasterAPI
Wrapper around `createDerivedSignal()` that will automatically get deactived when the node is unmounted 
and reactivated when the node is mounted again.

```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
const bar = api.settableSignal('bar')
const foobar = api.derive($ => `${$(bar).value} baz`)
```

#### "Await" Signal in MasterAPI
Wrapper around `createAwaitSignal()`
```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
const bar = api.await(fetch('./hello.txt').then(res => res.text()), 'Loading...')
```

#### "Each" Signal in MasterAPI
Wrapper around `createEachSignal()` that will automatically get deactived when the node is unmounted
and reactivated when the node is mounted again.
```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
const bar = api.signal<string[]>(['foo', 'bar'])
const foos = api.each(bar, (item) => item.toUpperCase(), (item) => item)
```
Also see [Todo Example](#todo) for a more practical example.
Also see [Each Signal](#each-signal)

### Signal Subscription in MasterAPI
Wrapper around `signal.subscribe()` that will automatically unsubscribe when the node is unmounted
and resubscribe when the node is mounted again.
```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
const bar = api.settableSignal('bar')
const foobar = api.derive($ => `${$(bar).value} baz`)
api.subscribe(foobar, (value) => console.log(value), { mode: 'immediate' }) // 'bar baz'
```

### Timeout and Interval in MasterAPI
#### Timeout in MasterAPI
Wrapper around `setTimeout()` that will automatically clear the timeout when the node is unmounted
and set the timeout again when the node is mounted again.
```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
api.timeout(() => console.log('Hello World!'), 1000) // 'Hello World!' after 1 second
```

#### Interval in MasterAPI
Wrapper around `setInterval()` that will automatically clear the interval when the node is unmounted
and set the interval again when the node is mounted again.
```ts
const foo = document.createElement('div')
const api = injectOrGetMasterAPI(foo)
api.interval(() => console.log('Hello World!'), 1000) // 'Hello World!' every 1 second
```


## Templates and Fragments
### Template Syntax
#### Element directives
##### on:
##### class:
##### style:
##### ref:
#### Accepted template values
## Components
### Creating Components
### Props
### Slots
### Attributes and Props
### Global Style

# Advanced Tips
## Binding props
## Advanced Signal Usage
## Caching Templates
### Caching Fragments
### Caching Components