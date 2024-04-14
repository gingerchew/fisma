import { inactiveState, State, InactiveState, ReturnedState } from './types';
import { runActions, keys } from './utils';

export function* Engine<T extends Record<string, State>>(states: T, initial?: keyof T, final?: keyof T):Generator<ReturnedState, InactiveState, string | undefined> {
    const stateKeys = keys(states);
    if (!initial) {
        initial = stateKeys[0];
    }
    
    let shouldLoop = true,
        activeState:State,
        nextStateIndex = stateKeys.indexOf(initial as string),
        prevStateIndex = -1,
        requestedState:string | undefined = initial as string;

    while(shouldLoop) {
        
        activeState = states[stateKeys[prevStateIndex = nextStateIndex]];

        if (activeState.cond && !(activeState.cond())) yield {
            ...activeState,
            type: stateKeys[nextStateIndex]
        };
        
        if (requestedState !== stateKeys[nextStateIndex]) 
            runActions(activeState?.enter, activeState)
        
        if (stateKeys[nextStateIndex] === final) return inactiveState;
        
        requestedState = yield {
            ...activeState,
            type: stateKeys[nextStateIndex],
        }

        runActions(states[stateKeys[prevStateIndex]]?.exit, activeState);
        
        if (!!requestedState) {
            nextStateIndex = stateKeys.indexOf(requestedState);
        } else {
            nextStateIndex += 1;
            if (nextStateIndex >= stateKeys.length) nextStateIndex = 0;
        }
        

    }

    return inactiveState
}