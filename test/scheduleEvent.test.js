import os from 'os';
import { Settings } from 'luxon';
Settings.defaultZoneName = 'utc';
import { scheduleEvents } from '../src';
import minimumInput from './input_bareMinimum';
import prescheduledEventsInput from './input_prescheduledEvents';
import weeklyPreferences from './input_weeklyPreferences';

describe('scheduleEvents', function () {
    // it('should produce a schedule with a bare minimum amount of input', () => {
    //     const results = scheduleEvents(minimumInput);
    //     console.log('results1');
    //     results.forEach(result => console.log(result.toString()));
    //     console.log(os.EOL);
    // });
    // it('should produce a schedule that avoids scheduling over pre-existing events', () => {
    //     const results = scheduleEvents(prescheduledEventsInput);
    //     console.log('results2');
    //     results.forEach(result => console.log(result.toString()));
    //     console.log(os.EOL);
    // });
    it('should produce a schedule that respects weekly preferences', () => {
        const results = scheduleEvents(weeklyPreferences);
        console.log('results3');
        results.forEach(result => console.log(result.toString()));
        console.log(os.EOL);
    });
});