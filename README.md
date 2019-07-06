# schedule-well
Node.JS calendar scheduling algorithm.

This library allows you to generate a set of scheduled events given a period to schedule over, a list of participants along with their weekly preferences and currently scheduled events, and a resolution.

The algorithm works by splitting up the input period into many subintervals according to the resolution parameter. Then the scheduled events and weekly preferences of participants for each event are taken into account. From there, a number of events will be scheduled that maximizes the weekly preferences of each participant.

## Installation

The package exists on NPM. Use npm or yarn to retrieve the package and add it to your package.json.

`npm install schedule-well --save`

`yarn add schedule-well`

## How to Use

### scheduleEvents

The `scheduleEvents` function is the main export of the package. See tests for some example usage.
The minimum usage is listed here for convenience.

```
import { scheduleEvents } from 'schedule-well';

const input = {
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
}

const output = scheduleEvents(input);
```

#### scheduleEvents input

schedule-well uses the Luxon datetime library internally to handle its datetimes, intervals, durations, and timezones.

`https://www.npmjs.com/package/luxon`

One feature of the library is that you can use plain javascript objects in many places where Luxon objects are expected. This will allow the library to be used without having to explicitly import luxon into your package.

`DurationLike` accepts a Luxon Duration, a duration object, an ISO string for periods, or a number of milliseconds.

`DateTimeLike` accepts a Luxon datetime, a javascript date, an ISO string for datetimes, or a number of milliseconds since Jan 1, 1970.

`IntervalLike` accepts a Luxon interval, or an object `{ start: DateTimeLike, end: DateTimeLike }`

Input formats:
```
{
    resolution: DurationLike,
    participants: {
        id: string|symbol,
        weeklyPreferences: {
            weight: number,
            interval: IntervalLike
        }[]
    }[].
    schedulingParameters: {
        schedulingInterval: IntervalLike,
        ambientWeeklyPreferences: {
            weight: number,
            interval: IntervalLike
        }[],
        eventsToSchedule: {
            participantIds: (string|symbol)[]
            eventDuration: DurationLike
        }[],
    }
}
```

or 

```
{
    resolution: DurationLike,
    participants: {
        id: string|symbol,
        weeklyPreferences: {
            weight: number,
            interval: IntervalLike
        }[]
    }[].
    schedulingParameters: {
        schedulingInterval: IntervalLike,
        ambientWeeklyPreferences: {
            weight: number,
            interval: IntervalLike
        }[],
        numberOfEvents: number,
        lengthOfEvents: DurationLike | DurationLike[]
    }
}
```

Output:

```
{
    participantIds: (string|symbol)[];
    eventInterval: {
        start: DateTime, //Luxon datetimes
        end: DateTime
    };
}[]
```

Refer to typescript types for more detailed information about what can be provided.