import { expect, test } from 'vitest';
import { angleDelta } from '../src/lib/compass.js';

test('angleDelta takes the short way round', () => {
    expect(angleDelta(0, 64)).toBe(64);   // turn right
    expect(angleDelta(64, 0)).toBe(-64);  // turn left
    expect(angleDelta(350, 10)).toBe(20); // across north
    expect(angleDelta(10, 350)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
});
