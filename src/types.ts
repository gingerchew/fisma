/**
 * Are Actions and Listeners the same thing?
 * 
 * For the time being yes. Once the idea for what `context` will be
 * in this... context... these two will differentiate themselves.
*/
export type Action = (ctx: State|InactiveState) => void;
export type Listener = (ctx: State|InactiveState) => void

export interface StateTarget {
    target: string;
    actions: Action[];
}

/**
 * A record of all events and where they should go to next
 */
export type Events = Record<string, string | StateTarget>;

/**
 * An object representation of the current state
 * 
 * includes entry and exit actions as well as event definitions
 */
export interface State {
    type: string|-1;
    on: Events;
    enter: Action|Action[];
    exit: Action|Action[];
}

export const inactiveState = { type: -1 };

/**
 * A state that has been made inactive
 */
export type InactiveState = Partial<State> & typeof inactiveState;
/**
 * A state that has not been processed to be interpreted by a machine
 */
export type UnformattedState = Partial<State> & { type: string };

/**
 * The interface for the machine that is created by the createMachine function
 */
export interface Machine {
    current: State['type'];
    done: boolean;
    next: (requestedState?:string) => void;
    subscribe: (listener:Listener) => () => void;
    send: (eventType: string) => void;
    destroy: () => void;
}