import { cloneDeep, isEmpty, forEach, isArray } from './_lodashImports';
import Heap from 'heap';
import { interpretInput } from './interpretInput';
import { validateSchedulingInput } from './validate';
import { DateTime, Duration, Interval } from 'luxon';
import {
    AlreadyUsedIndexesMapSet,
    EventToScheduleProcessed,
    EventToScheduleProcessing,
    ParticipantData,
    ParticipantId,
    ScheduledEvents,
    SchedulingEventsInputLike,
    SchedulingEventsState,
    SchedulingEventsStateComputedSchedulingInterval,
    SchedulingEventsStateEventsToSchedule,
    SchedulingEventsStateFinal,
    SchedulingEventsStateParticipants,
    SchedulingEventsStateStart,
    WeeklyPreference,
    WeightedInterval,
    WeightedIntervalSet,
    WeightedIntervalSlice,
} from '../types';

export function scheduleEvents(schedulingInputLike: SchedulingEventsInputLike): ScheduledEvents {
    /*
        At this point: the input entered can be in various forms.
     */
    const schedulingInput = interpretInput(schedulingInputLike);
    /*
        At this point: the input is standardized into objects that the rest of the function can rely on.
     */
    validateSchedulingInput(schedulingInput);
    /*
        At this point: the standardized input is valid. If it was not, the validate function would have thrown an error.
        Key takeaways:
            schedulingInput.resolution is a valid duration object.
            schedulingInput.schedulingParameters.schedulingPeriod is a valid interval object.
            schedulingInput.schedulingParameters.eventsToSchedule is an array. (It may be empty.)
                If an eventToSchedule has participantIds, then the ids are guaranteed to be covered
                by the participants array ids.
            schedulingInput.schedulingParameters.numberOfEvents is an integer. If eventsToSchedule is non-zero,
                then the length of eventsToSchedule equals this number.
            schedulingInput.schedulingParameters.lengthOfEvents is a duration or an array of durations.
                If it is an array of durations, then the length of the durations matches the number of events.
            schedulingInput.participants is an array of zero or more participants.
                If a participant has weekly preferences, then these preferences have no overlap,
                and no weekly preference is longer than one week.
                It is a requirement that the entire set of weekly preferences exists in a single calendar week,
                and this is enforced, even though the actual week itself doesn't matter, just the times relative
                to the week.
                If a participant has scheduled events, then the events will be valid luxon intervals.
                If a participant did not have a weight assigned, then the weight of the participant is 1.
                Weights are nonnegative.
     */
    const state: SchedulingEventsState = { schedulingInput };
    computeSchedulingInterval(state);
    /*
        At this point, state = {
            schedulingInput: SchedulingInput,
            schedulingInterval: WeightedIntervalSet.
        }
     */
    gatherParticipantData(state as SchedulingEventsStateComputedSchedulingInterval);
    /*
        At this point, state = {
            schedulingInput: SchedulingInput,
            schedulingInterval: WeightedIntervalSet,
            participantsById: Array<string>,
            participants: Array<ParticipantData>
        }
     */
    createEventsToScheduleHeap(state as SchedulingEventsStateParticipants);
    /*
        At this point, state = {
            schedulingInput: SchedulingInput,
            schedulingInterval: WeightedIntervalSet,
            participantsById: Array<string>,
            participants: Array<ParticipantData>,
            eventsToScheduleHeap: Heap<EventToScheduleProcessing>
        }
        The heap here is a maximum value heap, and will arrange the events according to the the number of subintervals
        of size schedulingInput.resolution. Larger events will be scheduled first.
     */
    doScheduling(state as SchedulingEventsStateEventsToSchedule);
    /*
        At this point, state = {
            schedulingInput: SchedulingInput,
            schedulingInterval: WeightedIntervalSet,
            participantsById: Array<string>,
            participants: Array<ParticipantData>,
            eventsToScheduleHeap: Heap<EventToScheduleProcessing> (empty),
            scheduledEvents: Array<EventToScheduleProcessed>
        }
     */
    return formatOutput((state as SchedulingEventsStateFinal).scheduledEvents);
}

function formatOutput(scheduledEvents: EventToScheduleProcessed[]): ScheduledEvents {
    return scheduledEvents.map(scheduledEvent => {
        const participantIds = scheduledEvent.participants.map(p => p.id);
        return {
            participantIds,
            eventInterval: {
                start: scheduledEvent.eventInterval.start.toISO(),
                end: scheduledEvent.eventInterval.end.toISO(),
            },
        };
    });
}

