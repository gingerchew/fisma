// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { createMachine } from '../src/index';


describe('Finite State Machine', () => {
    test('Returns createMachine object', () => {
        const _ = createMachine(['A']);

        expect(_.current).toBe('A');
        expect(_.done).toBe(false);
        expect('next' in _).toBe(true);
        expect('destroy' in _).toBe(true);
        expect('send' in _).toBe(true);
        expect('subscribe' in _).toBe(true);
    });

    // @ts-ignore
    test.fails('Fails when stateless', () => createMachine())

    test('Goes to next state', () => {
        const _ = createMachine([
            { type: 'A' },
            { type: 'B' }
        ]);

        expect(_.current).toBe('A');
        _.next();
        expect(_.current).toBe('B');
    });

    test('Is destroyed properly', () => {
        const _ = createMachine(['A']);
        expect(_.current).toBe('A');
        expect(_.done).toBe(false);

        _.destroy();

        expect(_.current).toBe(-1);
        expect(_.done).toBe(true);
    });

    test('Enter actions: single', () => {
        let i = 0;
        const _ = createMachine([
            { type: 'A' },
            { type: 'B', enter() { i += 1; } }
        ]);

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(1);
    });

    test('Enter actions: array', () => {
        let i = 0;
        let incr = () => i += 1;

        const _ = createMachine([
            { type: 'A' },
            { type: 'B', enter: [ incr, incr, incr ] }
        ]);
        expect(i).toBe(0);
        _.next();
        expect(i).toBe(3);
    });

    test('Exit actions: single', () => {
        let i = 0;
        const _ = createMachine([
            { type: 'A', exit() { i += 1 } },
            { type: 'B' }
        ]);

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(1);
    });

    test('Exit actions: array', () => {
        let i = 0;
        let incr = () => i += 1;

        const _ = createMachine([
            { type: 'A', exit: [ incr, incr, incr ]},
            { type: 'B' }
        ]);

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(3);
    });


    test('Transition', () => {
        const _ = createMachine([
            { type: 'A' },
            { type: 'B' },
            { type: 'TOGGLE' }
        ]);

        expect(_.current).toBe('A');

        _.next('TOGGLE');

        expect(_.current).toBe('TOGGLE');
    });

    test('Transition to non-existant state should stay at current state', () => {
        const _ = createMachine([
            { type: 'A' },
            { type: 'B' }
        ]);

        expect(_.current).toBe('A');
        _.next('C');
        expect(_.current).toBe('A');
    });

    test('Support string only state', () => {
        const _ = createMachine([
            'A',
            { type: 'B' }
        ]);

        expect(_.current).toBe('A');
    });

    test('Subscribe', () => {
        let i = 0;
        const _ = createMachine([
            { type: 'A' },
            { type: 'B' }
        ]);

        const unsub = _.subscribe(() => i += 1);

        expect(i).toBe(1);
        _.next();
        expect(i).toBe(2);
        unsub();
        _.next();
        expect(i).toBe(2);
    });

    test('Send', () => {
        const _ = createMachine([
            { 
                type: 'A',
                on: { 
                    NEXT: 'C'
                }
            },
            {
                type: 'B'
            },
            {
                type: 'C'
            }
        ]);


        expect(_.current).toBe('A');
        _.send('NEXT');
        expect(_.current).toBe('C');
    });

    test('Send Actions', () => {
        let i = 0;
        const _ = createMachine([
            {
                type: 'A',
                on: {
                    NEXT: {
                        target: 'C',
                        actions: [
                            () => i += 1
                        ]
                    }
                }
            },
            { type: 'B' },
            { type: 'C' }
        ]);

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(0);
        _.next('A');
        
        _.send('NEXT');
        
        expect(i).toBe(1);
    })

    test('Actions should not run on send to same state', () => {
        let i = 0;

        const _ = createMachine([
            { type: 'A', enter() { i += 1 }, exit() { i += 1 } },
            { type: 'B' }
        ]);

        _.next('A');

        expect(i).toBe(0);
        _.next();

        expect(i).toBe(1);
    })
});