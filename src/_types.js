import { DateTime, Interval, Duration, Zone } from 'luxon';

/**
 * @typedef {Object} DateTimeObject
 * @property {number} year
 * @property {number} month
 * @property {number} day
 * @property {number} ordinal
 * @property {number} weekYear
 * @property {number} weekMonth
 * @property {number} weekDay
 * @property {number} hour
 * @property {number} minute
 * @property {number} second
 * @property {number} millisecond
 * @property {string|Zone} zone
 */

/**
 * @typedef {DateTime|Date|string|number} DateTimeLike - can be a Luxon date, JS date, ISO-8601 string, or unix
 *     timestamp.
 */

/**
 * @typedef {Interval|{start: DateTimeLike, end: DateTimeLike}|[DateTimeLike, DateTimeLike]|string} IntervalLike - can
 *     be a Luxon interval, an object with start and end datetimelike properties, or an array of datetimelike
 *     properties.
 */

/**
 * @typedef {Object} DurationObject
 * @property {number} years
 * @property {number} quarters
 * @property {number} months
 * @property {number} weeks
 * @property {number} days
 * @property {number} hours
 * @property {number} minutes
 * @property {number} seconds
 * @property {number} milliseconds
 * @property {string|Zone} zone
 */

/**
 * @typedef {Duration|DurationObject|string|number} DurationLike - can be a Luxon duration, object with duration
 *     properties, a number of milliseconds, or a ISO-8601 duration string.
 */

/**
 * @typedef {Object} WeeklyPreference
 * @property {number} weight - non-negative integer. 0 indicates that the time should be avoided. larger number implies
 *     greater preference.
 * @property {Interval} interval - only the weekday and time are considered. must not overlap with another preference.
 *     The interval must not exceed one week in length.
 */

/**
 * @typedef {Object} WeeklyPreferenceLike
 * @property {number} weight
 * @property {IntervalLike} interval
 */

/**
 *  @typedef {Object} ParticipantData
 *  @property {string} [id] - participant id. only needed if eventsToSchedule has participants
 *  @property {Array<WeeklyPreference>} [weeklyPreferences]
 *  @property {Array<Interval>} [events] - events for the participant. Any events outside of provided scheduling
 *     timeframe will be clipped.
 *  @property {number} [weight] - non-negative integer. 0 indicates participant does not matter for scheduling
 */

/**
 * @typedef ParticipantDataLike
 * @property {string} [id]
 * @property {Array<WeeklyPreferenceLike>} [weeklyPreferences]
 * @property {Array<IntervalLike>} [events]
 * @property {Array<number>} [weight]
 */

/**
 * @typedef {Object} EventToSchedule
 * @property {Array<string>} participantIds
 * @property {Duration} eventDuration
 */

/**
 * @typedef {Object} EventToScheduleLike
 * @property {Array<string>} [participantIds]
 * @property {DurationLike} eventDuration
 */

/**
 * @typedef {Object} SchedulingParameters
 * @property {Interval} schedulingPeriod - period for which events are to be scheduled over
 * @property {Array<EventToSchedule>} eventsToSchedule - list of events to schedule. If not provided, then events will
 *     be scheduled according to the number of events for each participant
 * @property {number} numberOfEvents - one or more events that are to be scheduled. Required unless eventsToSchedule is
 *     provided. If provided along with eventsToSchedule, an error is thrown unless it matches the length of
 *     eventsToSchedule
 * @property {Array<Duration> | Duration} lengthOfEvents - length of time that events should be scheduled for. If array
 *     is provided, size of array must match number of events to be scheduled. Required unless eventsToSchedule is
 *     provided. If provided along with eventsToSchedule, it will serve as a default if a eventToSchedule is missing an
 *     eventDuration
 */

/**
 * @typedef {Object} SchedulingParametersLike
 * @property {IntervalLike} [schedulingPeriod]
 * @property {Array<EventToScheduleLike>} [eventsToSchedule]
 * @property {number} [numberOfEvents]
 * @property {Array<DurationLike>|DurationLike} [lengthOfEvents]
 */

/**
 * @typedef {Object} ScheduleEventsInput
 * @property {Array<ParticipantData>} participants - participant data
 * @property {SchedulingParameters} schedulingParameters - scheduling parameters
 * @property {Duration} resolution - interval sizes to be considered when scheduling. Defaults to 15 min. Note that
 *     smaller resolutions will take longer to form a result, and a meaningful resolution is expected. The algorithm
 *     may not work well when considering small resolutions over large timeframes.
 */

/**
 * @typedef {Object} ScheduleEventsInputLike
 * @property {Array<ParticipantDataLike>} [participants]
 * @property {SchedulingParametersLike} [schedulingParameters]
 * @property {DurationLike} [resolution]
 */

/**
 * @typedef {Object} ScheduleEventsState
 * @property {ScheduleEventsInput}
 */

/**
 * @typedef {Object} WeightedInterval
 * @property {number} weight
 * @property {number} effectiveWeight
 * @property {Interval} interval
 */

/**
 * @typedef {Array<WeightedInterval>} WeightedIntervalSet
 */

/**
 * @typedef {Object} ScheduleEventsOutput
 */