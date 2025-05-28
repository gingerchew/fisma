// Add import.meta.env.* for intellisense
/// <reference types="vite/client" />
import { StateTarget, inactiveState, UnformattedState, Listener, Machine } from './types';
import { createState, runActions } from './utils';
import { _FSM } from './fsm';

/**
 * Creates the machine from an array of finite states
 * @param states An array of states that can be converted into a machine
 * @returns Machine
 */
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
        current: () => _ctx.value.type,
        done: () => !!_ctx.done,
        /**
         * Toggle through the state machine
         * Passing an optional state name will 
         * go to that state instead of
         * the next in index order
         */
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
         * Kill the state machine/generator
        */
       destroy() {
            _ctx = _states.return(inactiveState);
            listeners.forEach(listener => listeners.delete(listener));
		}
	}
}


export { createMachine };