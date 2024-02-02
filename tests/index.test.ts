// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest';
import { createMachine } from '../src/index';


describe('Finite State Machine', () => {
    test('Returns createMachine object', () => {
        const _ = createMachine();

        expect('next' in _).toBe(true);
        expect('destroy' in _).toBe(true);
    });

    test('Goes to next state', () => {
        const _ = createMachine([
            { name: 'A' },
            { name: 'B' }
        ]);

        expect(_.active).toBe('A');
        _.next();
        expect(_.active).toBe('B');
    });

    test('Is destroyed properly', () => {
        const _ = createMachine([
            { name: 'A' },
            { name: 'B' }
        ]);

        expect(_.done).toBe(false);

        _.destroy();

        expect(_.done).toBe(true);
    });

    test('Matches', () => {
        const _ = createMachine([
            { name: 'A' },
            { name: 'B' }
        ]);

        expect(_.matches('A')).toBe(true);
        _.next();
        expect(_.matches('B')).toBe(true);
        expect(_.matches('C')).toBe(false);
    });

    test('Enter actions: single', () => {
        let i = 0;
        const _ = createMachine([
            { name: 'A' },
            { name: 'B', enter() { i = 1; } }
        ]);

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(1);
    });

    test('Enter actions: array', () => {
        let i = 0;
        let incr = () => i += 1;

        const _ = createMachine([
            { name: 'A' },
            { name: 'B', enter: [ incr, incr, incr ] }
        ]);
        expect(i).toBe(0);
        _.next();
        expect(i).toBe(3);
    });

    test('Exit actions: single', () => {
        let i = 0;
        const _ = createMachine([
            { name: 'A', exit() { i += 1 } },
            { name: 'B' }
        ]);

        expect(i).toBe(0);
        _.next();
        expect(i).toBe(1);
    });

    test('Exit actions: array', () => {
        let i = 0;
        let incr = () => i += 1;

        const _ = createMachine([
            { name: 'A', exit: [ incr, incr, incr ]},
            { name: 'B' }
        ]);
        expect(i).toBe(0);
        _.next();
        expect(i).toBe(3);
    });

    test('Transition', () => {
        const _ = createMachine([
            { name: 'A' },
            { name: 'B' },
            { name: 'TOGGLE' }
        ]);

        expect(_.active).toBe('A');

        _.next('TOGGLE');

        expect(_.active).toBe('TOGGLE');
    });

    test('Support string only state', () => {
        const _ = createMachine([
            'A',
            { name: 'B' }
        ]);

        expect(_.active).toBe('A');
    });

    test('Subscribe', () => {
        let i = 0;
        const _ = createMachine([
            { name: 'A' },
            { name: 'B' }
        ]);

        _.subscribe(() => {
            i += 1
        });

        expect(i).toBe(1);
        _.next();
        expect(i).toBe(2);
    })
})