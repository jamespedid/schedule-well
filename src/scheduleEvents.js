import { cloneDeep, isEmpty, forEach, isArray } from './_lodashImports';
import Heap from 'heap';
import { interpretInput } from './interpretInput';
import { validateSchedulingInput } from './validate';
import { Interval } from 'luxon';

/**
 *  @param {ScheduleEventsInputLike} schedulingInputLike - scheduling input
 *  @returns {ScheduleEventsOutput}
 */
export function scheduleEvents(schedulingInputLike) {
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
    const state = { schedulingInput };
    computeSchedulingInterval(state);
    /*
        At this point, state = {
            schedulingInput: SchedulingInput,
            schedulingInterval: WeightedIntervalSet.
        }
     */
    gatherParticipantData(state);
    /*
        At this point, state = {
            schedulingInput: SchedulingInput,
            schedulingInterval: WeightedIntervalSet,
            participantsById: Array<string>,
            participants: Array<ParticipantData>
        }
     */
    createEventsToScheduleHeap(state);
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
    doScheduling(state);
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
    return formatOutput(state.scheduledEvents);
}

/**
 * @param {EventToScheduleProcessed[]} scheduledEvents
 * @returns {ScheduledEvent[]}
 */
function formatOutput(scheduledEvents) {
    return scheduledEvents.map(scheduledEvent => {
        const participantIds = scheduledEvent.participants.map(p => p.id);
        return {
            participantIds,
            eventInterval: {
                start: scheduledEvent.eventInterval.start.toISO(),
                end: scheduledEvent.eventInterval.end.toISO(),
            }
        }
    });
}

function computeSchedulingInterval(state) {
    state.schedulingInterval = createWeightedIntervalSet(
        state.schedulingInput.schedulingParameters.schedulingPeriod,
        state.schedulingInput.resolution,
    );
}

function gatherParticipantData(state) {
    state.participantsById = new Map();
    state.participants = [];
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
        };
        state.participantsById.set(id, participant);
        state.participants.push(participant);
    });
}

function createEventsToScheduleHeap(state) {
    state.eventsToScheduleHeap = new Heap(function (eventA, eventB) {
        return eventB.numberOfSubintervals - eventA.numberOfSubintervals;
    });
    const {
        eventsToSchedule,
        numberOfEvents,
        lengthOfEvents,
    } = state.schedulingInput.schedulingParameters;
    for (let index = 0; index < numberOfEvents; index += 1) {
        let participantIds = [];
        let eventDuration = null;
        if (eventsToSchedule.length > 0) {
            participantIds = eventsToSchedule[index].participantIds;
            eventDuration = eventsToSchedule[index].eventDuration;
        }
        let participants;
        if (isEmpty(participantIds)) {
            participants = state.participants;
        } else {
            participants = participantIds.reduce((particips, id) => {
                const particip = state.participantsById.get(id);
                if (particip) {
                    particips.push(particip);
                }
                return particips;
            }, []);
        }
        eventDuration = eventDuration || (isArray(lengthOfEvents) ? lengthOfEvents[index] : lengthOfEvents);
        let numberOfSubintervals = Math.ceil(eventDuration.as('milliseconds') / state.schedulingInput.resolution.as('milliseconds'));
        state.eventsToScheduleHeap.push({
            participants,
            eventDuration,
            numberOfSubintervals,
        });
    }
}

function doScheduling(state) {
    let nextEventToSchedule = state.eventsToScheduleHeap.pop();
    state.scheduledEvents = [];
    const alreadyUsedIndexes = new Map(); // Map<string|symbol, Set<number>>
    while (nextEventToSchedule) {
        scheduleEvent(state, nextEventToSchedule, alreadyUsedIndexes);
        nextEventToSchedule = state.eventsToScheduleHeap.pop();
    }
}

function updateAlreadyUsedIndexesForParticipants(eventIntervals, event, alreadyUsedIndexes) {
    for (const interval of eventIntervals) {
        for (const participant of event.participants) {
            if (!alreadyUsedIndexes.has(participant.id)) {
                alreadyUsedIndexes.set(participant.id, new Set());
            }
            alreadyUsedIndexes.get(participant.id).add(interval.index);
        }
    }
}

function scheduleEvent(state, event, alreadyUsedIndexes) {
    const weightedIntervalSet = copyWeightedIntervalSet(state.schedulingInterval);
    const combinedIntervalSet = combineParticipantIntervalSets(weightedIntervalSet, event.participants);
    const eventIntervals = findBestEventInterval(event, combinedIntervalSet, alreadyUsedIndexes);
    const startingEventTime = eventIntervals[0].interval.start;
    updateAlreadyUsedIndexesForParticipants(eventIntervals, event, alreadyUsedIndexes);
    event.eventInterval = Interval.after(startingEventTime, event.eventDuration);
    for (const participant of event.participants) {
        for (let i = 0; i < eventIntervals.length; i += 1) {
            setMaxWeight(participant.participantWeightedInterval[eventIntervals[i].index], 0);
        }
    }
    state.scheduledEvents.push(event);
}

