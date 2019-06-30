"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSchedulingInput = validateSchedulingInput;

var _lodashImports = require("./_lodashImports");

var _multiError = require("./multiError");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The schedulingInput is assumed to be well-formed.
 * Validations here only will consider if the input data is consistent.
 * @param {ScheduleEventsInput} schedulingInput
 */
function validateSchedulingInput(schedulingInput) {
  var validator = new SchedulingInputValidator(schedulingInput);
  validator.assertAllValidations();
}

var SchedulingInputValidator =
/*#__PURE__*/
function () {
  function SchedulingInputValidator(_ref) {
    var schedulingParameters = _ref.schedulingParameters,
        participants = _ref.participants,
        resolution = _ref.resolution;

    _classCallCheck(this, SchedulingInputValidator);

    this.schedulingParameters = schedulingParameters;
    this.participants = participants;
    this.resolution = resolution;
    this.errors = [];
  }

  _createClass(SchedulingInputValidator, [{
    key: "assertAllValidations",
    value: function assertAllValidations() {
      this.validateAll();
      this.assert();
    }
  }, {
    key: "assert",
    value: function assert() {
      if (this.errors.length > 0) {
        throw new _multiError.MultiError(this.errors);
      }
    }
  }, {
    key: "validateAll",
    value: function validateAll() {
      this.validateResolution();
      this.validateSchedulingParameters();
      this.validateParticipants();
    }
  }, {
    key: "validateResolution",
    value: function validateResolution() {
      var resolution = this.resolution;

      if (!resolution.isValid) {
        this.errors.push(new Error('invalid resolution'));
      }
    }
  }, {
    key: "validateSchedulingParameters",
    value: function validateSchedulingParameters() {
      this.validateSchedulingPeriod();
      this.validateEventsToSchedule();
      this.validateNumberOfEvents();
      this.validateLengthOfEvents();
      this.validateMaxEventsPerDay();
    }
  }, {
    key: "validateSchedulingPeriod",
    value: function validateSchedulingPeriod() {
      if (!this.schedulingParameters.schedulingPeriod.isValid) {
        this.errors.push('invalid schedulingPeriod');
      }
    }
  }, {
    key: "validateEventsToSchedule",
    value: function validateEventsToSchedule() {
      var _this = this;

      (0, _lodashImports.forEach)(this.schedulingParameters.eventsToSchedule, function (eventToSchedule) {
        _this.validateEventToSchedule(eventToSchedule);
      });
    }
  }, {
    key: "validateEventToSchedule",
    value: function validateEventToSchedule(eventToSchedule) {
      var participantIds = eventToSchedule.participantIds,
          eventDuration = eventToSchedule.eventDuration;

      if (!this.areParticipantIdsCovered(participantIds)) {
        this.errors.push('invalid participantIds list (eventsToSchedule)');
      }

      if (!eventDuration.isValid) {
        this.errors.push('invalid eventDuration');
      }
    }
  }, {
    key: "validateNumberOfEvents",
    value: function validateNumberOfEvents() {
      var _this$schedulingParam = this.schedulingParameters,
          numberOfEvents = _this$schedulingParam.numberOfEvents,
          eventsToSchedule = _this$schedulingParam.eventsToSchedule;

      if (!isFinite(numberOfEvents) && eventsToSchedule) {
        numberOfEvents = eventsToSchedule.length;
        this.schedulingParameters.numberOfEvents = numberOfEvents;
      } else {
        numberOfEvents = 0;
      }

      if (eventsToSchedule && numberOfEvents > 0 && eventsToSchedule.length !== numberOfEvents) {
        this.errors.push('numberOfEvents must match eventsToSchedule length');
      }

      if (numberOfEvents < 1) {
        this.errors.push('numberOfEvents must be positive');
      }

      if (!(0, _lodashImports.isInteger)(numberOfEvents)) {
        this.errors.push('numberOfEvents must be an integer');
      }
    }
  }, {
    key: "validateLengthOfEvents",
    value: function validateLengthOfEvents() {
      var _this2 = this;

      var _this$schedulingParam2 = this.schedulingParameters,
          lengthOfEvents = _this$schedulingParam2.lengthOfEvents,
          eventsToSchedule = _this$schedulingParam2.eventsToSchedule;

      if (!isArray(lengthOfEvents)) {
        this.validateLengthOfEvent(lengthOfEvents);
        return;
      }

      (0, _lodashImports.forEach)(lengthOfEvents, function (lengthOfEvent) {
        return _this2.validateLengthOfEvent(lengthOfEvent);
      });

      if (eventsToSchedule) {
        if (lengthOfEvents.length !== eventsToSchedule.length) {
          this.errors.push('lengthOfEvents length is different than eventsToSchedule length');
        }
      }
    }
  }, {
    key: "validateLengthOfEvent",
    value: function validateLengthOfEvent(lengthOfEvent) {
      if (!lengthOfEvent.isValid) {
        this.errors.push('invalid lengthOfEvent');
      }
    }
  }, {
    key: "validateMaxEventsPerDay",
    value: function validateMaxEventsPerDay() {
      var maxEventsPerDay = this.schedulingParameters.maxEventsPerDay;

      if (maxEventsPerDay < 1) {
        this.errors.push('numberOfEvents must be positive');
      }

      if (!(0, _lodashImports.isInteger)(maxEventsPerDay)) {
        this.errors.push('numberOfEvents must be an integer');
      }
    }
  }, {
    key: "validateParticipants",
    value: function validateParticipants() {
      var _this3 = this;

      var participants = this.participants;
      (0, _lodashImports.forEach)(participants, function (participant) {
        return _this3.validateParticipant(participant);
      });
    }
  }, {
    key: "validateParticipant",
    value: function validateParticipant(participant) {
      var weeklyPreferences = participant.weeklyPreferences,
          events = participant.events;
      this.validateWeeklyPreferences(weeklyPreferences);
      this.validateParticipantEvents(events);
    }
  }, {
    key: "validateWeeklyPreferences",
    value: function validateWeeklyPreferences(weeklyPreferences) {
      var _this4 = this;

      weeklyPreferences.sort(function (wp1, wp2) {
        return wp1.interval.start.valueOf() - wp2.interval.start.valueOf();
      });
      (0, _lodashImports.forEach)(weeklyPreferences, function (weeklyPreference) {
        return _this4.validateWeeklyPreference(weeklyPreference);
      });

      for (var i = 0; i < weeklyPreferences.length - 1; i += 1) {
        var wp1 = weeklyPreferences[i];
        var wp2 = weeklyPreferences[i + 1];

        if (wp1.overlaps(wp2)) {
          this.errors.push('invalid weeklyPreferences - overlap not allowed');
        }
      }
    }
  }, {
    key: "validateWeeklyPreference",
    value: function validateWeeklyPreference(weeklyPreference) {
      var interval = weeklyPreference.interval;

      if (!interval.isValid || interval.length('week') > 1) {
        this.errors.push('invalid weeklyPreference');
      }
    }
  }, {
    key: "validateParticipantEvents",
    value: function validateParticipantEvents(events) {
      var _this5 = this;

      (0, _lodashImports.forEach)(events, function (event) {
        return _this5.validateParticipantEvent(event);
      });
    }
  }, {
    key: "validateParticipantEvent",
    value: function validateParticipantEvent(event) {
      if (!event.isValid) {
        this.errors.push('invalid participant event');
      }
    }
  }, {
    key: "areParticipantIdsCovered",
    value: function areParticipantIdsCovered(participantIds) {
      return (0, _lodashImports.isEmpty)((0, _lodashImports.difference)(participantIds, this.participants));
    }
  }, {
    key: "participantIds",
    get: function get() {
      return (0, _lodashImports.map)(this.participants, function (participant) {
        return participant.id;
      });
    }
  }]);

  return SchedulingInputValidator;
}();