function computeSchedulingInterval(state: SchedulingEventsStateStart) {
    const nextState = (state as SchedulingEventsStateComputedSchedulingInterval);
    nextState.schedulingInterval = createWeightedIntervalSet(
        state.schedulingInput.schedulingParameters.schedulingPeriod,
        state.schedulingInput.resolution,
    );
    applyWeeklyPreferences(
        nextState.schedulingInterval,
        state.schedulingInput.schedulingParameters.ambientWeeklyPreferences
    )
}

function gatherParticipantData(state: SchedulingEventsStateComputedSchedulingInterval) {
    let nextState = state as SchedulingEventsStateParticipants;
    nextState.participantsById = new Map();
    nextState.participants = [];
    forEach(state.schedulingInput.participants, participantInput => {
        const { id, weeklyPreferences, events, weight } = participantInput;
        // compute internal identifier for lookup purposes
        const participantWeightedInterval = createParticipantWeightedInterval(
            state.schedulingInterval,
            weeklyPreferences,
            events,
        );
        const participant = {
            id,
            weight,
            participantWeightedInterval,
            weeklyPreferences,
            events,
        };
        nextState.participantsById.set(id, participant);
        nextState.participants.push(participant);
    });
}

function createEventsToScheduleHeap(state: SchedulingEventsStateParticipants) {
    const nextState = state as SchedulingEventsStateEventsToSchedule;
    nextState.eventsToScheduleHeap = new Heap(function (eventA: EventToScheduleProcessing, eventB: EventToScheduleProcessing) {
        if (eventB.numberOfSubintervals > eventA.numberOfSubintervals) {
            return 1;
        }
        if (eventB.numberOfSubintervals < eventA.numberOfSubintervals) {
            return -1;
        }
        // breaking a tie based on index allowed the algorithm to pack more events into smaller scheduling interval.
        // see manyParticipantsSmallEvents.test.ts. Without this, the test fails because it cannot pack
        // each event into scheduled timeframe, even though a solution does exist.
        return eventA.index - eventB.index;
    });
    const {
        eventsToSchedule,
        numberOfEvents,
        lengthOfEvents,
    } = state.schedulingInput.schedulingParameters;
    for (let index = 0; index < numberOfEvents; index += 1) {
        let participantIds: ParticipantId[] | undefined = [];
        let eventDuration = null;
        if (eventsToSchedule.length > 0) {
            participantIds = eventsToSchedule[index].participantIds;
            eventDuration = eventsToSchedule[index].eventDuration;
        }
        let participants: ParticipantData[];
        if (isEmpty(participantIds)) {
            participants = state.participants;
        } else {
            participants = (participantIds as ParticipantId[]).reduce((particips: ParticipantData[], id: ParticipantId) => {
                const particip = state.participantsById.get(id);
                if (particip) {
                    particips.push(particip);
                }
                return particips;
            }, [] as ParticipantData[]);
        }
        eventDuration = eventDuration || (isArray(lengthOfEvents) ? lengthOfEvents[index] : lengthOfEvents);
        let numberOfSubintervals = Math.ceil(eventDuration.as('milliseconds') / state.schedulingInput.resolution.as('milliseconds'));
        nextState.eventsToScheduleHeap.push({
            participants,
            eventDuration,
            numberOfSubintervals,
            index,
        });
    }
}

function doScheduling(state: SchedulingEventsStateEventsToSchedule) {
    const nextState = state as SchedulingEventsStateFinal;
    let nextEventToSchedule = state.eventsToScheduleHeap.pop();
    nextState.scheduledEvents = [];
    const alreadyUsedIndexes: AlreadyUsedIndexesMapSet = new Map(); // Map<string|symbol, Set<number>>
    while (nextEventToSchedule) {
        scheduleEvent(nextState, nextEventToSchedule, alreadyUsedIndexes);
        nextEventToSchedule = nextState.eventsToScheduleHeap.pop();
    }
}

function updateAlreadyUsedIndexesForParticipants(eventIntervals: WeightedInterval[], event: EventToScheduleProcessing, alreadyUsedIndexes: AlreadyUsedIndexesMapSet) {
    for (const interval of eventIntervals) {
        for (const participant of event.participants) {
            if (!alreadyUsedIndexes.has(participant.id)) {
                alreadyUsedIndexes.set(participant.id, new Set());
            }
            (alreadyUsedIndexes.get(participant.id) as Set<number>).add(interval.index);
        }
    }
}

