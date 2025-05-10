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
                    tracker.history
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
        localStorage.setItem(this.storageKey, JSON.stringify(trackers));
    }
}

export { StorageService };