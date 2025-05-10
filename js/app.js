// Progress Tracker App - Main JavaScript File

// Store DOM elements
const newTrackerForm = document.getElementById('new-tracker-form');
const trackerNameInput = document.getElementById('tracker-name');
const currentValueInput = document.getElementById('current-value');
const targetValueInput = document.getElementById('target-value');
const trackersList = document.getElementById('trackers-list');

// Tracker class to manage individual trackers
class Tracker {
    constructor(id, name, currentValue, targetValue, history = []) {
        this.id = id;
        this.name = name;
        this.currentValue = parseFloat(currentValue);
        this.targetValue = parseFloat(targetValue);
        this.history = history.length > 0 ? history : [{
            date: new Date().toISOString(),
            value: this.currentValue
        }];
    }

    getProgress() {
        return Math.min(100, (this.currentValue / this.targetValue) * 100);
    }

    updateValue(newValue) {
        this.currentValue = parseFloat(newValue);
        this.history.push({
            date: new Date().toISOString(),
            value: this.currentValue
        });
    }
}

// App controller class
class TrackerApp {
    constructor() {
        this.trackers = [];
        this.loadFromLocalStorage();
        this.renderTrackers();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add new tracker form submission
        newTrackerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewTracker();
        });

        // Event delegation for tracker actions (update, delete)
        trackersList.addEventListener('click', (e) => {
            const target = e.target;
            const trackerId = target.closest('.tracker-card')?.dataset.id;
            
            if (!trackerId) return;
            
            // Handle update button click
            if (target.classList.contains('btn-update')) {
                this.toggleUpdateForm(trackerId);
            }
            
            // Handle delete button click
            if (target.classList.contains('btn-delete')) {
                this.deleteTracker(trackerId);
            }
            
            // Handle history button click
            if (target.classList.contains('btn-history')) {
                this.toggleHistory(trackerId);
            }
        });

        // Event delegation for update form submission
        trackersList.addEventListener('submit', (e) => {
            if (e.target.classList.contains('update-value-form')) {
                e.preventDefault();
                const trackerId = e.target.closest('.tracker-card').dataset.id;
                const newValue = e.target.querySelector('.new-value-input').value;
                this.updateTrackerValue(trackerId, newValue);
            }
        });
    }

    loadFromLocalStorage() {
        const savedTrackers = localStorage.getItem('progressTrackers');
        
        if (savedTrackers) {
            const parsedTrackers = JSON.parse(savedTrackers);
            this.trackers = parsedTrackers.map(tracker => 
                new Tracker(tracker.id, tracker.name, tracker.currentValue, tracker.targetValue, tracker.history)
            );
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('progressTrackers', JSON.stringify(this.trackers));
    }

    addNewTracker() {
        const name = trackerNameInput.value.trim();
        const currentValue = currentValueInput.value;
        const targetValue = targetValueInput.value;
        
        // Generate a unique ID using timestamp
        const id = 'tracker_' + Date.now();
        
        // Create new tracker and add to the collection
        const newTracker = new Tracker(id, name, currentValue, targetValue);
        this.trackers.push(newTracker);
        
        // Save and render
        this.saveToLocalStorage();
        this.renderTrackers();
        
        // Reset form
        newTrackerForm.reset();
    }

    updateTrackerValue(trackerId, newValue) {
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        if (tracker) {
            tracker.updateValue(newValue);
            this.saveToLocalStorage();
            this.renderTrackers();
        }
    }

    deleteTracker(trackerId) {
        if (confirm('Are you sure you want to delete this tracker?')) {
            this.trackers = this.trackers.filter(tracker => tracker.id !== trackerId);
            this.saveToLocalStorage();
            this.renderTrackers();
        }
    }

    toggleUpdateForm(trackerId) {
        const card = trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const updateForm = card.querySelector('.update-form');
        
        updateForm.classList.toggle('hidden');
        
        if (!updateForm.classList.contains('hidden')) {
            updateForm.querySelector('.new-value-input').focus();
        }
    }

    toggleHistory(trackerId) {
        const card = trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const historyList = card.querySelector('.history-list');
        
        historyList.classList.toggle('hidden');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    renderTrackers() {
        // Clear existing content
        trackersList.innerHTML = '';
        
        if (this.trackers.length === 0) {
            trackersList.innerHTML = '<p>No trackers yet. Create one using the form above.</p>';
            return;
        }
        
        // Sort trackers by name
        const sortedTrackers = [...this.trackers].sort((a, b) => a.name.localeCompare(b.name));
        
        // Create tracker card for each tracker
        sortedTrackers.forEach(tracker => {
            const progress = tracker.getProgress();
            
            // Create history HTML
            let historyHTML = '';
            tracker.history.slice().reverse().forEach(entry => {
                historyHTML += `<div class="history-entry">
                    ${this.formatDate(entry.date)}: ${entry.value}
                </div>`;
            });
            
            // Create tracker card
            const trackerHTML = `
                <div class="tracker-card" data-id="${tracker.id}">
                    <div class="tracker-header">
                        <h3 class="tracker-title">${tracker.name}</h3>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%">
                            ${Math.round(progress)}%
                        </div>
                    </div>
                    
                    <div class="tracker-values">
                        <span>Current: ${tracker.currentValue}</span>
                        <span>Target: ${tracker.targetValue}</span>
                    </div>
                    
                    <div class="tracker-actions">
                        <button class="btn btn-update">Update Value</button>
                        <button class="btn btn-history">Show History</button>
                        <button class="btn btn-danger btn-delete">Delete</button>
                    </div>
                    
                    <form class="update-form update-value-form hidden">
                        <div class="form-group">
                            <label>New Value:</label>
                            <input type="number" class="new-value-input" min="0" required>
                        </div>
                        <button type="submit" class="btn">Save</button>
                    </form>
                    
                    <div class="history-list hidden">
                        <h4>Value History</h4>
                        ${historyHTML}
                    </div>
                </div>
            `;
            
            trackersList.innerHTML += trackerHTML;
        });
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new TrackerApp();
});