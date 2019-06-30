"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scheduleEvents = scheduleEvents;

var _lodashImports = require("./_lodashImports");

var _heap = _interopRequireDefault(require("heap"));

var _interpretInput = require("./interpretInput");

var _validate = require("./validate");

var _luxon = require("luxon");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *  @param {ScheduleEventsInputLike} schedulingInputLike - scheduling input
 */
function scheduleEvents(schedulingInputLike) {
  var schedulingInput = (0, _interpretInput.interpretInput)(schedulingInputLike);
  (0, _validate.validateSchedulingInput)(schedulingInput);
  var state = {
    schedulingInput: schedulingInput
  };
  computeSchedulingInterval(state);
  gatherParticipantData(state);
  createEventsToScheduleHeap(state);
  doScheduling(state);
  return state.scheduledEvents;
}

function computeSchedulingInterval(state) {
  state.schedulingInterval = createWeightedIntervalSet(state.schedulingInput.schedulingParameters.schedulingPeriod, state.schedulingInput.resolution);
}

function gatherParticipantData(state) {
  state.participantsById = new Map();
  state.participants = [];
  forEach(state.schedulingInput.participants, function (participantInput) {
    var id = participantInput.id,
        weeklyPreferences = participantInput.weeklyPreferences,
        events = participantInput.events,
        weight = participantInput.weight; // compute internal identifier for lookup purposes

    var participantWeightedInterval = createParticipantWeightedInterval(state.schedulingInterval, weeklyPreferences, events);
    var participant = {
      iid: iid,
      id: id,
      weight: weight,
      participantWeightedInterval: participantWeightedInterval
    };
    state.participantsById.set(id, participant);
    state.participants.push(participant);
  });
}

function createEventsToScheduleHeap(state) {
  state.eventsToScheduleHeap = new _heap.default(function (eventA, eventB) {
    return eventB.numberOfSubintervals - eventA.numberOfSubintervals;
  });
  var _state$schedulingInpu = state.schedulingInput.schedulingParameters,
      eventsToSchedule = _state$schedulingInpu.eventsToSchedule,
      numberOfEvents = _state$schedulingInpu.numberOfEvents,
      lengthOfEvents = _state$schedulingInpu.lengthOfEvents;

  for (var index = 0; index < numberOfEvents; index += 1) {
    var participantIds = [];
    var eventDuration = null;

    if (isArray(eventsToSchedule)) {
      participantIds = eventsToSchedule[index].participantIds;
      eventDuration = eventsToSchedule[index].eventDuration;
    } else {}

    var participants = void 0;

    if ((0, _lodashImports.isEmpty)(participantIds)) {
      participants = state.participants;
    } else {
      participants = participantIds.reduce(function (particips, id) {
        var particip = state.participantsById.get(id);

        if (particip) {
          particips.push(particip);
        }

        return particips;
      }, []);
    }

    eventDuration = eventDuration || (isArray(lengthOfEvents) ? lengthOfEvents[index] : lengthOfEvents);
    var numberOfSubintervals = Math.ceil(eventDuration.length / state.schedulingInput.resolution.length);
    state.eventsToScheduleHeap.push({
      participants: participants,
      eventDuration: eventDuration,
      numberOfSubintervals: numberOfSubintervals
    });
  }
}

function doScheduling(state) {
  var nextEventToSchedule = state.eventsToScheduleHeap.pop();
  state.scheduledEvents = [];

  while (nextEventToSchedule) {
    scheduleEvent(state, nextEventToSchedule);
  }
}

