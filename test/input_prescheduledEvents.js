module.exports = {
    resolution: { minutes: 30 },
    schedulingParameters: {
        schedulingPeriod: { start: "2019-07-01T00:00:00Z", end: "2019-07-02T00:00:00Z" },
        numberOfEvents: 5,
        lengthOfEvents: { hours: 1, minutes: 15 },
    },
    participants: [{
        id: 'one',
        weight: 1,
        events: [{
            start: "2019-07-01T01:00:00Z",
            end: "2019-07-01T02:30:00Z"
        }],
    }, {
        id: 'two',
        weight: 1,
        events: [{
            start: "2019-07-01T04:00:00Z",
            end: "2019-07-01T05:00:00Z"
        }, {
            start: "2019-07-01T10:00:00Z",
            end: "2019-07-01T11:30:00Z"
        }]
    }, {
        id: 'three',
        weight: 1,
    }, {
        id: 'four',
        weight: 1,
        events: [{
            start: "2019-07-01T08:00:00Z",
            end: "2019-07-01T14:00:00Z"
        }],
    }, {
        id: 'five',
        weight: 1,
        events: [{
            start: "2019-07-01T15:00:00Z",
            end: "2019-07-01T19:00:00Z"
        }],
    }],
};