/**
 * Combines the interval sets of multiple participants
 * @param destinationIntervalSet
 * @param participants
 * @returns {*}
 */
function combineParticipantIntervalSets(destinationIntervalSet, participants) {
    for (let i = 0; i < destinationIntervalSet.length; i += 1) {
        const destinationInterval = destinationIntervalSet[i];
        for (const participant of participants) {
            if (participant.weight > 0) {
                addWeight(destinationInterval, participant.participantWeightedInterval[i].weight * participant.weight);
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
 * @param {EventToScheduleProcessing} event
 * @param {WeightedIntervalSet} weightedIntervalSet
 * @param {Set<number>} alreadyUsedIndexes
 * @returns {*}
 */
function findBestEventInterval(event, weightedIntervalSet, alreadyUsedIndexes) {
    function sliceHasUsedIndex(index) {
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

    const sliceHeap = new Heap((sliceA, sliceB) => {
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
 * @param {Interval} interval
 * @param {Duration} resolution
 * @returns {WeightedIntervalSet}
 */
function createWeightedIntervalSet(interval, resolution) {
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

/**
 * @param {WeightedIntervalSet} weightedInterval
 * @returns {WeightedIntervalSet}
 */
function copyWeightedIntervalSet(weightedInterval) {
    return cloneDeep(weightedInterval);
}

/**
 * Creates a weighted interval set from a reference weighted interval set that
 * has the participant preferences set based on the weekly preferences and the events
 * of that user.
 * @param {WeightedIntervalSet} weightedIntervalSet
 * @param {WeeklyPreference[]} weeklyPreferences
 * @param {Interval[]} events
 * @returns {Array<{effectiveWeight: number, interval: Interval, weight: number}>}
 */
function createParticipantWeightedInterval(weightedIntervalSet, weeklyPreferences, events) {
    const weeklyPreferenceIntervalSet = copyWeightedIntervalSet(weightedIntervalSet);
    // apply weekly preferences to each subinterval if it applies
    for (const subinterval of weeklyPreferenceIntervalSet) {
        for (const weeklyPreference of weeklyPreferences) {
            if (isWeeklyOverlap(weeklyPreference.interval, subinterval.interval)) {
                setMaxWeight(subinterval, weeklyPreference.weight);
            }
        }
    }
    // set subintervals that contain events to have zero weight
    for (const event of events) {
        const affectedSubIntervals = getOverlappingIntervals(weightedIntervalSet, event);
        for (const subinterval of affectedSubIntervals) {
            setMaxWeight(subinterval, 0);
        }
    }
    return weeklyPreferenceIntervalSet;
}

function getOverlappingIntervals(weightedIntervalSet, interval) {
    let startingIntervalIndex = binarySearchWeightedInterval(weightedIntervalSet, interval.start);
    let endingIntervalIndex = binarySearchWeightedInterval(weightedIntervalSet, interval.end);
    return weightedIntervalSet.slice(startingIntervalIndex, endingIntervalIndex);
}

/**
 * Returns weight interval set index that contains the target date time.
 * @param {WeightedIntervalSet} weightedIntervalSet
 * @param {DateTime} targetDateTime
 */
function binarySearchWeightedInterval(weightedIntervalSet, targetDateTime) {
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

/**
 * @param {Interval} weeklyPreferenceInterval
 * @param {Interval} subinterval
 */
function isWeeklyOverlap(weeklyPreferenceInterval, subinterval) {
    const startOfWeeklyPreferenceWeek = weeklyPreferenceInterval.start.startOf('week');
    const startingOffset1 = weeklyPreferenceInterval.start - startOfWeeklyPreferenceWeek;
    const endingOffset1 = weeklyPreferenceInterval.end - startOfWeeklyPreferenceWeek;

    const startOfSubintervalWeek = subinterval.start.startOf('week');
    const startingOffset2 = subinterval.start - startOfSubintervalWeek;
    const endingOffset2 = subinterval.end - startOfSubintervalWeek;

    return startingOffset2 < endingOffset1 && startingOffset1 < endingOffset2;
}

function setMaxWeight(subinterval, newWeight) {
    subinterval.weight = (newWeight === 0 ? 0 : Math.max(newWeight, subinterval.weight));
    if (subinterval.weight === 0 || subinterval.effectiveWeight === 0) {
        subinterval.effectiveWeight = 0;
    } else {
        subinterval.effectiveWeight = Math.max(subinterval.weight, subinterval.effectiveWeight);
    }
}

function addWeight(subinterval, newWeight) {
    if (newWeight === 0) {
        subinterval.weight = 0;
    }
    if (subinterval.weight === 0 || subinterval.effectiveWeight === 0) {
        subinterval.effectiveWeight = 0;
    } else {
        subinterval.weight += newWeight;
        subinterval.effectiveWeight += subinterval.weight;
    }
}