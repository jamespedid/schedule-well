import { DateTime, Duration, Interval } from 'luxon';
import { DurationLike, WeeklyPreference, ZoneLike } from '../types';
import { interpretDurationLike } from './interpretInput';

/**
 * Returns a weekly preference set that is weight <insideWeight> for hours between start and end and <outsideWeight>
 * otherwise. The hours are determined in the provided timezone, which defaults to UTC. Implementation Detail: the week
 * used is the week starting on Jan 4 1970.
 * @param start - duration offset from the beginning of the day for the start of the weight 1 interval
 * @param end - duration offset from the beginning of the day for the end of the weight 1 interval
 * @param timeZone
 * @param outsideWeight - weight set to values outside of interval. defaults to 0.
 * @param insideWeight - weight set to the values inside of the interval. defaults to 0.
 */
export function createWeekdayHoursWeeklyPreference(
    start: DurationLike,
    end: DurationLike,
    timeZone: ZoneLike = 'UTC',
    outsideWeight = 0,
    insideWeight = 1,
): WeeklyPreference[] {
    let startDuration = interpretDurationLike(start);
    let endDuration = interpretDurationLike(end);
    validateWeekydayPreference(startDuration, endDuration);
    const sunday = DateTime.local(1970, 1, 4, 0, 0, 0).setZone(timeZone);
    const monday = sunday.plus({ days: 1 });
    const tuesday = sunday.plus({ days: 2 });
    const wednesday = sunday.plus({ days: 3 });
    const thursday = sunday.plus({ days: 4 });
    const friday = sunday.plus({ days: 5 });
    const saturday = sunday.plus({ days: 6 });
    const weeklyPreferences = [];
    weeklyPreferences.push({
        weight: outsideWeight,
        interval: Interval.after(sunday, { days: 1 }),
    });
    addDailyPreference(weeklyPreferences, monday, startDuration, endDuration, outsideWeight, insideWeight);
    addDailyPreference(weeklyPreferences, tuesday, startDuration, endDuration, outsideWeight, insideWeight);
    addDailyPreference(weeklyPreferences, wednesday, startDuration, endDuration, outsideWeight, insideWeight);
    addDailyPreference(weeklyPreferences, thursday, startDuration, endDuration, outsideWeight, insideWeight);
    addDailyPreference(weeklyPreferences, friday, startDuration, endDuration, outsideWeight, insideWeight);
    weeklyPreferences.push({
        weight: outsideWeight,
        interval: Interval.after(saturday, { days: 1 }),
    });
    return weeklyPreferences;
}

export function createWeekdayPreference(
    dayOfWeek: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday',
    start: DurationLike,
    end: DurationLike,
    timeZone: ZoneLike = 'UTC',
    weight = 1,
): WeeklyPreference {
    let startDuration = interpretDurationLike(start);
    let endDuration = interpretDurationLike(end);
    validateWeekydayPreference(startDuration, endDuration);
    const sunday = DateTime.local(1970, 1, 4, 0, 0, 0).setZone(timeZone);
    let day: DateTime;
    switch (dayOfWeek) {
        case 'sunday':
            day = sunday;
            break;
        case 'monday':
            day = sunday.plus({ days: 1 });
            break;
        case 'tuesday':
            day = sunday.plus({ days: 2 });
            break;
        case 'wednesday':
            day = sunday.plus({ days: 3 });
            break;
        case 'thursday':
            day = sunday.plus({ days: 4 });
            break;
        case 'friday':
            day = sunday.plus({ days: 5 });
            break;
        case 'saturday':
            day = sunday.plus({ days: 6 });
            break;
        default:
            throw new Error('invalid weekday');
    }
    return {
        weight: weight,
        interval: Interval.fromDateTimes(
            day.plus(startDuration),
            day.plus(endDuration),
        ),
    };
}

function addDailyPreference(
    weeklyPreferences: WeeklyPreference[],
    startOfDay: DateTime,
    startDuration: Duration,
    endDuration: Duration,
    outsideWeight: number,
    insideWeight: number,
) {
    if (startDuration.as('days') > 0) {
        weeklyPreferences.push({
            weight: outsideWeight,
            interval: Interval.after(startOfDay, startDuration),
        });
    }
    weeklyPreferences.push({
        weight: insideWeight,
        interval: Interval.fromDateTimes(startOfDay.plus(startDuration), startOfDay.plus(endDuration)),
    });
    if (endDuration.as('days') < 1) {
        weeklyPreferences.push({
            weight: outsideWeight,
            interval: Interval.fromDateTimes(startOfDay.plus(endDuration), startOfDay.plus({ days: 1 })),
        });
    }
}

function validateWeekydayPreference(
    startDuration: Duration,
    endDuration: Duration,
) {
    if (!startDuration.isValid) {
        throw new Error('invalid startDuration');
    }
    if (startDuration.as('days') > 1) {
        throw new Error('startDuration must be less than one day');
    }
    if (!endDuration.isValid) {
        throw new Error('invalid startDuration');
    }
    if (endDuration.as('days') > 1) {
        throw new Error('startDuration must be less than one day');
    }
    if (endDuration.as('days') < startDuration.as('days')) {
        throw new Error('startDuration must be shorter than endDuration');
    }
}