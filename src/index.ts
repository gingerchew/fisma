
/**
 * Are Actions and Listeners the same thing?
 * 
 * For the time being yes. Once the idea for what `context` will be
 * in this... context... these two will differentiate themselves.
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

function* _FSM(states:State[], ctx:Context) {
	function runActions(actions:Action|Action[] = []) {
		if (!(actions as Action[]).pop) {
			actions = [actions as Action];
		}
		(actions as Action[]).forEach((action) => action(activeState, ctx));
	}

	let nextState = 0,
		prevState = -1,
		activeState = states[nextState],
        requestedState:string|undefined;

	while (true) {
		if (nextState >= states.length) nextState = 0;
		
		runActions(states[nextState]?.enter);
		
		prevState = nextState;
		
		activeState = states[nextState];
		
		requestedState = yield activeState;

        runActions(states[prevState]?.exit);

        if (requestedState !== undefined) {
            nextState = states.findIndex(state => state.type === requestedState);
            if (nextState === -1) nextState = prevState;
        } else {
            nextState = states.findIndex(states => states.type === activeState.type) + 1;
        }
	}
}

function createMachine<T extends Context>(states:(string|State)[], ctx?:T) {
    ctx ??= {} as T;
    if (!states || states.length === 0) throw new Error('Machine cannot be stateless');
    states = states?.map(state => typeof state === 'string' ? ({ type: state }) : state);
	const _states = _FSM((states as State[]) ?? [], ctx);
    let _state = _states.next();
	
    const listeners = new Set<Action>();

	const $ = {
        get ctx() {
            return ctx;
        },
        /** Getters */
        get current() {
            return _state.value?.type ?? -1
        },
        get done() {
            return _state.done;
        },
        /** Methods */
        /**
         * Add a listener that fires on every state change
         */
        subscribe(listener:Action) {
            listeners.add(listener);

            listener(_state.value!, ctx);
            return () => listeners.delete(listener);
        },
        send(eventType:string) {
            if (!_state.value!.on) return;

            let next = _state.value?.on[eventType];

            if ((next as StateTarget).actions?.length) {
                (next as StateTarget).actions!.forEach(action => action(_state.value!, ctx))
            }
            $.next((next as StateTarget)?.target ?? next)
        },
        /**
         * Toggle through the state machine
         * Passing an optional state name will 
         * go to that state instead of
         * the next in index order
         */
		next(requestedState?:string) {
			_state = _states.next(requestedState);
            listeners.forEach(listener => listener(_state.value!, ctx));
		},
        /**
         * Kill the state machine/generator
         */
		destroy() {
			_state = _states.return();
            listeners.forEach(listener => listeners.delete(listener));
		}
	}
    return $;
}


export { createMachine };