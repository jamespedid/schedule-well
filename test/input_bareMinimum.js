module.exports = {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-07-01T00:00:00Z", end: "2019-07-01T23:59:59Z" },
        numberOfEvents: 5,
        lengthOfEvents: { hours: 1, minutes: 15 },
    },
    participants: [{
        id: 'one',
        weight: 1,
    }, {
        id: 'two',
        weight: 1,
    }, {
        id: 'three',
        weight: 1,
    }, {
        id: 'four',
        weight: 1,
    }, {
        id: 'five',
        weight: 1,
    }],
};