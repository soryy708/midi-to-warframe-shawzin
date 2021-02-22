module.exports = (err, stats) => {
    if (err) {
        console.error(err.stack || err); // eslint-disable-line no-console
        if (err.details) {
            console.error(err.details); // eslint-disable-line no-console
        }
        return;
    }
    
    if (stats) {
        const info = stats.toJson();
        if (stats.hasErrors()) {
            console.error(info.errors); // eslint-disable-line no-console
        }
        if (stats.hasWarnings()) {
            console.warn(info.warnings); // eslint-disable-line no-console
        }
    }
};
