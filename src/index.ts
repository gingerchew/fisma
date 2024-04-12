// Add import.meta.env.* for intellisense
/// <reference types="vite/client" />
/**
 * Are Actions and Listeners the same thing?
 * 
 * For the time being yes. Once the idea for what `context` will be
 * in this... context... these two will differentiate themselves.
*/
type Action = (ctx: State|InactiveState) => void;
type Listener = (ctx: State|InactiveState) => void

interface StateTarget {
    target: string;
    actions: Action[];
}

type Events = Record<string, string | StateTarget>;

interface State {
    type: string|-1;
    on: Events;
    enter: Action|Action[];
    exit: Action|Action[];
}

type InactiveState = Partial<State> & typeof inactiveState;
type UnformattedState = Partial<State> & { type: string };

const createState = (state:string|UnformattedState) => Object.assign({
        enter: [],
        exit: [],
        on: {}
    }, 
    typeof state === 'string' ? { type: state } : state
),  runActions = (actions: Action|Action[], activeState:State|InactiveState) => {
        ([] as Action[]).concat(actions).forEach(action => action(activeState))
    }, inactiveState = { type: -1 as const };
/**
 * The internal engine of fisma
 * 
 * this will loop perpetually, or until fisma.destroy() is called, and cycle through states
 */
function* _FSM(states:State[]):Generator<State, InactiveState, string|undefined> {
	let nextState = 0,
		prevState = -1,
		activeState = states[nextState],
        requestedState:string|undefined = activeState.type as string;

	while (true) {
		if (nextState >= states.length) nextState = 0;
		
        // prevents enter actions running on initial state
		if (requestedState !== activeState.type)
            runActions(states[nextState].enter, activeState);
		
		activeState = states[prevState = nextState];
		
		requestedState = yield activeState;

        /**
         * Only run actions if the requestedState is new
         * 
         * ```js
         * machine.current // A
         * machine.next('A') // no enter/exit actions will run
         * ```
         */
        if (requestedState === activeState.type) continue;

        runActions(states[prevState].exit, activeState);

        if (requestedState) {
            nextState = states.findIndex(state => state.type === requestedState);
            if (nextState === -1) nextState = prevState;
        } else {
            nextState = states.findIndex(state => state.type === activeState.type) + 1;
        }
	}
    // Appeases the typescript gods
    return inactiveState;
}


interface Machine {
    current: State['type'];
    done: boolean;
    next: (requestedState?:string) => void;
    subscribe: (listener:Listener) => () => void;
    send: (eventType: string) => void;
    destroy: () => void;
}

function createMachine(states:(string|UnformattedState)[]):Machine {
    if (import.meta.env.DEV) {
        if (!states || states.length === 0) throw new Error('Machine cannot be stateless');
    }
	const _states = _FSM(states.map(createState)), listeners = new Set<Listener>();
    let _ctx = _states.next();

	const next = (requestedState?:string) => {
        
        _ctx = _states.next(requestedState);
        listeners.forEach(listener => listener(_ctx.value!));
    }
    return {
        /** Getters */
        get current() {
            return _ctx.value.type;
        },
        get done() {
            return !!_ctx.done;
        },
        /** Methods */
        next,
        /**
         * Add a listener that fires on every state change
         * returns a clean up function
         */
        subscribe(listener:Listener) {
            listeners.add(listener);

            listener(_ctx.value);
            return () => listeners.delete(listener);
        },
        send(eventType:string) {
            const state = _ctx.value
            if (state?.on) {
                let nextState = state.on[eventType];
                
                if (typeof nextState !== 'string') {
                    runActions(nextState.actions, state);
                }
                next((nextState as StateTarget)?.target ?? nextState)
            }
        },
        /**
         * Toggle through the state machine
         * Passing an optional state name will 
         * go to that state instead of
         * the next in index order
         */
        /**
         * Kill the state machine/generator
        */
       destroy() {
            // @ts-ignore
            _ctx = _states.return(inactiveState);
            listeners.forEach(listener => listeners.delete(listener));
		}
	}
}


export { createMachine };