import { cloneDeep, isEmpty, forEach, isArray } from './_lodashImports';
import Heap from 'heap';
import { interpretInput } from './interpretInput';
import { validateSchedulingInput } from './validate';
import { Interval } from 'luxon';

/**
 *  @param {ScheduleEventsInputLike} schedulingInputLike - scheduling input
 */
export function scheduleEvents(schedulingInputLike) {
    const schedulingInput = interpretInput(schedulingInputLike);
    validateSchedulingInput(schedulingInput);
    const state = { schedulingInput };
    computeSchedulingInterval(state);
    gatherParticipantData(state);
    createEventsToScheduleHeap(state);
    doScheduling(state);
    return state.scheduledEvents;
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
    while (nextEventToSchedule) {
        scheduleEvent(state, nextEventToSchedule);
        nextEventToSchedule = state.eventsToScheduleHeap.pop();
    }
}

function scheduleEvent(state, event) {
    const weightedIntervalSet = copyWeightedIntervalSet(state.schedulingInterval);
    const combinedIntervalSet = combineParticipantIntervalSets(weightedIntervalSet, event.participants);
    const eventIntervals = findBestEventInterval(event, combinedIntervalSet);
    const startingEventTime = eventIntervals[0].interval.start;
    event.eventInterval = Interval.after(startingEventTime, event.eventDuration);
    for (const participant of event.participants) {
        for (let i = 0; i < eventIntervals.length; i += 1) {
            setMaxWeight(participant.participantWeightedInterval[eventIntervals[i].index], 0);
        }
    }
    state.scheduledEvents.push(event.eventInterval);
}

function combineParticipantIntervalSets(destinationIntervalSet, participants, weightMultiplier = 1) {
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
 * Returns the end of the largest contiguous space that the event falls in to,
 * first by considering effective weights, and then considering weights if effective
 * weights were not found.
 *
 * TODO: make sure that events found in the second manner do not overlap
 * events produced by the algorithm.
 * @param event
 * @param weightedIntervalSet
 * @returns {*}
 */
function findBestEventInterval(event, weightedIntervalSet) {
    let largestSubintervalStartingIndex = -1;
    let largestConsecutiveNonzeroIntervals = 0;
    let startingIndex = -1;
    let consecutiveNonzeroIntervals = 0;
    // equality on index to perform the consecutive processing logic after the last check
    for (let i = 0; i <= weightedIntervalSet.length; i += 1) {
        if (i !== weightedIntervalSet.length && weightedIntervalSet[i].effectiveWeight > 0) {
            consecutiveNonzeroIntervals += 1;
            if (startingIndex === -1) {
                startingIndex = i;
            }
        } else {
            if (consecutiveNonzeroIntervals >= event.numberOfSubintervals) {
                if (consecutiveNonzeroIntervals > largestConsecutiveNonzeroIntervals) {
                    largestSubintervalStartingIndex = startingIndex;
                    largestConsecutiveNonzeroIntervals = consecutiveNonzeroIntervals;
                }
                startingIndex = -1;
            }
            consecutiveNonzeroIntervals = 0;
        }
    }
    if (largestSubintervalStartingIndex === -1) {
        // find one based on weights instead of effective weights.
        for (let i = 0; i <= weightedIntervalSet.length; i += 1) {
            if (i !== weightedIntervalSet.length && weightedIntervalSet[i].weight > 0) {
                consecutiveNonzeroIntervals += 1;
                if (startingIndex === -1) {
                    startingIndex = i;
                }
            } else {
                if (consecutiveNonzeroIntervals >= event.numberOfSubintervals) {
                    if (consecutiveNonzeroIntervals > largestConsecutiveNonzeroIntervals) {
                        largestSubintervalStartingIndex = startingIndex;
                        largestConsecutiveNonzeroIntervals = consecutiveNonzeroIntervals;
                    }
                    startingIndex = -1;
                }
                consecutiveNonzeroIntervals = 0;
            }
        }
    }
    const end = largestSubintervalStartingIndex + largestConsecutiveNonzeroIntervals;
    return weightedIntervalSet.slice(end - event.numberOfSubintervals, end);
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
 * @param weightedIntervalSet
 * @param weeklyPreferences
 * @param events
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
 * @param weightedIntervalSet
 * @param targetDateTime
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