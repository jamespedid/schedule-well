import { expect } from 'chai';
import input from './input';
import expectedOutput from './output';
import { scheduleEvents } from '../../src';

describe('prescheduledEventsOnly', () => {
    it('should produce an output respecting existing events', () => {
        const actualOutput = scheduleEvents(input);
        console.log(JSON.stringify(actualOutput));
        expect(actualOutput).to.eql(expectedOutput);
    });
});