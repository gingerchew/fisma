// @vitest-environment jsdom
import { describe, expect, test, it } from 'vitest';
import { createMachine } from '../src/index';


describe('Finite State Machine', () => {
    const A = {};
    test('Returns createMachine object', () => {
        const _ = createMachine({
            states: {
                A
            }
        });

        expect(_.current).toBe('A');
        expect(_.done).toBe(false);
        expect('next' in _).toBe(true);
        expect('destroy' in _).toBe(true);
        expect('send' in _).toBe(true);
        expect('subscribe' in _).toBe(true);
    });

    // @ts-ignore
    test.fails('Fails when no config is passed', () => createMachine())
    // @ts-ignore
    test.fails('Fails when no states are passed', () => createMachine({ id: 'this-should-fail' }));
    it('should create a default id', () => {
        const m = createMachine({
            states: { A }
        });

        expect(typeof m.id).toBe('string');
        expect(m.id.indexOf('m-')).toBe(0);
    });

    it('should store a passed id', () => {
        const m = createMachine({
            id: 'myId',
            states: { A }
        });

        expect(m.id).toBe('myId');
    })


    it('should have the correct initial state', () => {
        const m = createMachine({
            states: { A }
        });
        const n = createMachine({
            initial: 'B',
            states: { A, B : {} }
        });
        
        expect(m.initial).toBe('A');
        expect(n.current).toBe('B')
    })


    test('Goes to next state', () => {
        const _ = createMachine({
            states: {
                A,
                B: {}
            }
        });

        expect(_.current).toBe('A');
        _.next();
        expect(_.current).toBe('B');
    });

    test('Is destroyed properly', () => {
        const _ = createMachine({
            states: {
                A
            }
        });
        expect(_.current).toBe('A');
        expect(_.done).toBe(false);

        _.destroy();

        expect(_.current).toBe(-1);
        expect(_.done).toBe(true);
    });

    it('should destroy itself when reaching final state', () => {
        const m = createMachine({
            final: 'FINAL',
            states: {
                A,
                FINAL: {}
            }
        });
        
        expect(m.current).toBe('A');

        m.next();
        
        expect(m.current).toBe(-1);
    })

    test('Enter actions: single', () => {
        let i = 0;
        const _ = createMachine({
            states: {
                A,
                B: {
                    enter() {
                        i += 1;
                    }
                }
            }
        });

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(1);
    });

    test('Enter actions: array', () => {
        let i = 0;
        let incr = () => i += 1;

        const _ = createMachine({
            states: {
                A,
                B: {
                    enter: [ incr, incr, incr ]
                }
            }
        });
        expect(i).toBe(0);
        _.next();
        expect(i).toBe(3);
    });

    test('Exit actions: single', () => {
        let i = 0;
        const _ = createMachine({
            states: {
                A: {
                    exit() {
                        i += 1;
                    }
                },
                B: {}
            }
        });

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(1);
    });

    test('Exit actions: array', () => {
        let i = 0;
        let incr = () => i += 1;

        const _ = createMachine({
            states: {
                A: {
                    exit: [ incr, incr, incr ]
                },
                B: {}
            }
        });

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(3);
    });


    test('Transition', () => {
        const _ = createMachine({
            states: { A, B: {}, TOGGLE: {} }
        });

        expect(_.current).toBe('A');

        _.next('TOGGLE');

        expect(_.current).toBe('TOGGLE');
    });

    test('Transition to non-existant state should stay at current state', () => {
        const _ = createMachine({
            states: { A, B: {} }
        });

        expect(_.current).toBe('A');
        _.next('C');
        expect(_.current).toBe('A');
    });

    test('Subscribe', () => {
        let i = 0;
        const _ = createMachine({
            states: {
                A,
                B: {}
            }
        });

        const unsub = _.subscribe(() => i += 1);

        expect(i).toBe(1);
        _.next();
        expect(i).toBe(2);
        unsub();
        _.next();
        expect(i).toBe(2);
    });

    test('Send', () => {
        const _ = createMachine({
            states: {
                A: {
                    on: {
                        NEXT: 'C',
                    }
                },
                B: {},
                C: {},
            }
        });


        expect(_.current).toBe('A');
        _.send('NEXT');
        expect(_.current).toBe('C');
    });

    test('Send Actions', () => {
        let i = 0;
        const _ = createMachine({
            states: {
                A: {
                    on: {
                        NEXT: {
                            target: 'C',
                            actions: [
                                () => i += 1
                            ]
                        }
                    }
                },
                B: {},
                C: {}
            }
        });

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(0);
        _.next('A');
        _.send('NEXT');
        
        expect(i).toBe(1);
    })

    test('Actions should not run on send to same state', () => {
        let i = 0;

        const _ = createMachine({
            states: {
                A: {
                    enter() {
                        i += 1;
                    },
                    exit() {
                        i += 1;
                    }
                },
                B: {}
            }
        });

        _.next('A');

        expect(i).toBe(0);
        _.next();

        expect(i).toBe(1);
    })
});