const compiler = require('./util/compiler');
const errUtil = require('./util/err');

compiler.run((err, stats) => {
    errUtil(err, stats);
    console.log(stats.toString({chunks: false, colors: true})); // eslint-disable-line no-console
});
