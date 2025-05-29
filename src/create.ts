// Add import.meta.env.* for intellisense
/// <reference types="vite/client" />
import { StateTarget, inactiveState, UnformattedState, Listener, Machine, Events } from './types';
import { createState, isString, runActions } from './utils';
import { _FSM } from './fsm';

/**
 * Creates the machine from an array of finite states
 * @param states An array of states that can be converted into a machine
 * @returns Machine
 */
function createMachine(states:(string|UnformattedState)[]):Machine {
    if (import.meta.env.DEV) {
        if (!states || states.length === 0) throw new Error('Machine cannot be stateless');
        if (!Array.isArray(states)) throw new Error('Machine cannot be initiated with a type other than array');
    }
	let formattedStates = states.map(createState),
        _states = _FSM(formattedStates),
        listeners = new Set<Listener>(),
        _ctx = _states.next(),
        next = (requestedState?:string) => {
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
        send(eventType) {
            const nextState = _ctx.value?.on?.[eventType];
            if (!isString(nextState)) {
                runActions(nextState!.actions, _ctx.value);
            }
            next((nextState as StateTarget)?.target ?? nextState)
        },
        /**
         * Kill the state machine/generator
        */
       destroy() {
           listeners.clear();
            _ctx = _states.return(inactiveState);
		}
	}
}


export { createMachine };