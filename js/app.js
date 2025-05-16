// Main application entry point - integrates all modules

import { Tracker } from './models.js';
import { StorageService } from './storage.js';
import { UIService } from './ui.js';

class TrackerManager {
    constructor() {
        // Initialize services
        this.storageService = new StorageService();
        this.trackers = this.storageService.loadTrackers();
        
        // Version management
        this.currentVersion = '1.2.1'; // Client version - keep track of the last version we ran
        this.serverVersion = null;
        this.updateAvailable = false;
        this.serviceWorkerRegistration = null;
        
        // Initialize UI after setting up version
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
        
        // Set up update notification
        this.setupUpdateNotification();
        
        // Update footer with version
        this.updateVersionDisplay();
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
                        this.serviceWorkerRegistration = registration;
                        
                        // Check if there's a waiting service worker
                        if (registration.waiting) {
                            console.log('New service worker waiting');
                            this.updateAvailable = true;
                            this.showUpdateNotification();
                        }
                        
                        // Detect when a new service worker is installed but waiting
                        registration.addEventListener('updatefound', () => {
                            console.log('New service worker update found!');
                            const newWorker = registration.installing;
                            
                            newWorker.addEventListener('statechange', () => {
                                console.log(`Service Worker state changed: ${newWorker.state}`);
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('New service worker installed and waiting');
                                    this.updateAvailable = true;
                                    this.showUpdateNotification();
                                }
                            });
                        });
                        
                        // Force check for updates now
                        this.checkForUpdates();
                        
                        // Check for version updates every 10 minutes if online
                        setInterval(() => {
                            if (navigator.onLine) {
                                this.checkForUpdates();
                            }
                        }, 10 * 60 * 1000);
                    })
                    .catch(error => {
                        console.error('Service Worker registration failed:', error);
                    });
                
                // Setup message handler for service worker events
                navigator.serviceWorker.addEventListener('message', event => {
                    console.log('Received message from service worker:', event.data);
                    
                    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                        const newVersion = event.data.version;
                        console.log(`New version available: ${newVersion}`);
                        this.serverVersion = newVersion;
                        
                        // Only show update if version is actually different
                        if (newVersion !== this.currentVersion) {
                            this.updateAvailable = true;
                            this.showUpdateNotification();
                        }
                        
                        // Update version in footer
                        this.updateVersionDisplay();
                    } else if (event.data && event.data.type === 'VERSION_INFO') {
                        const serverVersion = event.data.version;
                        console.log(`Received version info: ${serverVersion}, current: ${this.currentVersion}`);
                        this.serverVersion = serverVersion;
                        
                        if (serverVersion !== this.currentVersion) {
                            console.log('Version mismatch detected');
                            this.updateAvailable = true;
                            this.showUpdateNotification();
                        }
                        
                        // Update version in footer
                        this.updateVersionDisplay();
                    }
                });
                
                // If we already have an active service worker, ask for its version
                if (navigator.serviceWorker.controller) {
                    console.log('Checking version with existing service worker controller');
                    navigator.serviceWorker.controller.postMessage({
                        type: 'CHECK_VERSION'
                    });
                }
            });
        }
    }
    
    /**
     * Explicitly check for service worker updates
     */
    checkForUpdates() {
        console.log('Checking for service worker updates...');
        if (this.serviceWorkerRegistration) {
            this.serviceWorkerRegistration.update()
                .then(() => {
                    console.log('Service worker update check completed');
                    
                    // After update check, ask the service worker for its version
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'CHECK_VERSION'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error checking for updates:', error);
                });
        }
    }
    
    /**
     * Setup the update notification banner and button
     */
    setupUpdateNotification() {
        const updateBanner = document.getElementById('update-banner');
        const updateButton = document.getElementById('update-app-button');
        
        // Make sure banner is hidden initially
        updateBanner.classList.remove('visible');
        
        // Handle update button click
        updateButton.addEventListener('click', () => {
            // Hide the notification
            updateBanner.classList.remove('visible');
            
            console.log('Update button clicked, refreshing app...');
            
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
                // Send message to service worker to skip waiting
                console.log('Sending skip waiting message to service worker');
                this.serviceWorkerRegistration.waiting.postMessage({ 
                    type: 'SKIP_WAITING' 
                });
            }
            
            // Reload the page to get the new version
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }
    
    /**
     * Show the update notification
     */
    showUpdateNotification() {
        console.log('Showing update notification banner');
        const updateBanner = document.getElementById('update-banner');
        updateBanner.classList.add('visible');
    }

    /**
     * Update the footer to display the current version
     */
    updateVersionDisplay() {
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            const displayVersion = this.serverVersion || this.currentVersion;
            versionElement.textContent = `Version ${displayVersion}`;
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