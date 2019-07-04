module.exports = exports.default = {
    presets: [
        ["@babel/preset-env", {
            targets: {
                node: 'current',
                browsers: 'last 2 versions',
            },
        }],
        '@babel/preset-typescript',
    ],
    plugins: [
        '@babel/proposal-class-properties',
        '@babel/proposal-object-rest-spread',
    ],
};