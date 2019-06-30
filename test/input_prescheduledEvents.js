module.exports = {
    resolution: { minutes: 15 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-07-01T00:00:00Z", end: "2019-07-02T00:00:00Z" },
        numberOfEvents: 5,
        lengthOfEvents: { hours: 1, minutes: 15 },
    },
    participants: [{
        id: 'one',
        weight: 1,
        events: [{
            start: "2019-07-01T22:00:00Z",
            end: "2019-07-01T22:30:00Z"
        }],
    }, {
        id: 'two',
        weight: 1,
        events: [{
            start: "2019-07-01T04:00:00Z",
            end: "2019-07-01T05:00:00Z"
        }, {
            start: "2019-07-01T16:00:00Z",
            end: "2019-07-01T16:30:00Z"
        }]
    }, {
        id: 'three',
        weight: 1,
    }, {
        id: 'four',
        weight: 1,
        events: [{
            start: "2019-07-01T12:00:00Z",
            end: "2019-07-01T13:00:00Z"
        }],
    }, {
        id: 'five',
        weight: 1,
        events: [{
            start: "2019-07-01T08:00:00Z",
            end: "2019-07-01T09:00:00Z"
        }],
    }],
};