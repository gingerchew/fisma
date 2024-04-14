import { UnformattedState, Action, InactiveState, State } from "./types";

let i = 0;
export const createId = (id?: string) => id ?? `m-${++i}`;

export const createState = (state:UnformattedState) => Object.assign({
    enter: [],
    exit: [],
    on: {}
}, typeof state === 'string' ? { type: state } : state)

export const runActions = (actions: undefined | Action | Action[], activeState: State | InactiveState) => {
    actions && ([] as Action[]).concat(actions).forEach(action => action?.(activeState))
};


export const keys = Object.keys;
