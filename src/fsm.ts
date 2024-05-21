import { inactiveState, State, InactiveState } from './types';
import { runActions } from './utils';
/**
 * The internal engine of fisma
 * 
 * this will loop perpetually, or until fisma.destroy() is called, and cycle through states
 * @param states an array of states
 * @returns A finite state machine
 */
export function* _FSM(states:State[]):Generator<State, InactiveState, string|undefined> {
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
    return inactiveState as InactiveState;
}