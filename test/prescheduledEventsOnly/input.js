/**
 * Input Notes
 * - Scheduling Period is set to the one week long.
 * - Resolution is set to 30 minutes long. This means that only at half-hour increments will
 * an event be scheduled.
 * - A total of five events are scheduled.
 * - Each event is an hour and fifteen minutes long.
 * - Participants have some events that should not be scheduled over
 *
 * Expectations in the output:
 * - As there is no weighting applied to any of the 30 minute segments, the first segments
 * will be scheduled first. Only times that do not overlap with participant intervals will be considered.
 * So the expected event intervals that come out of this are:
 * -- [2019-06-30T00:04:00-0400, 2019-06-30T05:15:00-0400)
 * -- [2019-06-30T05:30:00-0400, 2019-06-30T06:45:00-0400)
 * -- [2019-06-30T20:00:00-0400, 2019-06-30T21:15:00-0400)
 * -- [2019-06-30T21:30:00-0400, 2019-06-30T22:45:00-0400)
 * -- [2019-06-30T23:00:00-0400, 2019-07-01T00:15:00-0400)
 */
export default {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-06-30T00:00:00-0400", end: "2019-07-06T00:00:00-0400" },
        numberOfEvents: 5,
        lengthOfEvents: { hours: 1, minutes: 15 },
    },
    participants: [{
        id: 'one',
        events: [{
            start: "2019-06-30T00:00:00-0400",
            end: "2019-06-30T04:00:00-0400",
        }],
    }, {
        id: 'two',
        events: [{
            start: "2019-06-30T08:00:00-0400",
            end: "2019-06-30T12:00:00-0400",
        }, {
            start: "2019-06-30T16:00:00-0400",
            end: "2019-06-30T20:00:00-0400",
        }],
    }, {
        id: 'three',
    }, {
        id: 'four',
        events: [{
            start: "2019-06-30T12:00:00-0400",
            end: "2019-06-30T16:00:00-0400",
        }],
    }],
};