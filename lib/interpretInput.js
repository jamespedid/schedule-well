"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.interpretInput = interpretInput;

var _lodashImports = require("./_lodashImports");

var _luxon = require("luxon");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * @param {DurationLike} durationLike
 * @returns {Duration}
 */
function interpretDurationLike(durationLike) {
  try {
    if (_luxon.Duration.isDuration(durationLike)) {
      return durationLike;
    }

    if ((0, _lodashImports.isPlainObject)(durationLike)) {
      return _luxon.Duration.fromObject(durationLike);
    }

    if (_lodashImports.isFinite) {
      return _luxon.Duration.fromMillis(durationLike);
    }

    if (_lodashImports.isString) {
      return _luxon.Duration.fromISO(durationLike);
    }
  } catch (_unused) {}

  return _luxon.Duration.invalid('invalid durationlike input');
}
/**
 * @param {IntervalLike} intervalLike
 * @returns {Interval}
 */


function interpretIntervalLike(intervalLike) {
  try {
    if (_luxon.Interval.isInterval(intervalLike)) {
      return intervalLike;
    }

    if ((0, _lodashImports.isPlainObject)(intervalLike)) {
      var start = intervalLike.start,
          end = intervalLike.end;
      return _luxon.Interval.fromDateTimes(interpretDateTimeLike(start), interpretDateTimeLike(end));
    }

    if ((0, _lodashImports.isArray)(intervalLike)) {
      var _intervalLike = _slicedToArray(intervalLike, 2),
          _start = _intervalLike[0],
          _end = _intervalLike[1];

      return _luxon.Interval.fromDateTimes(interpretDateTimeLike(_start), interpretDateTimeLike(_end));
    }

    if ((0, _lodashImports.isString)(intervalLike)) {
      return _luxon.Interval.fromISO(string);
    }
  } catch (_unused2) {}

  return _luxon.Interval.invalid('invalid intervallike input');
}
/**
 * @param {DateTimeLike} dateTimeLike
 * @returns {DateTime}
 */


function interpretDateTimeLike(dateTimeLike) {
  try {
    if (_luxon.DateTime.isDateTime(dateTimeLike)) {
      return dateTimeLike;
    }

    if (dateTimeLike instanceof Date) {
      return _luxon.DateTime.fromJSDate(date);
    }

    if ((0, _lodashImports.isString)(dateTimeLike)) {
      return _luxon.DateTime.fromISO(dateTimeLike);
    }

    if ((0, _lodashImports.isFinite)(dateTimeLike)) {
      return _luxon.DateTime.fromMillis(dateTimeLike);
    }
  } catch (_unused3) {}

  return _luxon.DateTime.invalid('invalid datetimelike input');
}
/**
 * @param {number} number
 * @returns {number}
 */


function interpretNumber(number) {
  return (0, _lodashImports.isFinite)(number) ? number : null;
}
/**
 * @param {number} weight
 * @returns {number}
 */


function interpretWeight(weight) {
  if ((0, _lodashImports.isNil)(weight)) {
    return 1;
  }

  if (!(0, _lodashImports.isFinite)(weight)) {
    return 0;
  }

  return Math.max(weight, 0);
}
/**
 * @param EventToScheduleLike
 * @returns {EventToSchedule}
 */


function interpretEventToSchedule(_ref) {
  var participantIds = _ref.participantIds,
      eventDuration = _ref.eventDuration;
  return {
    participantIds: (0, _lodashImports.isArray)(participantIds) ? participantIds : [],
    eventDuration: interpretDurationLike(eventDuration)
  };
}
/**
 * @param {Array<EventToScheduleLike>} eventsToSchedule
 * @returns {Array<EventToSchedule>}
 */


function interpretEventsToSchedule(eventsToSchedule) {
  return (0, _lodashImports.map)(eventsToSchedule, interpretEventToSchedule);
}
/**
 * @param {Duration|Array<Duration>} lengthOfEvents
 * @returns {Duration|Array<Duration>}
 */


function interpretLengthOfEvents(lengthOfEvents) {
  return (0, _lodashImports.isArray)(lengthOfEvents) ? lengthOfEvents.map(interpretDurationLike) : interpretDurationLike(lengthOfEvents);
}
/**
 * @param {SchedulingParametersLike} parameters
 * @returns {SchedulingParameters}
 */


function interpretSchedulingParameters(_ref2) {
  var schedulingPeriod = _ref2.schedulingPeriod,
      eventsToSchedule = _ref2.eventsToSchedule,
      numberOfEvents = _ref2.numberOfEvents,
      lengthOfEvents = _ref2.lengthOfEvents,
      maxEventsPerDay = _ref2.maxEventsPerDay;
  return {
    schedulingPeriod: interpretIntervalLike(schedulingPeriod),
    eventsToSchedule: interpretEventsToSchedule(eventsToSchedule),
    numberOfEvents: interpretNumber(numberOfEvents),
    lengthOfEvents: interpretLengthOfEvents(lengthOfEvents),
    maxEventsPerDay: interpretNumber(maxEventsPerDay)
  };
}
/**
 * @param {WeeklyPreferenceLike} weeklyPreference
 * @returns {WeeklyPreference}
 */


function interpretWeeklyPreference(_ref3) {
  var weight = _ref3.weight,
      interval = _ref3.interval;
  return {
    weight: interpretWeight(weight),
    interval: interpretIntervalLike(interval)
  };
}
/**
 * @param {Array<WeeklyPreferenceLike>} weeklyPreferences
 * @returns {Array<WeeklyPreference>}
 */


function interpretWeeklyPreferences(weeklyPreferences) {
  return (0, _lodashImports.map)(weeklyPreferences, interpretWeeklyPreference);
}
/**
 * @param {Array<IntervalLike>} events
 * @returns {Array<Interval>}
 */


function interpretEvents(events) {
  return (0, _lodashImports.map)(events, interpretIntervalLike);
}
/**
 * @param {ParticipantDataLike} participantData
 * @returns {ParticipantData}
 */


function interpretParticipant(_ref4) {
  var id = _ref4.id,
      weeklyPreferences = _ref4.weeklyPreferences,
      events = _ref4.events,
      weight = _ref4.weight;
  return {
    id: (0, _lodashImports.isString)(id) ? id : null,
    weight: interpretWeight(weight),
    weeklyPreferences: interpretWeeklyPreferences(weeklyPreferences),
    events: interpretEvents(events)
  };
}
/**
 * @param {Array<ParticipantDataLike>} participants
 * @returns {Array<ParticipantData>}
 */


function interpretParticipants(participants) {
  return (0, _lodashImports.map)(participants, interpretParticipant);
}

function interpretResolution(resolution) {
  return (0, _lodashImports.isNil)(resolution) ? _luxon.Duration.fromObject({
    minutes: 15
  }) : interpretDurationLike(resolution);
}
/**
 * @param {ScheduleEventsInputLike} input
 * @return {ScheduleEventsInput} sanitized input
 */


function interpretInput() {
  var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      participants = _ref5.participants,
      schedulingParameters = _ref5.schedulingParameters,
      resolution = _ref5.resolution;

  return {
    participants: interpretParticipants(participants),
    schedulingParameters: interpretSchedulingParameters(schedulingParameters),
    resolution: interpretResolution(resolution)
  };
}