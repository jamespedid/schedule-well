module.exports = exports.default = {
    presets: [
        ["@babel/preset-env", {
            targets: {
                node: 'current',
                browsers: 'last 2 versions',
            },
        }],
    ],
};