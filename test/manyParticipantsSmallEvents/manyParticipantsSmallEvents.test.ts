import { expect } from 'chai';
import input from './input';
import expectedOutput from './output';
import { scheduleEvents } from '../../src';

describe('manyParticipantsSmallEvents', () => {
    it('should produce schedule each participant over the given duration into a unique game', () => {
        const actualOutput = scheduleEvents(input);
        console.log(JSON.stringify(actualOutput));
        expect(actualOutput).to.eql(expectedOutput);
    });
});