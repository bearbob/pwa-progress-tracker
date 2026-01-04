// Storage Service - Handles persisting and retrieving tracker data

import { Tracker } from './models.js';

class StorageService {
    constructor() {
        this.storageKey = 'progressTrackers';
    }

    /**
     * Load trackers from localStorage
     * @returns {Array} Array of Tracker objects
     */
    loadTrackers() {
        const savedTrackers = localStorage.getItem(this.storageKey);
        
        if (savedTrackers) {
            const parsedTrackers = JSON.parse(savedTrackers);
            return parsedTrackers.map(tracker => 
                new Tracker(
                    tracker.id, 
                    tracker.name, 
                    tracker.currentValue, 
                    tracker.targetValue, 
                    tracker.startDate, 
                    tracker.targetDate, 
                    tracker.history,
                    tracker.type || 'progress'
                )
            );
        }
        
        return [];
    }

    /**
     * Save trackers to localStorage
     * @param {Array} trackers - Array of Tracker objects to save
     */
    saveTrackers(trackers) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(trackers));
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('Storage quota exceeded. Attempting to cleanup history...');
                
                // Attempt cleanup
                this.optimizeStorage(trackers);
                
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(trackers));
                    console.log('Storage saved after optimization.');
                    alert('Storage was full. Old history entries have been automatically trimmed to make space.');
                } catch (retryError) {
                    console.error('Storage quota exceeded even after optimization.', retryError);
                    alert('Storage full! Unable to save changes. Please delete some old trackers.');
                    throw retryError;
                }
            } else {
                throw e;
            }
        }
    }

    /**
     * Optimize storage by trimming history of trackers
     * @param {Array} trackers - Array of Tracker objects
     */
    optimizeStorage(trackers) {
        trackers.forEach(tracker => {
            // For tally counters, we can be more aggressive with trimming
            // Keep only the last 50 entries
            if (tracker.type === 'tally' && tracker.history.length > 50) {
                const first = tracker.history[0]; // Keep start
                const last50 = tracker.history.slice(-50);
                tracker.history = [first, ...last50];
            } 
            // For regular trackers, keep last 200 entries
            else if (tracker.history.length > 200) {
                const first = tracker.history[0]; // Keep start
                const last200 = tracker.history.slice(-200);
                tracker.history = [first, ...last200];
            }
        });
    }
}

export { StorageService };