function scheduleEvent(state: SchedulingEventsStateFinal, event: EventToScheduleProcessing, alreadyUsedIndexes: AlreadyUsedIndexesMapSet) {
    const weightedIntervalSet = copyWeightedIntervalSet(state.schedulingInterval);
    const combinedIntervalSet = combineParticipantIntervalSets(weightedIntervalSet, event.participants);
    const eventIntervals = findBestEventInterval(event, combinedIntervalSet, alreadyUsedIndexes);
    const startingEventTime = eventIntervals[0].interval.start;
    updateAlreadyUsedIndexesForParticipants(eventIntervals, event, alreadyUsedIndexes);
    const processedEvent = event as EventToScheduleProcessed;
    processedEvent.eventInterval = Interval.after(startingEventTime, event.eventDuration);
    for (const participant of event.participants) {
        for (let i = 0; i < eventIntervals.length; i += 1) {
            setMaxWeight((participant.participantWeightedInterval as WeightedIntervalSet)[eventIntervals[i].index], 0);
        }
    }
    state.scheduledEvents.push(processedEvent);
}

/**
 * Combines the interval sets of multiple participants
 */
function combineParticipantIntervalSets(destinationIntervalSet: WeightedIntervalSet, participants: ParticipantData[]) {
    for (let i = 0; i < destinationIntervalSet.length; i += 1) {
        const destinationInterval = destinationIntervalSet[i];
        for (const participant of participants) {
            if (participant.weight > 0) {
                addWeight(destinationInterval, (participant.participantWeightedInterval as WeightedIntervalSet)[i].weight * participant.weight);
            }
        }
    }
    return destinationIntervalSet;
}

/**
 * Returns the contiguous block with the highest effective weight that the event can be placed
 * into. If there is a tie, then the block with the highest weight is chosen.
 * events produced by the algorithm. If there is still a tie, it is left to the implementation
 * detail of the heap. (The implementation detail here seems to choose the earliest event first.)
 */
function findBestEventInterval(event: EventToScheduleProcessing, weightedIntervalSet: WeightedIntervalSet, alreadyUsedIndexes: AlreadyUsedIndexesMapSet): WeightedInterval[] {
    function sliceHasUsedIndex(index: number) {
        const upperBound = index + event.numberOfSubintervals;
        for (let i = index; i < upperBound; i += 1) {
            for (let participant of event.participants) {
                const usedIndexesForParticipant = alreadyUsedIndexes.get(participant.id);
                if (usedIndexesForParticipant && usedIndexesForParticipant.has(i)) {
                    return true;
                }
            }
        }
        return false;
    }

    const sliceHeap = new Heap((sliceA: WeightedIntervalSlice, sliceB: WeightedIntervalSlice) => {
        if (sliceA.effectiveWeight > 0 && sliceB.effectiveWeight === 0) {
            return -1;
        }
        if (sliceA.effectiveWeight === 0 && sliceB.effectiveWeight > 0) {
            return 1;
        }
        if (sliceA.effectiveWeight > 0 && sliceB.effectiveWeight > 0) {
            return sliceB.effectiveWeight - sliceA.effectiveWeight;
        }
        return sliceB.weight - sliceA.weight;
    });

    for (let i = 0; i < weightedIntervalSet.length - event.numberOfSubintervals; i += 1) {
        if (sliceHasUsedIndex(i)) {
            continue;
        }
        const slice = {
            effectiveWeight: 0,
            weight: 0,
            index: i,
        };
        const upperBoundOfSlice = i + event.numberOfSubintervals;
        for (let j = i; j < upperBoundOfSlice; j += 1) {
            slice.effectiveWeight += weightedIntervalSet[j].effectiveWeight;
            slice.weight += weightedIntervalSet[j].weight;
        }
        sliceHeap.push(slice);
    }

    let largestSlice = sliceHeap.pop();
    return weightedIntervalSet.slice(largestSlice.index, largestSlice.index + event.numberOfSubintervals);
}

/**
 * Note: the intervals created here are contiguous and in order. This is important
 * for the process to work.
 */
function createWeightedIntervalSet(interval: Interval, resolution: Duration) {
    const splitByResolution = interval.splitBy(resolution);
    return splitByResolution.map((subInterval, index) => {
        return {
            weight: 1,
            effectiveWeight: 1,
            interval: subInterval,
            index,
        };
    });
}

