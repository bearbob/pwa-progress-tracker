// Progress Tracker App - Main JavaScript File

// Store DOM elements
const newTrackerForm = document.getElementById('new-tracker-form');
const trackerNameInput = document.getElementById('tracker-name');
const currentValueInput = document.getElementById('current-value');
const targetValueInput = document.getElementById('target-value');
const startDateInput = document.getElementById('start-date');
const targetDateInput = document.getElementById('target-date');
const trackersList = document.getElementById('trackers-list');
const menuButton = document.getElementById('menu-button');
const menuDropdown = document.getElementById('menu-dropdown');
const createTrackerButton = document.getElementById('create-tracker-button');
const createTrackerModal = document.getElementById('create-tracker-modal');
const closeModalButton = document.getElementById('close-modal-button');

// Tracker class to manage individual trackers
class Tracker {
    constructor(id, name, currentValue, targetValue, startDate = null, targetDate = null, history = []) {
        this.id = id;
        this.name = name;
        this.currentValue = parseFloat(currentValue);
        this.targetValue = parseFloat(targetValue);
        this.startDate = startDate;
        this.targetDate = targetDate;
        this.history = history.length > 0 ? history : [{
            date: new Date().toISOString(),
            value: this.currentValue
        }];
    }

    getProgress() {
        return Math.min(100, (this.currentValue / this.targetValue) * 100);
    }
    
    getExpectedProgress() {
        // If no start or target date, return null (can't calculate expected progress)
        if (!this.startDate || !this.targetDate) {
            return null;
        }
        
        const start = new Date(this.startDate);
        const end = new Date(this.targetDate);
        const current = new Date();
        
        // If current date is before start date, expected progress is 0%
        if (current < start) {
            return 0;
        }
        
        // If current date is after target date, expected progress is 100%
        if (current > end) {
            return 100;
        }
        
        // Calculate what percentage of time has elapsed
        const totalDuration = end.getTime() - start.getTime();
        const elapsedDuration = current.getTime() - start.getTime();
        const timeProgressPercent = (elapsedDuration / totalDuration) * 100;
        
        return timeProgressPercent;
    }
    
    getProgressStatus() {
        const expectedProgress = this.getExpectedProgress();
        
        // If we can't calculate expected progress, return "on-track"
        if (expectedProgress === null) {
            return "on-track";
        }
        
        const actualProgress = this.getProgress();
        const difference = actualProgress - expectedProgress;
        
        if (difference < -5) {
            return "off-track"; // More than 5% behind
        } else if (difference < 0) {
            return "slightly-off"; // Between 0% and 5% behind
        } else {
            return "on-track"; // On track or ahead
        }
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
        this.activeMenu = null; // Keep track of which tracker menu is active
    }

