// State Management System - Vanilla JavaScript replacement for React Context

class StateManager {
    constructor() {
        this.state = {};
        this.listeners = new Map();
        this.middleware = [];
        this.history = [];
        this.maxHistorySize = 50;
    }

    // Get state value
    get(key) {
        return this.state[key];
    }

    // Get entire state
    getState() {
        return { ...this.state };
    }

    // Set state value and notify listeners
    set(key, value) {
        const oldValue = this.state[key];
        
        // Apply middleware
        const action = { type: 'SET', key, value, oldValue };
        const processedAction = this.applyMiddleware(action);
        
        if (processedAction === false) {
            return; // Middleware cancelled the action
        }

        this.state[key] = processedAction.value;
        
        // Add to history
        this.addToHistory({
            type: 'SET',
            key,
            value: processedAction.value,
            oldValue,
            timestamp: Date.now()
        });
        
        // Notify listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(processedAction.value, oldValue);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
    }

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    // Apply middleware
    applyMiddleware(action) {
        let processedAction = action;
        for (const middleware of this.middleware) {
            processedAction = middleware(processedAction, this.state);
            if (processedAction === false) {
                return false;
            }
        }
        return processedAction;
    }

    // Add to history
    addToHistory(entry) {
        this.history.push(entry);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // Add middleware
    use(middleware) {
        this.middleware.push(middleware);
    }

    // Clear state
    clear() {
        this.state = {};
        this.listeners.clear();
        this.history = [];
    }

    // Get history
    getHistory() {
        return [...this.history];
    }
}

// Create and export singleton
const state = new StateManager();
window.state = state;