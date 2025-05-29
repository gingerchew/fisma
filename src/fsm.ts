import type { State, InactiveState } from './types';
import { runActions } from './utils';
/**
 * The internal engine of fisma
 * 
 * this will loop perpetually, or until fisma.destroy() is called, and cycle through states
 * @param states an array of states
 * @returns A finite state machine
 */
export function* _FSM(states:State[]):Generator<State, InactiveState, string|undefined> {
	let nextStateIndex = 0,
		prevStateIndex = -1,
		activeState = states[nextStateIndex],
        requestedState:string|undefined = activeState.type as string;

	while (true) {
        nextStateIndex = nextStateIndex >= states.length ? 0 : nextStateIndex;
		// if (nextStateIndex >= states.length) nextStateIndex = 0;
		
        // prevents enter actions running on initial state
		if (requestedState !== activeState.type)
            runActions(states[nextStateIndex].enter, activeState);
		
		requestedState = yield activeState = states[prevStateIndex = nextStateIndex];

        /**
         * Only run actions if the requestedState is new
         * 
         * ```js
         * machine.current // A
         * machine.next('A') // no enter/exit actions will run
         * ```
         */
        if (requestedState === activeState.type) continue;

        runActions(states[prevStateIndex].exit, activeState);
        /**
         * If there is a requested state, get the index of the state with the same type
         * if the requested state does not exist, keep the previous state
         * If there is no requested state, increment by one
         */
        nextStateIndex = states.findIndex(state => state.type === (requestedState ?? activeState.type))
        if (nextStateIndex === -1) nextStateIndex = prevStateIndex;
        requestedState ?? (nextStateIndex += 1);
	}
}