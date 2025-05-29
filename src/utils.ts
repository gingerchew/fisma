import { UnformattedState, Action, InactiveState, State } from "./types";

export const inactiveState:InactiveState = { type: -1 };
export const isString = (obj:unknown): obj is string => typeof obj === 'string';
export const createState = (typeOrUnformattedState: string|UnformattedState) => ({
    enter: [],
    exit: [],
    on: {},
    ...(
        isString(typeOrUnformattedState)? 
            { type: typeOrUnformattedState } : 
            typeOrUnformattedState
    )
})
export const runActions = (actions: Action|Action[], activeState:State|InactiveState) => 
    ([] as Action[]).concat(actions).forEach(action => action(activeState))