function scheduleEvent(state, event) {
  var weightedIntervalSet = copyWeightedIntervalSet(state.schedulingInterval);
  var intervalSetsToCombine = event.participants.map(function (participant) {
    return participant.participantWeightedInterval;
  });
  var combinedIntervalSet = combineIntervalSets(weightedIntervalSet, intervalSetsToCombine);
  var eventIntervals = findBestEventInterval(event, combinedIntervalSet);
  var startingEventTime = eventIntervals[0].interval.start;
  event.eventInterval = _luxon.Interval.after(startingEventTime, event.eventDuration);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = event.participants[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var participant = _step.value;

      for (var i = 0; i < eventIntervals; i += 1) {
        setMaxWeight(participant.participantWeightedInterval[eventIntervals[i].index], 0);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  state.scheduledEvents.push(event.eventInterval);
}

function combineIntervalSets(destinationIntervalSet, sourceIntervalSets) {
  for (var i = 0; i < destinationIntervalSet.length; i += 1) {
    var destinationInterval = destinationIntervalSet[i];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = sourceIntervalSets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var sourceIntervalSet = _step2.value;
        addWeight(destinationInterval, sourceIntervalSet[i].weight);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
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
  var largestSubintervalStartingIndex = -1;
  var largestConsecutiveNonzeroIntervals = 0;
  var startingIndex = -1;
  var consecutiveNonzeroIntervals = 0; // equality on index to perform the consecutive processing logic after the last check

  for (var i = 0; i <= weightedIntervalSet.length; i += 1) {
    if (i !== weightedIntervalSet.length && !weightedIntervalSet[i].effectiveWeight > 0) {
      consecutiveNonzeroIntervals += 1;

      if (startingIndex === -1) {
        startingIndex = i;
      }
    } else {
      if (consecutiveNonzeroIntervals >= event.numberOfSubintervals) {
        if (consecutiveNonzeroIntervals > largestConsecutiveNonzeroIntervals) {
          largestSubintervalStartingIndex = startingIndex;
        }

        startingIndex = -1;
      }

      largestConsecutiveNonzeroIntervals = consecutiveNonzeroIntervals;
      consecutiveNonzeroIntervals = 0;
    }
  }

  if (largestSubintervalStartingIndex === -1) {
    // find one based on weights instead of effective weights.
    for (var _i = 0; _i <= weightedIntervalSet.length; _i += 1) {
      if (_i !== weightedIntervalSet.length && !weightedIntervalSet[_i].weight > 0) {
        consecutiveNonzeroIntervals += 1;

        if (startingIndex === -1) {
          startingIndex = _i;
        }
      } else {
        if (consecutiveNonzeroIntervals >= event.numberOfSubintervals) {
          if (consecutiveNonzeroIntervals > largestConsecutiveNonzeroIntervals) {
            largestSubintervalStartingIndex = startingIndex;
          }

          startingIndex = -1;
        }

        largestConsecutiveNonzeroIntervals = consecutiveNonzeroIntervals;
        consecutiveNonzeroIntervals = 0;
      }
    }
  }

  var end = largestSubintervalStartingIndex + largestConsecutiveNonzeroIntervals;
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
  var splitByResolution = interval.splitBy(resolution);
  return splitByResolution.map(function (subInterval, index) {
    return {
      weight: 1,
      effectiveWeight: 1,
      interval: subInterval,
      index: index
    };
  });
}
/**
 * @param {WeightedIntervalSet} weightedInterval
 * @returns {WeightedIntervalSet}
 */


function copyWeightedIntervalSet(weightedInterval) {
  return (0, _lodashImports.cloneDeep)(weightedInterval);
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
  var weeklyPreferenceIntervalSet = copyWeightedIntervalSet(weightedIntervalSet); // apply weekly preferences to each subinterval if it applies

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = weeklyPreferenceIntervalSet[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var subinterval = _step3.value;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = weeklyPreferences[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var weeklyPreference = _step5.value;

          if (isWeeklyOverlap(weeklyPreference.interval, subinterval.interval)) {
            setMaxWeight(subinterval, weeklyPreference.weight);
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    } // set subintervals that contain events to have zero weight

  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = events[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var event = _step4.value;
      var affectedSubIntervals = getOverlappingIntervals(weightedIntervalSet, event);
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = affectedSubIntervals[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var _subinterval = _step6.value;
          setMaxWeight(_subinterval, 0);
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return weeklyPreferenceIntervalSet;
}

function getOverlappingIntervals(weightedIntervalSet, interval) {
  // binary search starting interval
  var startingIntervalIndex = binarySearchWeightedInterval(weightedIntervalSet, interval.start);
  var endingIntervalIndex = binarySearchWeightedInterval(weightedIntervalSet, interval.end);
  return weightedIntervalSet.slice(startingIntervalIndex, endingIntervalIndex);
}
/**
 * Returns weight interval set index that contains the target date time.
 * @param weightedIntervalSet
 * @param targetDateTime
 */


function binarySearchWeightedInterval(weightedIntervalSet, targetDateTime) {
  var leftPivot = 0;
  var rightPivot = weightedIntervalSet.length;
  var target = Math.floor((leftPivot + rightPivot) / 2);

  while (leftPivot < rightPivot) {
    var targetInterval = weightedIntervalSet[target];

    if (targetInterval.contains(targetDateTime)) {
      return target;
    }

    if (targetInterval.interval.end < targetDateTime) {
      rightPivot = target - 1;
      target = Math.floor((leftPivot + rightPivot) / 2);
      continue;
    }

    leftPivot = target + 1;
    target = Math.floor((leftPivot + rightPivot) / 2);
  }

  return -1;
}
/**
 * @param {Interval} weeklyPreferenceInterval
 * @param {Interval} subinterval
 */


function isWeeklyOverlap(weeklyPreferenceInterval, subinterval) {
  var startOfWeeklyPreferenceWeek = weeklyPreferenceInterval.start.startOf('week');
  var startingOffset1 = weeklyPreferenceInterval.start - startOfWeeklyPreferenceWeek;
  var endingOffset1 = weeklyPreferenceInterval.end - startOfWeeklyPreferenceWeek;
  var startOfSubintervalWeek = subinterval.start.startOf('week');
  var startingOffset2 = subinterval.start - startOfSubintervalWeek;
  var endingOffset2 = subinterval.end - startOfSubintervalWeek;
  return startingOffset2 < endingOffset1 && startingOffset1 < endingOffset2;
}

function setMaxWeight(subinterval, newWeight) {
  subinterval.weight = Math.max(newWeight, subinterval.weight);

  if (subinterval.weight === 0 || subinterval.effectiveWeight === 0) {
    subinterval.effectiveWeight = 0;
  } else {
    subinterval.effectiveWeight = Math.max(subinterval.weight, subinterval.effectiveWeight);
  }
}

function addWeight(subinterval, newWeight) {
  subinterval.weight += newWeight;

  if (subinterval.weight === 0 || subinterval.effectiveWeight === 0) {
    subinterval.effectiveWeight = 0;
  } else {
    subinterval.effectiveWeight += subinterval.weight;
  }
}