// Add import.meta.env.* for intellisense
/// <reference types="vite/client" />
import { StateTarget, Listener, Machine, MachineConfig, State, ReturnedState } from './types';
import { keys, runActions } from './utils';
import { Engine } from './fsm';

function createMachine<T extends Record<string, State>>(config: MachineConfig<T>):Machine<T> {
    
    const stateKeys = keys(config.states), {
        states,
        id = `machine-${crypto.randomUUID()}`,
        initial = stateKeys[0] as keyof T,
        final,
    } = config;
    
    if (import.meta.env.DEV) {
        if (Object.keys(states).length === 0) throw new Error('Machine cannot be stateless');
    }

	const _states = Engine<T>(states, initial, final), listeners = new Set<Listener>();
    let _ctx = _states.next();


	const next = (requestedState?:string) => {
        // Don't transition to a nonexistent state
        if (requestedState && stateKeys.indexOf(requestedState) === -1) return;
        if (requestedState === _ctx.value.type) {
            return;
        }
        _ctx = _states.next(requestedState);
        listeners.forEach(listener => listener(_ctx.value!));
    }

    return {
        id,
        initial: initial!,
        /** Getters */
        get current() {
            return _ctx.value!.type as keyof T;
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

            listener(_ctx.value!);
            return () => listeners.delete(listener);
        },
        send(eventType:string) {
            const state = _ctx.value as ReturnedState;
            if (typeof state!.type === 'number') return;
            
            if (state?.on) {
                let nextState = state.on?.[eventType];
                
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
            _ctx = _states.return({ type: -1 });

            listeners.forEach(listener => listeners.delete(listener));
		}
	}
}


export { createMachine };