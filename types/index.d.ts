import { DateTime, Interval, Duration, DurationObject, Zone } from 'luxon';
import Heap from 'heap';

// public types
export type ZoneLike = string | Zone;
export type DateTimeObject = {
    year?: number;
    month?: number;
    day?: number;
    ordinal?: number;
    weekYear?: number;
    weekMonth?: number;
    weekDay?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
    zone?: ZoneLike;
}
export type DateTimeLike = DateTimeObject | DateTime | Date | string | number;
export type IntervalObject = {
    start: DateTimeLike;
    end: DateTimeLike
}
export type IntervalArray = [DateTimeLike, DateTimeLike];
export type IntervalLike = IntervalObject | IntervalArray | Interval | string;
export type DurationLike = DurationObject | Duration | string | number;
export type WeeklyPreference = {
    weight: number;
    interval: Interval;
}
export type WeeklyPreferenceLike = {
    weight?: number;
    interval: IntervalLike;
}
export type ParticipantId = symbol | string;
export type ParticipantDataLike = {
    id?: ParticipantId;
    weeklyPreferences?: WeeklyPreferenceLike[];
    events?: IntervalLike[];
    weight?: number;
}
export type EventToScheduleLike = {
    participantIds?: ParticipantId[];
    eventDuration: DurationLike;
}
export type SchedulingParametersLikeEventsToSchedule = {
    schedulingPeriod: IntervalLike;
    eventsToSchedule: EventToScheduleLike[];
    numberOfEvents?: number;
    lengthOfEvents: DurationLike | DurationLike[];
}
export type SchedulingParametersLikeNumberOfEvents = {
    schedulingPeriod: IntervalLike;
    eventsToSchedule?: EventToScheduleLike[];
    numberOfEvents: number;
    lengthOfEvents: DurationLike | DurationLike[];
}
export type SchedulingParametersLike = SchedulingParametersLikeEventsToSchedule
    | SchedulingParametersLikeNumberOfEvents;
export type SchedulingEventsInputLike = {
    participants: ParticipantDataLike[];
    schedulingParameters: SchedulingParametersLike;
    resolution: DurationLike;
}
export type ScheduledEvent = {
    participantIds: ParticipantId[];
    eventInterval: IntervalObject;
}
export type ScheduledEvents = ScheduledEvent[];

// package type
export type  ParticipantData = {
    id: ParticipantId;
    weeklyPreferences: WeeklyPreference[];
    events: Interval[];
    weight: number;
    participantWeightedInterval?: WeightedIntervalSet;
}

export type  EventToSchedule = {
    participantIds?: ParticipantId[];
    eventDuration: Duration;
}

export type  EventToScheduleProcessing = {
    participants: ParticipantData[];
    eventDuration: Duration;
    numberOfSubintervals: number;
}
export type  EventToScheduleProcessed = {
    participants: ParticipantData[];
    eventDuration: Duration;
    numberOfSubintervals: number;
    eventInterval: Interval;
}
export type  SchedulingParameters = {
    schedulingPeriod: Interval;
    eventsToSchedule: EventToSchedule[];
    numberOfEvents: number;
    lengthOfEvents: Duration | Duration[];
}

export type  SchedulingEventsInput = {
    participants: ParticipantData[];
    schedulingParameters: SchedulingParameters;
    resolution: Duration;
};

export type  WeightedInterval = {
    weight: number;
    effectiveWeight: number;
    interval: Interval;
    index: number;
}
export type WeightedIntervalSlice = {
    weight: number;
    effectiveWeight: number;
    index: number;
}
export type  WeightedIntervalSet = WeightedInterval[];
export type  SchedulingEventsStateStart = {
    schedulingInput: SchedulingEventsInput;
}
export type  SchedulingEventsStateComputedSchedulingInterval = {
    schedulingInput: SchedulingEventsInput;
    schedulingInterval: WeightedIntervalSet;
}
export type  SchedulingEventsStateParticipants = {
    schedulingInput: SchedulingEventsInput;
    schedulingInterval: WeightedIntervalSet;
    participantsById: Map<ParticipantId, ParticipantData>;
    participants: ParticipantData[];
}
export type  SchedulingEventsStateEventsToSchedule = {
    schedulingInput: SchedulingEventsInput;
    schedulingInterval: WeightedIntervalSet;
    participantsById: Map<ParticipantId, ParticipantData>;
    participants: ParticipantData[];
    eventsToScheduleHeap: Heap<EventToScheduleProcessing>;
}
export type  SchedulingEventsStateFinal = {
    schedulingInput: SchedulingEventsInput;
    schedulingInterval: WeightedIntervalSet;
    participantsById: Map<ParticipantId, ParticipantData>;
    participants: ParticipantData[];
    eventsToScheduleHeap: Heap<EventToScheduleProcessing>;
    scheduledEvents: Array<EventToScheduleProcessed>;
}
export type SchedulingEventsState = SchedulingEventsStateStart
    | SchedulingEventsStateComputedSchedulingInterval
    | SchedulingEventsStateParticipants
    | SchedulingEventsStateEventsToSchedule
    | SchedulingEventsStateFinal;
export type AlreadyUsedIndexesMapSet = Map<ParticipantId, Set<number>>
interface ErrorConstructor {
    captureStackTrace(thisArg: any, func: any): void
}