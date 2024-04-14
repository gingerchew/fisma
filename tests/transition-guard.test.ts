import { createMachine } from "../src";
import { it, describe, expect } from 'vitest';

describe('fisma/transition guard', () => {
    it('should prevent transitions', () => {
        let shouldTrans = false;
        const m = createMachine({
            states: {
                A: {
                    cond: () => shouldTrans
                },
                B: {}
            }
        });

        m.next();
        expect(m.current).toBe('A');
        shouldTrans = true;
        m.next();
        expect(m.current).toBe('B');
    })
})