// Progress Tracker App - Main JavaScript File

// Store DOM elements
const newTrackerForm = document.getElementById('new-tracker-form');
const trackerNameInput = document.getElementById('tracker-name');
const currentValueInput = document.getElementById('current-value');
const targetValueInput = document.getElementById('target-value');
const trackersList = document.getElementById('trackers-list');
const menuButton = document.getElementById('menu-button');
const menuDropdown = document.getElementById('menu-dropdown');
const createTrackerButton = document.getElementById('create-tracker-button');
const createTrackerModal = document.getElementById('create-tracker-modal');
const closeModalButton = document.getElementById('close-modal-button');

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

    updateTrackerTarget(trackerId, newTarget) {
        const tracker = this.trackers.find(t => t.id === trackerId);
        
        if (tracker) {
            tracker.targetValue = parseFloat(newTarget);
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
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
                        <div class="tracker-menu-container">
                            <button class="tracker-menu-button" aria-label="Tracker Menu">
                                <span class="dot"></span>
                                <span class="dot"></span>
                                <span class="dot"></span>
                            </button>
                            <div class="tracker-menu-dropdown hidden" data-id="${tracker.id}">
                                <button class="tracker-menu-item" data-action="show-history">Show History</button>
                                <button class="tracker-menu-item" data-action="update-target">Update Target</button>
                                <button class="tracker-menu-item" data-action="rename">Rename</button>
                                <button class="tracker-menu-item tracker-menu-item-danger" data-action="delete">Delete Tracker</button>
                            </div>
                        </div>
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