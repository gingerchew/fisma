# FISMA

A **FI**nite **S**tate **MA**chine using iterators

## How to use

```js
import { createMachine } from 'fisma';

const m = createMachine([
    'A',
    { type: 'B' },
    {
        type: 'C',
        // Add enter and exit 
        // action as a method
        // or array of actions
        enter() {},
        exit: [() => {}]
    },
    {
        type: 'D',
        on: {
            RESTART: 'A'
        }
    },
    {
        type: 'E',
        on: {
            RESTART: {
                target: 'A',
                actions: [ () => console.log('Running actions') ]
            }
        }
    }
]);

// getters
m.active; // A (The active state)
m.done; // false (is the machine running)

// Use `next` to go to the
// next state in array order
m.next();

m.active; // B

// `.subscribe()` returns a cleanup function
const unsub = m.subscribe((ctx) => console.log(ctx));
m.next(); // { type: 'B' }
m.next(); // { type: 'C' }
unsub();

// Pass a string with the
// name of the desired next state
m.next('A');

m.active; // A

m.next('D');
// Signal to the machine a specific
// state to transition to
m.send('RESTART');

m.active; // A

m.next('E');
m.send('RESTART'); // Running actions

m.destroy(); // kills machine
m.done; // true
```

## Things to be aware of

- There isn't a `.start(initialState)` method. The initial state is _always_ the first item in the states array.
- While actions are passed a "context" object, currently the context is the active state object and it is **not** safe to store or alter that information.
- `active` and `done` might be confusing, `active` is for the name of the active state, `done` is the status of the machine itself.

## To Do
- [ ] Give a proper "context" object for actions and listeners
- [ ] Accept a more complex "requested state" in the `.next()` method
- [ ] Review method and getter names, e.g. `active` vs. `current`, `next()` vs. `somethingElse()`
- [ ] Should there be an `initial` getter
- [ ] Shave bytes