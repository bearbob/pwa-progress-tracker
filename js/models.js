// Tracker Model

class Tracker {
    constructor(id, name, currentValue, targetValue, startDate = null, targetDate = null, history = [], type = 'progress') {
        this.id = id;
        this.name = name;
        this.currentValue = parseFloat(currentValue);
        this.targetValue = targetValue ? parseFloat(targetValue) : null;
        this.startDate = startDate;
        this.targetDate = targetDate;
        this.history = history.length > 0 ? history : [{
            date: new Date().toISOString(),
            value: this.currentValue
        }];
        this.type = type;
    }

    getProgress() {
        if (this.type === 'tally') return 0;
        return (this.currentValue / this.targetValue) * 100;
    }
    
    getExpectedProgress() {
        if (this.type === 'tally') return null;
        
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
        if (this.type === 'tally') return "on-track";
        
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

// Export the Tracker class
export { Tracker };