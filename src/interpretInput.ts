import {
    isArray,
    map,
    isPlainObject,
    isFinite,
    isString,
    isNil,
} from './_lodashImports';
import { Duration, Interval, DurationObject, DateTime } from 'luxon';
import {
    DurationLike,
    IntervalLike,
    IntervalObject,
    IntervalArray,
    DateTimeLike,
    EventToScheduleLike,
    SchedulingParametersLike,
    WeeklyPreferenceLike,
    ParticipantId,
    ParticipantDataLike,
    SchedulingEventsInputLike,
    SchedulingEventsInput,
    ParticipantData,
    EventToSchedule,
    SchedulingParameters, WeeklyPreference,
} from "../types";

export function interpretDurationLike(durationLike?: DurationLike): Duration {
    try {
        if (Duration.isDuration(durationLike)) {
            return durationLike;
        }
        if (isPlainObject(durationLike)) {
            return Duration.fromObject(durationLike as DurationObject);
        }
        if (isFinite(durationLike)) {
            return Duration.fromMillis(durationLike as number);
        }
        if (isString(durationLike)) {
            return Duration.fromISO(durationLike as string);
        }
    } catch {
    }
    return Duration.invalid('invalid durationlike input');
}

function interpretIntervalLike(intervalLike: IntervalLike): Interval {
    try {
        if (Interval.isInterval(intervalLike)) {
            return intervalLike;
        }
        if (isPlainObject(intervalLike)) {
            const { start, end } = intervalLike as IntervalObject;
            return Interval.fromDateTimes(interpretDateTimeLike(start), interpretDateTimeLike(end));
        }
        if (isArray(intervalLike)) {
            const [start, end] = intervalLike as IntervalArray;
            return Interval.fromDateTimes(interpretDateTimeLike(start), interpretDateTimeLike(end));
        }
        if (isString(intervalLike)) {
            return Interval.fromISO(intervalLike as string);
        }
    } catch {
    }
    return Interval.invalid('invalid intervallike input');
}

function interpretDateTimeLike(dateTimeLike: DateTimeLike): DateTime {
    try {
        if (DateTime.isDateTime(dateTimeLike)) {
            return dateTimeLike;
        }
        if (dateTimeLike instanceof Date) {
            return DateTime.fromJSDate(dateTimeLike);
        }
        if (isString(dateTimeLike)) {
            return DateTime.fromISO(dateTimeLike);
        }
        if (isFinite(dateTimeLike)) {
            return DateTime.fromMillis(dateTimeLike as number);
        }
    } catch {
    }
    return DateTime.invalid('invalid datetimelike input');
}

function interpretNumber(number?: number): number | null {
    if (isFinite(number)) {
        return typeof number === 'undefined' ? null : number;
    } else {
        return null;
    }
}

function interpretWeight(weight?: number): number {
    if (isNil(weight)) {
        return 1;
    }
    if (!isFinite(weight)) {
        return 0;
    }
    return Math.max(weight, 0);
}

function interpretEventToSchedule({
    participantIds,
    eventDuration,
}: EventToScheduleLike): EventToSchedule {
    return {
        participantIds: isArray(participantIds) ? participantIds : [],
        eventDuration: interpretDurationLike(eventDuration),
    };
}

function interpretEventsToSchedule(eventsToSchedule?: EventToScheduleLike[]): EventToSchedule[] {
    return isArray(eventsToSchedule) ? map(eventsToSchedule, interpretEventToSchedule) : [];
}

function interpretLengthOfEvents(lengthOfEvents?: DurationLike | DurationLike[]): Duration | Duration[] {
    return isArray(lengthOfEvents) ? lengthOfEvents.map(interpretDurationLike) : interpretDurationLike(lengthOfEvents);
}

function interpretSchedulingParameters({
    schedulingPeriod,
    ambientWeeklyPreferences,
    eventsToSchedule,
    numberOfEvents,
    lengthOfEvents,
}: SchedulingParametersLike): SchedulingParameters {
    return {
        schedulingPeriod: interpretIntervalLike(schedulingPeriod),
        ambientWeeklyPreferences: interpretWeeklyPreferences(ambientWeeklyPreferences),
        eventsToSchedule: interpretEventsToSchedule(eventsToSchedule),
        numberOfEvents: interpretNumber(numberOfEvents) || (eventsToSchedule && eventsToSchedule.length) || 0,
        lengthOfEvents: interpretLengthOfEvents(lengthOfEvents),
    };
}

function interpretWeeklyPreference({
    weight,
    interval,
}: WeeklyPreferenceLike): WeeklyPreference {
    return {
        weight: interpretWeight(weight),
        interval: interpretIntervalLike(interval),
    };
}

function interpretWeeklyPreferences(weeklyPreferences?: WeeklyPreferenceLike[]): WeeklyPreference[] {
    return isArray(weeklyPreferences) ? map(weeklyPreferences, interpretWeeklyPreference) : [];
}

function interpretEvents(events?: IntervalLike[]): Interval[] {
    return isArray(events) ? map(events, interpretIntervalLike) : [];
}

function interpretParticipant({
    id,
    weeklyPreferences,
    events,
    weight,
}: ParticipantDataLike): ParticipantData {
    return {
        id: isString(id) ? id : generateSymbolId(),
        weight: interpretWeight(weight),
        weeklyPreferences: interpretWeeklyPreferences(weeklyPreferences),
        events: interpretEvents(events),
    };
}

function generateSymbolId(): ParticipantId {
    return Symbol();
}

function interpretParticipants(participants: ParticipantDataLike[]): ParticipantData[] {
    return map(participants, interpretParticipant);
}

function interpretResolution(resolution: DurationLike): Duration {
    return isNil(resolution)
        ? Duration.fromObject({ minutes: 15 })
        : interpretDurationLike(resolution);
}

export function interpretInput({
    participants,
    schedulingParameters,
    resolution,
}: SchedulingEventsInputLike): SchedulingEventsInput {
    return {
        participants: interpretParticipants(participants),
        schedulingParameters: interpretSchedulingParameters(schedulingParameters),
        resolution: interpretResolution(resolution),
    };
}