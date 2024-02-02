
type Action = (ctx:Context) => void;

type Listener = (ctx: IteratorResult<State, void>) => void
interface Context {
    name: string;
}

interface State {
    name: string;
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
            nextState = states.findIndex(state => state.name === requestedState) ?? activeState;
        } else {
            nextState = states.findIndex(states => states.name === activeState.name) + 1;
        }

		runActions(states[prevState]?.exit);
	}
}

function createMachine(states?:(string|State)[]) {
    states = states?.map(state => typeof state === 'string' ? ({ name: state }) : state);
	const _states = _FSM((states as State[]) ?? []);
    let _ctx = _states.next();
	
    const listeners = new Set<Listener>();

	return {
        /** Getters */
        get active() {
            return _ctx.value?.name ?? UNINIT
        },
        get done() {
            return _ctx.done;
        },

        /** Meta */
        matches(stateNameToCheck:string) {
            return stateNameToCheck === this.active;
        },
        /** Methods */
        dispatch(event:string) {
            if (this.done) return;
            
            listeners.forEach(listener => listener(_ctx));
        },
        subscribe(listener:Listener) {
            listeners.add(listener);
            listener(_ctx);
            return () => listeners.delete(listener);
        },
		next(requestedState?:string) {
			_ctx = _states.next(requestedState);
            listeners.forEach(listener => listener(_ctx));
		},
		destroy() {
			_ctx = _states.return();
		},
	}
}


export { createMachine };