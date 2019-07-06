/**
 * Input Notes
 * - Scheduling Period is set to the one week long.
 * - Resolution is set to 30 minutes long. This means that only at half-hour increments will
 * an event be scheduled.
 * - A total of five events are scheduled.
 * - Each event is an hour and fifteen minutes long.
 * - Ambient weekly preferences are applied for 9-5 hours weekdays
 *
 * Expectations in the output:
 * - As there is no weighting applied to any of the 30 minute segments, the first segments
 * will be scheduled first. So the expected event intervals that come out of this are:
 * -- [2019-07-01T09:00:00-0400, 2019-07-01T10:15:00-0400) <-- scheduling starts on monday morning with ambient preference
 * -- [2019-07-01T10:30:00-0400, 2019-07-01T11:45:00-0400)
 * -- [2019-07-01T12:00:00-0400, 2019-07-01T13:15:00-0400)
 * -- [2019-07-01T13:30:00-0400, 2019-07-01T14:45:00-0400)
 * -- [2019-07-02T09:00:00-0400, 2019-07-02T10:15:00-0400) <--- chosen because 4:00-5:15 PM is outside of ambient weekly preferences
 */
import { SchedulingEventsInputLike } from '../../types';
import { createWeekdayHoursWeeklyPreference } from '../../src';

export default {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-06-30T00:00:00-0400", end: "2019-07-06T00:00:00-0400" },
        ambientWeeklyPreferences: createWeekdayHoursWeeklyPreference({ hours: 9 }, { hours: 16 }, 'America/New_York'),
        numberOfEvents: 5,
        lengthOfEvents: { hours: 1, minutes: 15 },
    },
    participants: [{
        id: 'one',
    }, {
        id: 'two'
    }, {
        id: 'three'
    }, {
        id: 'four'
    }]
} as SchedulingEventsInputLike;