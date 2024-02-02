
/**
 * Are Actions and Listeners the same thing?
 * 
 * For the time being yes. Once the idea for what `context` will be
 * in this... context... these two will differentiate themselves.
 */
type Action = (ctx: State) => void;
type Listener = (ctx: State) => void

interface StateTarget {
    target: string;
    actions: Action[];
}

type Events = Record<string, string | StateTarget>;

interface State {
    type: string;
    on?: Events;
    enter?: Action|Action[];
    exit?: Action|Action[];
}

const UNINIT = -1

function* _FSM(states:State[]) {
	function runActions(actions:Action|Action[] = []) {
		if (!(actions as Action[]).pop) {
			actions = [actions as Action];
		}
		(actions as Action[]).forEach((action) => action(activeState));
	}

	let nextState = 0,
		prevState = UNINIT,
		activeState = states[nextState],
        requestedState:string|undefined;

	while (true) {
		if (nextState >= states.length) nextState = 0;
		
		runActions(states[nextState]?.enter);
		
		prevState = nextState;
		
		activeState = states[nextState];
		
		requestedState = yield activeState;

        if (requestedState !== undefined) {
            nextState = states.findIndex(state => state.type === requestedState);
            if (nextState === UNINIT) nextState = prevState;
        } else {
            nextState = states.findIndex(states => states.type === activeState.type) + 1;
        }

		runActions(states[prevState]?.exit);
	}
}

function createMachine(states?:(string|State)[]) {
    states = states?.map(state => typeof state === 'string' ? ({ type: state }) : state);
	const _states = _FSM((states as State[]) ?? []);
    let _ctx = _states.next();
	
    const listeners = new Set<Listener>();

	return {
        /** Getters */
        get active() {
            return _ctx.value?.type ?? UNINIT
        },
        get done() {
            return _ctx.done;
        },
        /** Methods */
        /**
         * Add a listener that fires on every state change
         */
        subscribe(listener:Listener) {
            listeners.add(listener);

            listener(_ctx.value!);
            return () => listeners.delete(listener);
        },
        send(eventType:string) {
            if (!_ctx.value!.on) return;

            let next = _ctx.value?.on[eventType];

            if ((next as StateTarget).actions?.length) {
                (next as StateTarget).actions!.forEach(action => action(_ctx.value!))
            }
            this.next((next as StateTarget)?.target ?? next)
        },
        /**
         * Toggle through the state machine
         * Passing an optional state name will 
         * go to that state instead of
         * the next in index order
         */
		next(requestedState?:string) {
			_ctx = _states.next(requestedState);
            listeners.forEach(listener => listener(_ctx.value!));
		},
        /**
         * Kill the state machine/generator
         */
		destroy() {
			_ctx = _states.return();
            listeners.forEach(listener => listeners.delete(listener));
		}
	}
}


export { createMachine };