function copyWeightedIntervalSet(weightedInterval: WeightedIntervalSet) {
    return cloneDeep(weightedInterval);
}

function applyWeeklyPreferences(weeklyPreferenceIntervalSet: WeightedIntervalSet, weeklyPreferences: WeeklyPreference[]) {
    for (const subinterval of weeklyPreferenceIntervalSet) {
        for (const weeklyPreference of weeklyPreferences) {
            if (isWeeklyOverlap(weeklyPreference.interval, subinterval.interval)) {
                setMaxWeight(subinterval, weeklyPreference.weight);
            }
        }
    }
}

/**
 * Creates a weighted interval set from a reference weighted interval set that
 * has the participant preferences set based on the weekly preferences and the events
 * of that user.
 */
function createParticipantWeightedInterval(weightedIntervalSet: WeightedIntervalSet, weeklyPreferences: WeeklyPreference[], events: Interval[]): WeightedIntervalSet {
    const weeklyPreferenceIntervalSet = copyWeightedIntervalSet(weightedIntervalSet);
    // apply weekly preferences to each subinterval if it applies
    applyWeeklyPreferences(weeklyPreferenceIntervalSet, weeklyPreferences);
    // set subintervals that contain events to have zero weight
    for (const event of events) {
        const affectedSubIntervals = getOverlappingIntervals(weightedIntervalSet, event);
        for (const subinterval of affectedSubIntervals) {
            setMaxWeight(subinterval, 0);
        }
    }
    return weeklyPreferenceIntervalSet;
}

function getOverlappingIntervals(weightedIntervalSet: WeightedIntervalSet, interval: Interval) {
    let startingIntervalIndex = binarySearchWeightedInterval(weightedIntervalSet, interval.start);
    let endingIntervalIndex = binarySearchWeightedInterval(weightedIntervalSet, interval.end);
    return weightedIntervalSet.slice(startingIntervalIndex, endingIntervalIndex);
}

function binarySearchWeightedInterval(weightedIntervalSet: WeightedIntervalSet, targetDateTime: DateTime) {
    let leftPivot = 0;
    let rightPivot = weightedIntervalSet.length - 1;

    while (leftPivot <= rightPivot) {
        let target = Math.floor((leftPivot + rightPivot) / 2);
        const targetInterval = weightedIntervalSet[target].interval;
        if (targetInterval.end <= targetDateTime) {
            leftPivot = target + 1;
            target = Math.floor((leftPivot + rightPivot) / 2);
            continue;
        }
        if (targetInterval.start > targetDateTime) {
            rightPivot = target - 1;
            target = Math.floor((leftPivot + rightPivot) / 2);
            continue;
        }
        return target;
    }
    return -1;
}

function isWeeklyOverlap(weeklyPreferenceInterval: Interval, subinterval: Interval) {
    const startOfWeeklyPreferenceWeek = weeklyPreferenceInterval.start.startOf('week');
    const startingOffset1 = (weeklyPreferenceInterval.start as any) - (startOfWeeklyPreferenceWeek as any);
    const endingOffset1 = (weeklyPreferenceInterval.end as any) - (startOfWeeklyPreferenceWeek as any);

    const startOfSubintervalWeek = subinterval.start.startOf('week');
    const startingOffset2 = (subinterval.start as any) - (startOfSubintervalWeek as any);
    const endingOffset2 = (subinterval.end as any) - (startOfSubintervalWeek as any);

    return startingOffset2 < endingOffset1 && startingOffset1 < endingOffset2;
}

function setMaxWeight(subinterval: WeightedInterval, newWeight: number) {
    subinterval.weight = (newWeight === 0 ? 0 : Math.max(newWeight, subinterval.weight));
    if (subinterval.weight === 0 || subinterval.effectiveWeight === 0) {
        subinterval.effectiveWeight = 0;
    } else {
        subinterval.effectiveWeight = Math.max(subinterval.weight, subinterval.effectiveWeight);
    }
}

function addWeight(subinterval: WeightedInterval, newWeight: number) {
    subinterval.weight += newWeight;
    if (newWeight === 0) {
        subinterval.effectiveWeight = 0;
    }
    if (subinterval.effectiveWeight > 0) {
        subinterval.effectiveWeight += newWeight;
    }
}