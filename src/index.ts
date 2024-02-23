/**
 * @NOTES I really don't like how I need to pass the
 * context through the typing like this to get the intellisense working
 * I wanna try and find another way before committing this as the context feature
 */
type Context = Record<string, any>;

type Action<T extends Context> = (state: State<T>, ctx: T) => void;
type ActionsParam<T extends Context> = Action<T>|Action<T>[]|undefined;

interface StateTarget<T extends Context> {
    target: string;
    actions: Action<T>[];
}

type Events<T extends Context> = Record<string, string | StateTarget<T>>;

interface State<T extends Context> {
    type: string;
    on?: Events<T>;
    enter?: Action<T>|Action<T>[];
    exit?: Action<T>|Action<T>[];
}


const runActions = <MachineContext extends Context> (actions: ActionsParam<MachineContext>, activeState:State<MachineContext>, ctx: MachineContext) => actions != null && (
        typeof actions === 'function' ? 
            actions(activeState, ctx) : 
            actions.forEach(action => action(activeState, ctx))
    );

function* FSM<MachineContext extends Context>(states:State<MachineContext>[], ctx:MachineContext) {
	let nextState = 0,
		prevState = -1,
		activeState = states[nextState],
        // Appeases the TS gods, now that the compiler thinks this can change, the return is reachable.
        shouldContinue = true,
        requestedState:string|undefined;
	
    while (shouldContinue) {
		if (nextState >= states.length) nextState = 0;
		
		runActions<MachineContext>(states[nextState].enter, activeState, ctx);
		
		requestedState = yield activeState = states[
            prevState = nextState
        ];

        runActions<MachineContext>(states[prevState].exit, activeState, ctx);

        if (requestedState !== undefined) {
            nextState = states.findIndex(state => state.type === requestedState);
            if (nextState === -1) nextState = prevState;
        } else {
            nextState = states.findIndex(states => states.type === activeState.type) + 1;
        }
	}
    return states[nextState];
}

function createMachine<MachineContext extends Context>(states:State<MachineContext>[] = [], ctx = {} as MachineContext) {
    if (!states.length) throw new Error('Machine cannot be stateless');

    let _states = states.map((potentialState) => typeof potentialState === 'string' ? ({ type: potentialState }) : potentialState),
        _machine = FSM<MachineContext>(_states, ctx),
        listeners = new Set<Action<MachineContext>>(),
        _state = _machine.next();
    return {
        get current() {
            return _state.value.type;
        },
        get done() {
            return _state.done;
        },
        /** Methods */
        /**
         * Add a listener that fires on every state change
         */
        subscribe(listener:Action<MachineContext>) {
            listeners.add(listener);

            listener(_state.value!, ctx);
            return () => listeners.delete(listener);
        },
        /**
         * Send an event to the machine
         * 
         * This will check the current state object
         * and transition to the designated state if the on exists
         * 
         * ```js
         * const _ = createMachine([
         *    {
         *      type: 'A',
         *      on: {
         *        TOGGLE: {
         *          target: 'NEXT',
         *          actions: []
         *        }
         *      },
         *    },
         *    {
         *      type: 'B',
         *      on: {
         *        TOGGLE: { ... }
         *      }
         *    }
         *    'NEXT'
         * ]);
         * 
         * _.send('TOGGLE');
         * ```
         * 
         */
        send(eventType:string) {
            if (!_state.value.on) return;

            let next = _state.value.on[eventType] as StateTarget<MachineContext>;

            next.actions?.forEach(action => action(_state.value, ctx));
            this.next(next.target ?? next)
        },
        /**
         * Toggle through the state machine
         * Passing an optional state name will 
         * go to that state instead of
         * the next in index order
         */
		next(requestedState?:string) {
			_state = _machine.next(requestedState);
            listeners.forEach(listener => listener(_state.value, ctx));
		},
        /**
         * Kill the state machine/generator
         */
		stop() {
			_state = _machine.return(this.current);
            listeners.clear();
		}
	}
}


export { createMachine };