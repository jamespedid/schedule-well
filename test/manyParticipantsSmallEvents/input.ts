/**
 * Input Notes
 * - Scheduling Period is set to be four hours long.
 * - Resolution is set to 15 minutes long. This means that only at quarter-hour increments will
 * an event be scheduled.
 * - A total of 10 events are scheduled.
 * - Each event is 30 minutes long.
 * - there are eight participants, each having an event with each other participant once.
 *
 * Expectations in the output:
 * - each participant has eight games scheduled, none of which overlap.
 */
import { SchedulingEventsInputLike } from '../../types';

export default {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-06-30T12:00:00-0400", end: "2019-06-30T16:00:00-0400" },
        lengthOfEvents: { minutes: 30 },
        eventsToSchedule: [{
            participantIds: ['one', 'two'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['one', 'three'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['one', 'four'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['one', 'five'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['one', 'six'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['one', 'seven'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['one', 'eight'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['two', 'three'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['two', 'four'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['two', 'five'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['two', 'six'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['two', 'seven'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['two', 'eight'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['three', 'four'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['three', 'five'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['three', 'six'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['three', 'seven'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['three', 'eight'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['four', 'five'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['four', 'six'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['four', 'seven'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['four', 'eight'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['five', 'six'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['five', 'seven'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['five', 'eight'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['six', 'seven'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['six', 'eight'],
            eventDuration: { minutes: 30 },
        }, {
            participantIds: ['seven', 'eight'],
            eventDuration: { minutes: 30 },
        }],
    },
    participants: [{
        id: 'one',
    }, {
        id: 'two'
    }, {
        id: 'three'
    }, {
        id: 'four'
    }, {
        id: 'five'
    }, {
        id: 'six'
    }, {
        id: 'seven'
    }, {
        id: 'eight'
    }]
} as SchedulingEventsInputLike;