// Main application entry point - integrates all modules

import { Tracker } from './models.js';
import { StorageService } from './storage.js';
import { UIService } from './ui.js';

class TrackerManager {
    constructor() {
        // Initialize services
        this.storageService = new StorageService();
        this.trackers = this.storageService.loadTrackers();
        this.uiService = new UIService(this);
    }
    
    /**
     * Initialize the application
     */
    initialize() {
        // Set up UI
        this.uiService.initialize();
        
        // Register service worker
        this.registerServiceWorker();
    }
    
    /**
     * Register service worker for PWA functionality
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Service Worker registration failed:', error);
                    });
            });
        }
    }
    
    /**
     * Get all trackers
     */
    getTrackers() {
        return this.trackers;
    }
    
    /**
     * Get a tracker by ID
     */
    getTracker(id) {
        return this.trackers.find(tracker => tracker.id === id);
    }
    
    /**
     * Add a new tracker
     */
    addTracker(name, currentValue, targetValue, startDate = null, targetDate = null) {
        // Generate a unique ID using timestamp
        const id = 'tracker_' + Date.now();
        
        // Create new tracker and add to the collection
        const newTracker = new Tracker(id, name, currentValue, targetValue, startDate, targetDate);
        this.trackers.push(newTracker);
        
        // Save and update UI
        this.save();
    }
    
    /**
     * Update a tracker's value
     */
    updateTrackerValue(trackerId, newValue) {
        const tracker = this.getTracker(trackerId);
        
        if (tracker) {
            tracker.updateValue(newValue);
            this.save();
        }
    }
    
    /**
     * Update a tracker's target value
     */
    updateTrackerTarget(trackerId, newTarget) {
        const tracker = this.getTracker(trackerId);
        
        if (tracker) {
            tracker.targetValue = parseFloat(newTarget);
            this.save();
        }
    }
    
    /**
     * Rename a tracker
     */
    renameTracker(trackerId, newName) {
        const tracker = this.getTracker(trackerId);
        
        if (tracker) {
            tracker.name = newName.trim();
            this.save();
        }
    }
    
    /**
     * Update a tracker's start and target dates
     */
    updateDates(trackerId, startDate, targetDate) {
        const tracker = this.getTracker(trackerId);
        
        if (tracker) {
            tracker.startDate = startDate;
            tracker.targetDate = targetDate;
            this.save();
        }
    }
    
    /**
     * Delete a tracker
     */
    deleteTracker(trackerId) {
        if (confirm('Are you sure you want to delete this tracker?')) {
            this.trackers = this.trackers.filter(tracker => tracker.id !== trackerId);
            this.save();
        }
    }
    
    /**
     * Save trackers and update UI
     */
    save() {
        this.storageService.saveTrackers(this.trackers);
        this.uiService.renderTrackers();
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TrackerManager();
    app.initialize();
});