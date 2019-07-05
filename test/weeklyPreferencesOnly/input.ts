/**
 * Input Notes
 * - Scheduling Period is set to the one week long.
 * - Resolution is set to 30 minutes long. This means that only at half-hour increments will
 * an event be scheduled.
 * - A total of five events are scheduled.
 * - Each event is an hour and fifteen minutes long.
 * - User weekly preferences are considered (see notes below)
 *
 * Expectations in the output:
 * - As there is no weighting applied to any of the 30 minute segments, the first segments
 * will be scheduled first. So the expected event intervals that come out of this are:
 * -- [2019-07-02T14:30:00-0400, 2019-07-02T15:45:00-0400)
 * -- [2019-07-04T14:30:00-0400, 2019-07-04T15:45:00-0400)
 * -- [2019-07-02T12:00:00-0400, 2019-07-02T13:15:00-0400)
 * -- [2019-07-04T12:00:00-0400, 2019-07-04T13:15:00-0400)
 * -- [2019-07-01T14:30:00-0400, 2019-07-01T15:45:00-0400) -- the last one chosen is not in the range of valid sets, so
 * it then looks for the highest weight amongst non-zero weighted items.
 */
import { SchedulingEventsInputLike } from '../../types';
import { createWeekdayHoursWeeklyPreference, createWeekdayPreference } from '../../src';

export default {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-06-30T00:00:00-0400", end: "2019-07-06T00:00:00-0400" },
        numberOfEvents: 5,
        lengthOfEvents: { hours: 1, minutes: 15 },
    },
    participants: [{
        id: 'one',
        // only schedule between 8:00 AM and 4:00 PM
        weeklyPreferences: createWeekdayHoursWeeklyPreference({ hours: 8 }, { hours: 16 }, 'America/New_York'),
    }, {
        id: 'two',
        // only schedule between 12:00 PM and 8:00 AM
        weeklyPreferences: createWeekdayHoursWeeklyPreference({ hours: 12 }, { hours: 20 }, 'America/New_York'),
    }, {
        id: 'three',
        // cannot schedule monday, wednesday, or friday
        weeklyPreferences: [
            createWeekdayPreference('monday', { hours: 0 }, { hours: 24 }, 'America/New_York', 0),
            createWeekdayPreference('wednesday', { hours: 0 }, { hours: 24 }, 'America/New_York', 0),
            createWeekdayPreference('friday', { hours: 0 }, { hours: 24 }, 'America/New_York', 0),
        ],
    }, {
        id: 'four',
        // prefers 12:00 and 2:30 PM on each day of the week to other times, but all other times ok. Has an affinity
        // for wednesday at 3 PM as well.
        weeklyPreferences: [
            createWeekdayPreference('monday', { hours: 12 }, { hours: 14 }, 'America/New_York', 2),
            createWeekdayPreference('monday', { hours: 14, minutes: 30 }, { hours: 16 }, 'America/New_York', 3),
            createWeekdayPreference('tuesday', { hours: 12 }, { hours: 14 }, 'America/New_York', 2),
            createWeekdayPreference('tuesday', { hours: 14, minutes: 30 }, { hours: 16 }, 'America/New_York', 3),
            createWeekdayPreference('wednesday', { hours: 12 }, { hours: 14 }, 'America/New_York', 2),
            createWeekdayPreference('wednesday', { hours: 14, minutes: 30 }, { hours: 16 }, 'America/New_York', 3),
            createWeekdayPreference('thursday', { hours: 12 }, { hours: 14 }, 'America/New_York', 2),
            createWeekdayPreference('thursday', { hours: 14, minutes: 30 }, { hours: 16 }, 'America/New_York', 3),
            createWeekdayPreference('friday', { hours: 12 }, { hours: 14 }, 'America/New_York', 2),
            createWeekdayPreference('friday', { hours: 14, minutes: 30 }, { hours: 16 }, 'America/New_York', 3),

        ],
    }],
} as SchedulingEventsInputLike;