import { UnformattedState, Action, InactiveState, State } from "./types";

export const createState = (state:string|UnformattedState) => Object.assign({
    enter: [],
    exit: [],
    on: {}
}, typeof state === 'string' ? { type: state } : state)

export const runActions = (actions: Action|Action[], activeState:State|InactiveState) => {
    ([] as Action[]).concat(actions).forEach(action => action(activeState))
};

