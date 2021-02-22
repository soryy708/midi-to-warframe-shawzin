const globalContext = {
    eventListeners: {},
};

export function emitAppEvent(eventType, ...data) {
    const listeners = globalContext.eventListeners[eventType] || [];
    listeners.forEach(listener => {
        listener(...data);
    });
}

export function subscribeAppEvent(eventType, listener) {
    if (!globalContext.eventListeners[eventType]) {
        globalContext.eventListeners[eventType] = [];
    }
    globalContext.eventListeners[eventType].push(listener);
}
