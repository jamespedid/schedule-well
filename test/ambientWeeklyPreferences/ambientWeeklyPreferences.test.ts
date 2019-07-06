import { expect } from 'chai';
import input from './input';
import expectedOutput from './output';
import { scheduleEvents } from '../../src';

describe('ambientWeeklyPreferences', () => {
    it('should produce an output with the minimum input', () => {
        const actualOutput = scheduleEvents(input);
        console.log(JSON.stringify(actualOutput));
        expect(actualOutput).to.eql(expectedOutput);
    });
});