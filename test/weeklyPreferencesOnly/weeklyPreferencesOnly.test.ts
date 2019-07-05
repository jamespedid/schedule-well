import { expect } from 'chai';
import input from './input';
import expectedOutput from './output';
import { scheduleEvents } from '../../src';

describe('minimumInput', () => {
    it('should produce an output with the weekly preferences considered', () => {
        const actualOutput = scheduleEvents(input);
        console.log(JSON.stringify(actualOutput));
        expect(actualOutput).to.eql(expectedOutput);
    });
});