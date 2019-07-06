import {
    isEmpty,
    isInteger,
    forEach,
    map,
    difference,
    isArray,
} from './_lodashImports';
import { MultiError } from './multiError';
import { DateTime, Duration, Interval } from 'luxon';
import {
    EventToSchedule,
    ParticipantData, ParticipantId,
    SchedulingEventsInput,
    SchedulingParameters,
    WeeklyPreference,
} from '../types';

export function validateSchedulingInput(schedulingInput: SchedulingEventsInput) {
    const validator = new SchedulingInputValidator(schedulingInput);
    validator.assertAllValidations();
}

class SchedulingInputValidator {
    private readonly schedulingParameters: SchedulingParameters;
    private readonly participants: ParticipantData[];
    private readonly resolution: Duration;
    private readonly errors: Error[];

    constructor({
        schedulingParameters,
        participants,
        resolution,
    }: SchedulingEventsInput) {
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
        this.validateAmbientWeeklyPreferences();
        this.validateEventsToSchedule();
        this.validateNumberOfEvents();
        this.validateLengthOfEvents();
    }

    validateSchedulingPeriod() {
        if (!this.schedulingParameters.schedulingPeriod.isValid) {
            this.errors.push(new Error('invalid schedulingPeriod'));
        }
    }

    validateAmbientWeeklyPreferences() {
        if (this.schedulingParameters.ambientWeeklyPreferences.length > 0) {
            this.validateWeeklyPreferences(this.schedulingParameters.ambientWeeklyPreferences);
        }
    }

    validateEventsToSchedule() {
        forEach(this.schedulingParameters.eventsToSchedule, eventToSchedule => {
            this.validateEventToSchedule(eventToSchedule);
        });

    }

    validateEventToSchedule(eventToSchedule: EventToSchedule) {
        const { participantIds, eventDuration } = eventToSchedule;
        if (!this.areParticipantIdsCovered(participantIds)) {
            this.errors.push(new Error('invalid participantIds list (eventsToSchedule)'));
        }
        if (!eventDuration.isValid) {
            this.errors.push(new Error('invalid eventDuration'));
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
            this.errors.push(new Error('numberOfEvents must match eventsToSchedule length'));
        }
        if (numberOfEvents < 1) {
            this.errors.push(new Error('numberOfEvents must be positive'));
        }
        if (!isInteger(numberOfEvents)) {
            this.errors.push(new Error('numberOfEvents must be an integer'));
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
                this.errors.push(new Error('lengthOfEvents length is different than eventsToSchedule length'));
            }
        }
    }

    validateLengthOfEvent(lengthOfEvent: Duration) {
        if (!lengthOfEvent.isValid) {
            this.errors.push(new Error('invalid lengthOfEvent'));
        }
    }

    validateParticipants() {
        const { participants } = this;
        forEach(participants, participant => this.validateParticipant(participant));
    }

    validateParticipant(participant: ParticipantData) {
        const { weeklyPreferences, events } = participant;
        this.validateWeeklyPreferences(weeklyPreferences);
        this.validateParticipantEvents(events);
    }

    validateWeeklyPreferences(weeklyPreferences: WeeklyPreference[]) {
        if (weeklyPreferences.length === 0) {
            return;
        }
        weeklyPreferences.sort((wp1, wp2) => {
            return wp1.interval.start.valueOf() - wp2.interval.start.valueOf();
        });
        let minStartingWeeklyPreferenceTime: number = Infinity;
        let maxEndingWeeklyPreferenceTime: number = -Infinity;
        forEach(weeklyPreferences, weeklyPreference => {
            this.validateWeeklyPreference(weeklyPreference);
            if (weeklyPreference.interval.isValid) {
                minStartingWeeklyPreferenceTime = Math.min(weeklyPreference.interval.valueOf() as number, minStartingWeeklyPreferenceTime);
                maxEndingWeeklyPreferenceTime = Math.max(weeklyPreference.interval.valueOf() as number, maxEndingWeeklyPreferenceTime);
            }
        });
        const entireWeeklyInterval = Interval.fromDateTimes(
            DateTime.fromMillis(minStartingWeeklyPreferenceTime),
            DateTime.fromMillis(maxEndingWeeklyPreferenceTime),
        );
        if (entireWeeklyInterval.length('week') > 1) {
            this.errors.push(new Error('weeklyPreferences must not extend to be beyond single week'));
        }

        for (let i = 0; i < weeklyPreferences.length - 1; i += 1) {
            const wp1 = weeklyPreferences[i];
            const wp2 = weeklyPreferences[i + 1];
            if (wp1.interval.overlaps(wp2.interval)) {
                this.errors.push(new Error('invalid weeklyPreferences - overlap not allowed'));
            }
        }
    }

    validateWeeklyPreference(weeklyPreference: WeeklyPreference) {
        const { interval } = weeklyPreference;
        if (!interval.isValid || interval.length('week') > 1) {
            this.errors.push(new Error('invalid weeklyPreference'));
        }
    }

    validateParticipantEvents(events: Interval[]) {
        forEach(events, event => this.validateParticipantEvent(event));
    }

    validateParticipantEvent(event: Interval) {
        if (!event.isValid) {
            this.errors.push(new Error('invalid participant event'));
        }
    }

    get participantIds(): ParticipantId[] {
        return map(this.participants, participant => participant.id);
    }

    areParticipantIdsCovered(participantIds?: ParticipantId[]): boolean {
        return isEmpty(difference(participantIds, this.participantIds));
    }

}