import {
    isArray,
    map,
    isPlainObject,
    isFinite,
    isString,
    isNil,
} from './_lodashImports';
import { DateTime, Duration, Interval } from 'luxon';

/**
 * @param {DurationLike} durationLike
 * @returns {Duration}
 */
function interpretDurationLike(durationLike) {
    try {
        if (Duration.isDuration(durationLike)) {
            return durationLike;
        }
        if (isPlainObject(durationLike)) {
            return Duration.fromObject(durationLike);
        }
        if (isFinite) {
            return Duration.fromMillis(durationLike);
        }
        if (isString) {
            return Duration.fromISO(durationLike);
        }
    } catch {
    }
    return Duration.invalid('invalid durationlike input');
}

/**
 * @param {IntervalLike} intervalLike
 * @returns {Interval}
 */
function interpretIntervalLike(intervalLike) {
    try {
        if (Interval.isInterval(intervalLike)) {
            return intervalLike;
        }
        if (isPlainObject(intervalLike)) {
            const { start, end } = intervalLike;
            return Interval.fromDateTimes(interpretDateTimeLike(start), interpretDateTimeLike(end));
        }
        if (isArray(intervalLike)) {
            const [start, end] = intervalLike;
            return Interval.fromDateTimes(interpretDateTimeLike(start), interpretDateTimeLike(end));
        }
        if (isString(intervalLike)) {
            return Interval.fromISO(string);
        }
    } catch {
    }
    return Interval.invalid('invalid intervallike input');
}

/**
 * @param {DateTimeLike} dateTimeLike
 * @returns {DateTime}
 */
function interpretDateTimeLike(dateTimeLike) {
    try {
        if (DateTime.isDateTime(dateTimeLike)) {
            return dateTimeLike;
        }
        if (dateTimeLike instanceof Date) {
            return DateTime.fromJSDate(date);
        }
        if (isString(dateTimeLike)) {
            return DateTime.fromISO(dateTimeLike);
        }
        if (isFinite(dateTimeLike)) {
            return DateTime.fromMillis(dateTimeLike);
        }
    } catch {
    }
    return DateTime.invalid('invalid datetimelike input');
}

/**
 * @param {number} number
 * @returns {number}
 */
function interpretNumber(number) {
    return isFinite(number) ? number : null;
}

/**
 * @param {number} weight
 * @returns {number}
 */
function interpretWeight(weight) {
    if (isNil(weight)) {
        return 1;
    }
    if (!isFinite(weight)) {
        return 0;
    }
    return Math.max(weight, 0);
}

/**
 * @param EventToScheduleLike
 * @returns {EventToSchedule}
 */
function interpretEventToSchedule({
    participantIds,
    eventDuration,
}) {
    return {
        participantIds: isArray(participantIds) ? participantIds : [],
        eventDuration: interpretDurationLike(eventDuration),
    };
}

/**
 * @param {Array<EventToScheduleLike>} eventsToSchedule
 * @returns {Array<EventToSchedule>}
 */
function interpretEventsToSchedule(eventsToSchedule) {
    return map(eventsToSchedule, interpretEventToSchedule);
}

/**
 * @param {Duration|Array<Duration>} lengthOfEvents
 * @returns {Duration|Array<Duration>}
 */
function interpretLengthOfEvents(lengthOfEvents) {
    return isArray(lengthOfEvents) ? lengthOfEvents.map(interpretDurationLike) : interpretDurationLike(lengthOfEvents);
}

/**
 * @param {SchedulingParametersLike} parameters
 * @returns {SchedulingParameters}
 */
function interpretSchedulingParameters({
    schedulingPeriod,
    eventsToSchedule,
    numberOfEvents,
    lengthOfEvents,
}) {
    return {
        schedulingPeriod: interpretIntervalLike(schedulingPeriod),
        eventsToSchedule: interpretEventsToSchedule(eventsToSchedule),
        numberOfEvents: interpretNumber(numberOfEvents),
        lengthOfEvents: interpretLengthOfEvents(lengthOfEvents),
    };
}

/**
 * @param {WeeklyPreferenceLike} weeklyPreference
 * @returns {WeeklyPreference}
 */
function interpretWeeklyPreference({
    weight,
    interval,
}) {
    return {
        weight: interpretWeight(weight),
        interval: interpretIntervalLike(interval),
    };
}

/**
 * @param {Array<WeeklyPreferenceLike>} weeklyPreferences
 * @returns {Array<WeeklyPreference>}
 */
function interpretWeeklyPreferences(weeklyPreferences) {
    return map(weeklyPreferences, interpretWeeklyPreference);
}

/**
 * @param {Array<IntervalLike>} events
 * @returns {Array<Interval>}
 */
function interpretEvents(events) {
    return map(events, interpretIntervalLike);
}

/**
 * @param {ParticipantDataLike} participantData
 * @returns {ParticipantData}
 */
function interpretParticipant({
    id,
    weeklyPreferences,
    events,
    weight,
}) {
    return {
        id: isString(id) ? id : null,
        weight: interpretWeight(weight),
        weeklyPreferences: interpretWeeklyPreferences(weeklyPreferences),
        events: interpretEvents(events),
    };
}

/**
 * @param {Array<ParticipantDataLike>} participants
 * @returns {Array<ParticipantData>}
 */
function interpretParticipants(participants) {
    return map(participants, interpretParticipant);
}

function interpretResolution(resolution) {
    return isNil(resolution)
        ? Duration.fromObject({ minutes: 15 })
        : interpretDurationLike(resolution);
}

/**
 * @param {ScheduleEventsInputLike} input
 * @return {ScheduleEventsInput} sanitized input
 */
export function interpretInput({
    participants,
    schedulingParameters,
    resolution,
} = {}) {
    return {
        participants: interpretParticipants(participants),
        schedulingParameters: interpretSchedulingParameters(schedulingParameters),
        resolution: interpretResolution(resolution),
    };
}