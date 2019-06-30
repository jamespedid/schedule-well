// any week will do, but the entire span should be no larger than one week.
const sunday = "2019-06-30";
const monday = "2019-07-01";
const tuesday = "2019-07-02";
const wednesday = "2019-07-03";
const thursday = "2019-07-04";
const friday = "2019-07-05";
const saturday = "2019-07-06";

module.exports = {
    resolution: { hours: 1 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-07-01T00:00:00Z", end: "2019-07-06T00:00:00Z" },
        numberOfEvents: 5,
        lengthOfEvents: { hours: 2, minutes: 15 },
    },
    participants: [{
        id: 'one',
        weight: 1,
        // participant one cannot do monday, wednesday, or friday
        weeklyPreferences: [{
            interval: {
                start: monday + "T00:00:00Z",
                end: tuesday + "T00:00:00Z",
            },
            weight: 0,
        }, {
            interval: {
                start: wednesday + "T00:00:00Z",
                end: thursday + "T00:00:00Z",
            },
            weight: 0,
        }, {
            interval: {
                start: friday + "T00:00:00Z",
                end: saturday + "T00:00:00Z",
            },
            weight: 0,
        }]
    }, {
        // cannot do before noon on any day
        id: 'two',
        weight: 1,
        weeklyPreferences: [{
            interval: {
                start: monday + "T00:00:00Z",
                end: monday + "T12:00:00Z",
            },
            weight: 0,
        }, {
            interval: {
                start: tuesday + "T00:00:00Z",
                end: tuesday + "T12:00:00Z",
            },
            weight: 0,
        }, {
            interval: {
                start: wednesday + "T00:00:00Z",
                end: wednesday + "T12:00:00Z",
            },
            weight: 0,
        }, {
            interval: {
                start: thursday + "T00:00:00Z",
                end: thursday + "T12:00:00Z",
            },
            weight: 0,
        }, {
            interval: {
                start: friday + "T00:00:00Z",
                end: friday + "T12:00:00Z",
            },
            weight: 0,
        }]
    }, {
        // has no weekly preferences
        id: 'three',
        weight: 1,
    }, {
        // has no blockers, but prefers monday, tuesday, wednesday, thursday between 8-10 PM
        id: 'four',
        weight: 1,
        weeklyPreferences: [{
            interval: {
                start: monday + "T20:00:00Z",
                end: monday + "T22:00:00Z",
            },
            weight: 2,
        }, {
            interval: {
                start: tuesday + "T20:00:00Z",
                end: tuesday + "T22:00:00Z",
            },
            weight: 2,
        }, {
            interval: {
                start: wednesday + "T20:00:00Z",
                end: wednesday + "T22:00:00Z",
            },
            weight: 2,
        }, {
            interval: {
                start: thursday + "T20:00:00Z",
                end: thursday + "T22:00:00Z",
            },
            weight: 2,
        }]
    }, {
        // also has no preferences
        id: 'five',
        weight: 1,
    }],
};