/**
 * Input Notes
 * - Scheduling Period is set to the one week long.
 * - Resolution is set to 30 minutes long. This means that only at half-hour increments will
 * an event be scheduled.
 * - A total of five events are scheduled.
 * - Each event is an hour and fifteen minutes long.
 *
 * Expectations in the output:
 * - As there is no weighting applied to any of the 30 minute segments, the first segments
 * will be scheduled first. So the expected event intervals that come out of this are:
 * -- [2019-06-30T00:00:00-0400, 2019-06-30T01:15:00-0400)
 * -- [2019-06-30T01:30:00-0400, 2019-06-30T02:45:00-0400)
 * -- [2019-06-30T03:00:00-0400, 2019-06-30T04:15:00-0400)
 * -- [2019-06-30T04:30:00-0400, 2019-06-30T05:45:00-0400)
 * -- [2019-06-30T06:00:00-0400, 2019-06-30T07:15:00-0400)
 */
import { SchedulingEventsInputLike } from '../../types';

export default {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-06-30T00:00:00-0400", end: "2019-07-06T00:00:00-0400" },
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