    setupEventListeners() {
        // Menu button click
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('hidden');
        });

        // Create tracker button in menu
        createTrackerButton.addEventListener('click', () => {
            menuDropdown.classList.add('hidden');
            createTrackerModal.classList.remove('hidden');
        });

        // Close modal button
        closeModalButton.addEventListener('click', () => {
            createTrackerModal.classList.add('hidden');
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === createTrackerModal) {
                createTrackerModal.classList.add('hidden');
            }
            
            // Close dropdown when clicking outside
            if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.classList.add('hidden');
            }

            // Close active tracker menu if clicking outside
            if (this.activeMenu && !e.target.closest('.tracker-menu-button')) {
                this.activeMenu.classList.add('hidden');
                this.activeMenu = null;
            }
        });

        // Add new tracker form submission
        newTrackerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewTracker();
            createTrackerModal.classList.add('hidden');
        });

        // Event delegation for tracker actions (update, menu toggle)
        trackersList.addEventListener('click', (e) => {
            const target = e.target;
            const trackerId = target.closest('.tracker-card')?.dataset.id;
            
            if (!trackerId) return;
            
            // Handle update button click
            if (target.classList.contains('btn-update')) {
                this.toggleUpdateForm(trackerId);
            }
            
            // Handle tracker menu button click
            if (target.closest('.tracker-menu-button')) {
                e.stopPropagation();
                const menuDropdown = document.querySelector(`.tracker-menu-dropdown[data-id="${trackerId}"]`);
                
                // Close any other open menus
                if (this.activeMenu && this.activeMenu !== menuDropdown) {
                    this.activeMenu.classList.add('hidden');
                }
                
                // Toggle the clicked menu
                menuDropdown.classList.toggle('hidden');
                this.activeMenu = menuDropdown.classList.contains('hidden') ? null : menuDropdown;
            }
            
            // Handle menu options
            if (target.closest('.tracker-menu-item')) {
                const action = target.dataset.action || target.closest('.tracker-menu-item').dataset.action;
                
                if (action === 'show-history') {
                    this.toggleHistory(trackerId);
                } else if (action === 'update-target') {
                    this.showUpdateTargetForm(trackerId);
                } else if (action === 'rename') {
                    this.showRenameForm(trackerId);
                } else if (action === 'delete') {
                    this.deleteTracker(trackerId);
                } else if (action === 'update-dates') {
                    this.showDateForm(trackerId);
                }
                
                // Close the menu
                const menuDropdown = document.querySelector(`.tracker-menu-dropdown[data-id="${trackerId}"]`);
                menuDropdown.classList.add('hidden');
                this.activeMenu = null;
            }
        });

        // Event delegation for various form submissions
        trackersList.addEventListener('submit', (e) => {
            e.preventDefault();
            const trackerId = e.target.closest('.tracker-card').dataset.id;
            
            if (e.target.classList.contains('update-value-form')) {
                const newValue = e.target.querySelector('.new-value-input').value;
                this.updateTrackerValue(trackerId, newValue);
            }
            
            if (e.target.classList.contains('update-target-form')) {
                const newTarget = e.target.querySelector('.new-target-input').value;
                this.updateTrackerTarget(trackerId, newTarget);
            }
            
            if (e.target.classList.contains('rename-form')) {
                const newName = e.target.querySelector('.new-name-input').value;
                this.renameTracker(trackerId, newName);
            }

            if (e.target.classList.contains('date-form')) {
                const newStartDate = e.target.querySelector('.start-date-input').value;
                const newTargetDate = e.target.querySelector('.target-date-input').value;
                this.updateStartDate(trackerId, newStartDate || null);
                this.updateTargetDate(trackerId, newTargetDate || null);
            }
        });
    }

    loadFromLocalStorage() {
        const savedTrackers = localStorage.getItem('progressTrackers');
        
        if (savedTrackers) {
            const parsedTrackers = JSON.parse(savedTrackers);
            this.trackers = parsedTrackers.map(tracker => 
                new Tracker(tracker.id, tracker.name, tracker.currentValue, tracker.targetValue, tracker.startDate, tracker.targetDate, tracker.history)
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
        const startDate = startDateInput.value || null;
        const targetDate = targetDateInput.value || null;
        
        // Generate a unique ID using timestamp
        const id = 'tracker_' + Date.now();
        
        // Create new tracker and add to the collection
        const newTracker = new Tracker(id, name, currentValue, targetValue, startDate, targetDate);
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

    updateTrackerTarget(trackerId, newTarget) {
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        if (tracker) {
            tracker.targetValue = parseFloat(newTarget);
            this.saveToLocalStorage();
            this.renderTrackers();
        }
    }
    
    updateStartDate(trackerId, newStartDate) {
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        if (tracker) {
            tracker.startDate = newStartDate;
            this.saveToLocalStorage();
            this.renderTrackers();
        }
    }
    
    updateTargetDate(trackerId, newTargetDate) {
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        if (tracker) {
            tracker.targetDate = newTargetDate;
            this.saveToLocalStorage();
            this.renderTrackers();
        }
    }

    renameTracker(trackerId, newName) {
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        if (tracker) {
            tracker.name = newName.trim();
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

    showUpdateTargetForm(trackerId) {
        const card = trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        // Hide other forms that might be open
        card.querySelectorAll('.update-form, .history-list').forEach(el => el.classList.add('hidden'));
        
        const updateTargetForm = card.querySelector('.update-target-form');
        updateTargetForm.classList.remove('hidden');
        const targetInput = updateTargetForm.querySelector('.new-target-input');
        targetInput.value = tracker.targetValue;
        targetInput.focus();
    }
    
    showRenameForm(trackerId) {
        const card = trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        // Hide other forms that might be open
        card.querySelectorAll('.update-form, .history-list').forEach(el => el.classList.add('hidden'));
        
        const renameForm = card.querySelector('.rename-form');
        renameForm.classList.remove('hidden');
        const nameInput = renameForm.querySelector('.new-name-input');
        nameInput.value = tracker.name;
        nameInput.focus();
    }

    showDateForm(trackerId) {
        const card = trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        // Hide other forms that might be open
        card.querySelectorAll('.update-form, .history-list').forEach(el => el.classList.add('hidden'));
        
        const dateForm = card.querySelector('.date-form');
        dateForm.classList.remove('hidden');
        
        // Set current values
        const startDateField = dateForm.querySelector('.start-date-input');
        const targetDateField = dateForm.querySelector('.target-date-input');
        
        if (tracker.startDate) {
            startDateField.value = tracker.startDate;
        }
        if (tracker.targetDate) {
            targetDateField.value = tracker.targetDate;
        }
        
        startDateField.focus();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    formatDateForDisplay(dateString) {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    renderTrackers() {
        // Clear existing content
        trackersList.innerHTML = '';
        
        if (this.trackers.length === 0) {
            trackersList.innerHTML = '<p class="no-trackers-message">No trackers yet. Use the menu in the top right to create a new tracker.</p>';
            return;
        }
        
        // Sort trackers by name
        const sortedTrackers = [...this.trackers].sort((a, b) => a.name.localeCompare(b.name));
        
        // Create tracker card for each tracker
        sortedTrackers.forEach(tracker => {
            const progress = tracker.getProgress();
            const progressStatus = tracker.getProgressStatus();
            
            // Create history HTML
            let historyHTML = '';
            tracker.history.slice().reverse().forEach(entry => {
                historyHTML += `<div class="history-entry">
                    ${this.formatDate(entry.date)}: ${entry.value}
                </div>`;
            });
            
            // Create dates display
            const startDateDisplay = this.formatDateForDisplay(tracker.startDate);
            const targetDateDisplay = this.formatDateForDisplay(tracker.targetDate);
            const datesHTML = tracker.startDate || tracker.targetDate ? 
                `<div class="tracker-dates">
                    <span>Start: ${startDateDisplay}</span>
                    <span>Target: ${targetDateDisplay}</span>
                </div>` : '';
            
            // Progress status message
            let statusMessage = '';
            if (tracker.startDate && tracker.targetDate) {
                const expectedProgress = tracker.getExpectedProgress();
                if (expectedProgress !== null) {
                    const difference = progress - expectedProgress;
                    if (difference < -5) {
                        statusMessage = `<div class="status-message behind">Behind schedule by ${Math.abs(difference).toFixed(1)}%</div>`;
                    } else if (difference < 0) {
                        statusMessage = `<div class="status-message slightly-behind">Slightly behind by ${Math.abs(difference).toFixed(1)}%</div>`;
                    } else {
                        statusMessage = `<div class="status-message ahead">On track or ahead by ${difference.toFixed(1)}%</div>`;
                    }
                }
            }
            
            // Create tracker card
            const trackerHTML = `
                <div class="tracker-card" data-id="${tracker.id}">
                    <div class="tracker-header">
                        <h3 class="tracker-title">${tracker.name}</h3>
                        <div class="tracker-menu-container">
                            <button class="tracker-menu-button" aria-label="Tracker Menu">
                                <span class="dot"></span>
                                <span class="dot"></span>
                                <span class="dot"></span>
                            </button>
                            <div class="tracker-menu-dropdown hidden" data-id="${tracker.id}">
                                <button class="tracker-menu-item" data-action="update-dates">Set Dates</button>
                                <button class="tracker-menu-item" data-action="show-history">Show History</button>
                                <button class="tracker-menu-item" data-action="update-target">Update Target</button>
                                <button class="tracker-menu-item" data-action="rename">Rename</button>
                                <button class="tracker-menu-item tracker-menu-item-danger" data-action="delete">Delete Tracker</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar ${progressStatus}" style="width: ${progress}%">
                            ${Math.round(progress)}%
                        </div>
                    </div>
                    ${statusMessage}
                    
                    <div class="tracker-values">
                        <span>Current: ${tracker.currentValue}</span>
                        <span>Target: ${tracker.targetValue}</span>
                    </div>
                    
                    ${datesHTML}
                    
                    <div class="tracker-actions">
                        <button class="btn btn-update">Update Value</button>
                    </div>
                    
                    <form class="update-form update-value-form hidden">
                        <div class="form-group">
                            <label>New Value:</label>
                            <input type="number" class="new-value-input" min="0" required>
                        </div>
                        <button type="submit" class="btn">Save</button>
                    </form>
                    
                    <form class="update-form update-target-form hidden">
                        <div class="form-group">
                            <label>New Target:</label>
                            <input type="number" class="new-target-input" min="1" required>
                        </div>
                        <button type="submit" class="btn">Save</button>
                    </form>
                    
                    <form class="update-form rename-form hidden">
                        <div class="form-group">
                            <label>New Name:</label>
                            <input type="text" class="new-name-input" required>
                        </div>
                        <button type="submit" class="btn">Save</button>
                    </form>
                    
                    <form class="update-form date-form hidden">
                        <div class="form-group">
                            <label>Start Date:</label>
                            <input type="date" class="start-date-input">
                        </div>
                        <div class="form-group">
                            <label>Target Date:</label>
                            <input type="date" class="target-date-input">
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