import {
    isEmpty,
    isInteger,
    forEach,
    map,
    difference,
    isArray,
} from './_lodashImports';
import { MultiError } from './multiError';

/**
 * The schedulingInput is assumed to be well-formed.
 * Validations here only will consider if the input data is consistent.
 * @param {ScheduleEventsInput} schedulingInput
 */
export function validateSchedulingInput(schedulingInput) {
    const validator = new SchedulingInputValidator(schedulingInput);
    validator.assertAllValidations();
}

class SchedulingInputValidator {
    constructor({
        schedulingParameters,
        participants,
        resolution,
    }) {
        this.schedulingParameters = schedulingParameters;
        this.participants = participants;
        this.resolution = resolution;
        this.errors = [];
    }

    assertAllValidations() {
        this.validateAll();
        this.assert();
    }

    assert() {
        if (this.errors.length > 0) {
            throw new MultiError(this.errors);
        }
    }

    validateAll() {
        this.validateResolution();
        this.validateSchedulingParameters();
        this.validateParticipants();
    }

    validateResolution() {
        const { resolution } = this;
        if (!resolution.isValid) {
            this.errors.push(new Error('invalid resolution'));
        }
    }

    validateSchedulingParameters() {
        this.validateSchedulingPeriod();
        this.validateEventsToSchedule();
        this.validateNumberOfEvents();
        this.validateLengthOfEvents();
    }

    validateSchedulingPeriod() {
        if (!this.schedulingParameters.schedulingPeriod.isValid) {
            this.errors.push('invalid schedulingPeriod');
        }
    }

    validateEventsToSchedule() {
        forEach(this.schedulingParameters.eventsToSchedule, eventToSchedule => {
            this.validateEventToSchedule(eventToSchedule);
        });

    }

    validateEventToSchedule(eventToSchedule) {
        const { participantIds, eventDuration } = eventToSchedule;
        if (!this.areParticipantIdsCovered(participantIds)) {
            this.errors.push('invalid participantIds list (eventsToSchedule)');
        }
        if (!eventDuration.isValid) {
            this.errors.push('invalid eventDuration');
        }
    }

    validateNumberOfEvents() {
        let { numberOfEvents, eventsToSchedule } = this.schedulingParameters;
        if (!isFinite(numberOfEvents) && eventsToSchedule) {
            numberOfEvents = eventsToSchedule.length;
            this.schedulingParameters.numberOfEvents = numberOfEvents;
        } else {
            numberOfEvents = numberOfEvents || 0;
        }
        if (eventsToSchedule.length > 0 && numberOfEvents > 0 && eventsToSchedule.length !== numberOfEvents) {
            this.errors.push('numberOfEvents must match eventsToSchedule length');
        }
        if (numberOfEvents < 1) {
            this.errors.push('numberOfEvents must be positive');
        }
        if (!isInteger(numberOfEvents)) {
            this.errors.push('numberOfEvents must be an integer');
        }
    }

    validateLengthOfEvents() {
        const { lengthOfEvents, eventsToSchedule } = this.schedulingParameters;
        if (!isArray(lengthOfEvents)) {
            this.validateLengthOfEvent(lengthOfEvents);
            return;
        }
        forEach(lengthOfEvents, lengthOfEvent => this.validateLengthOfEvent(lengthOfEvent));
        if (eventsToSchedule) {
            if (lengthOfEvents.length !== eventsToSchedule.length) {
                this.errors.push('lengthOfEvents length is different than eventsToSchedule length');
            }
        }
    }

    validateLengthOfEvent(lengthOfEvent) {
        if (!lengthOfEvent.isValid) {
            this.errors.push('invalid lengthOfEvent');
        }
    }

    validateParticipants() {
        const { participants } = this;
        forEach(participants, participant => this.validateParticipant(participant));
    }

    validateParticipant(participant) {
        const { weeklyPreferences, events } = participant;
        this.validateWeeklyPreferences(weeklyPreferences);
        this.validateParticipantEvents(events);
    }

    validateWeeklyPreferences(weeklyPreferences) {
        weeklyPreferences.sort((wp1, wp2) => {
            return wp1.interval.start.valueOf() - wp2.interval.start.valueOf();
        });
        forEach(weeklyPreferences, weeklyPreference => this.validateWeeklyPreference(weeklyPreference));
        for (let i = 0; i < weeklyPreferences.length - 1; i += 1) {
            const wp1 = weeklyPreferences[i];
            const wp2 = weeklyPreferences[i + 1];
            if (wp1.interval.overlaps(wp2.interval)) {
                this.errors.push('invalid weeklyPreferences - overlap not allowed');
            }
        }
    }

    validateWeeklyPreference(weeklyPreference) {
        const { interval } = weeklyPreference;
        if (!interval.isValid || interval.length('week') > 1) {
            this.errors.push('invalid weeklyPreference');
        }
    }

    validateParticipantEvents(events) {
        forEach(events, event => this.validateParticipantEvent(event));
    }

    validateParticipantEvent(event) {
        if (!event.isValid) {
            this.errors.push('invalid participant event');
        }
    }

    get participantIds() {
        return map(this.participants, participant => participant.id);
    }

    areParticipantIdsCovered(participantIds) {
        return isEmpty(difference(participantIds, this.participants));
    }

}