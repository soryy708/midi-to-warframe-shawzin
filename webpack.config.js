const path = require('path');
const copyPlugin = require('copy-webpack-plugin');

const basicConfig = {
    module: {
        rules: [{
            test: /\.(js|jsx)$/u,
            exclude: '/node_modules/',
            use: 'babel-loader',
        }],
    },
    resolve: {
        extensions: [
            '.js',
            '.json',
        ],
    },
    watchOptions: {
        ignored: ['node_modules'],
    },
};

const configs = [{
    ...basicConfig,
    target: 'web',
    entry: ['@babel/polyfill', path.join(__dirname, 'src', 'index.js')],
    output: {
        filename: 'index.js',
    },
    plugins: [
        new copyPlugin({
            patterns: [
                {from: 'src/index.html', to: 'index.html'},
                {from: 'src/style.css', to: 'style.css'},
            ],
        }),
    ],
}];

if (process.env.BUILD_ENV === 'production') {
    module.exports = configs.map(config => ({
        ...config,
        mode: 'production',
        output: {
            ...config.output,
            path: path.resolve(__dirname, 'build', 'prod'),
        }
    }));
} else {
    module.exports = configs.map(config => ({
        ...config,
        mode: 'development',
        output: {
            ...config.output,
            path: path.resolve(__dirname, 'build', 'dev'),
        },
        devtool: 'source-map',
    }));
}
