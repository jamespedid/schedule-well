import { DateTime, Duration, Interval } from 'luxon';
import { DurationLike, WeeklyPreference, ZoneLike } from '../types';
import { interpretDurationLike } from './interpretInput';

/**
 * Returns a weekly preference set that is weight <insideWeight> for hours between start and end and <outsideWeight>
 * otherwise. The hours are determined in the provided timezone, which defaults to UTC. Implementation Detail: the week
 * used is the current week.
 * @param start - duration offset from the beginning of the day for the start of the weight 1 interval
 * @param end - duration offset from the beginning of the day for the end of the weight 1 interval
 * @param timeZone
 * @param outsideWeight - weight set to values outside of interval. defaults to 0.
 * @param insideWeight - weight set to the values inside of the interval. defaults to 0.
 * @param daysOfWeekToInclude - if day of week (expressed as an integer, 0 = sunday, 1 = monday, etc) is included, then
 *     the weekly preference will be processed for this day. Defaults to [0, 1, 2, 3, 4, 5, 6]
 */
export function createWeekdayHoursWeeklyPreference(
    start: DurationLike,
    end: DurationLike,
    timeZone: ZoneLike = 'UTC',
    outsideWeight = 0,
    insideWeight = 1,
    daysOfWeekToInclude = [0, 1, 2, 3, 4, 5, 6],
): WeeklyPreference[] {
    let startDuration = interpretDurationLike(start);
    let endDuration = interpretDurationLike(end);
    validateWorkHourPreference(startDuration, endDuration);
    const sunday = DateTime.local().startOf('week').setZone(timeZone);
    const monday = sunday.plus({ days: 1 });
    const tuesday = sunday.plus({ days: 2 });
    const wednesday = sunday.plus({ days: 3 });
    const thursday = sunday.plus({ days: 4 });
    const friday = sunday.plus({ days: 5 });
    const saturday = sunday.plus({ days: 6 });
    const weeklyPreferences = [];
    if (daysOfWeekToInclude.includes(0)) {
        weeklyPreferences.push({
            weight: outsideWeight,
            interval: Interval.after(sunday, { days: 1 }),
        });
    }
    if (daysOfWeekToInclude.includes(1)) {
        addDailyPreference(weeklyPreferences, monday, startDuration, endDuration, outsideWeight, insideWeight);
    }
    if (daysOfWeekToInclude.includes(2)) {
        addDailyPreference(weeklyPreferences, tuesday, startDuration, endDuration, outsideWeight, insideWeight);
    }
    if (daysOfWeekToInclude.includes(3)) {
        addDailyPreference(weeklyPreferences, wednesday, startDuration, endDuration, outsideWeight, insideWeight);
    }
    if (daysOfWeekToInclude.includes(4)) {
        addDailyPreference(weeklyPreferences, thursday, startDuration, endDuration, outsideWeight, insideWeight);
    }
    if (daysOfWeekToInclude.includes(5)) {
        addDailyPreference(weeklyPreferences, friday, startDuration, endDuration, outsideWeight, insideWeight);
    }
    if (daysOfWeekToInclude.includes(6)) {
        weeklyPreferences.push({
            weight: outsideWeight,
            interval: Interval.after(saturday, { days: 1 }),
        });
    }
    return weeklyPreferences;
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

function validateWorkHourPreference(
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