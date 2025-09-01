// Enhanced Kayak Fishing Intelligence Dashboard - Main Application
class FishingDashboard {
    constructor() {
        this.currentLocation = 'pillar_point_harbor';
        this.currentSpecies = 'rockfish';
        this.lastUpdate = null;
        this.charts = {};
        this.forecastData = [];
        this.selectedWindow = null;
        this.currentDay = 0;
        
        // Location data
        this.locations = {
            pillar_point_harbor: {
                name: "Pillar Point Harbor, Half Moon Bay",
                lat: 37.5022,
                lon: -122.4817,
                species: ["Rockfish", "Lingcod", "Salmon", "Halibut"]
            },
            pigeon_point: {
                name: "Pigeon Point",
                lat: 37.18,
                lon: -122.39,
                species: ["Rockfish", "Lingcod", "Abalone"]
            },
            pescadero: {
                name: "Pescadero",
                lat: 37.255,
                lon: -122.409,
                species: ["Surf Perch", "Striped Bass", "Rockfish"]
            },
            santa_cruz: {
                name: "Santa Cruz",
                lat: 36.9741,
                lon: -122.0308,
                species: ["Salmon", "Rockfish", "Lingcod", "Halibut"]
            }
        };

        // Enhanced species-specific weights with wind sensitivity
        this.speciesWeights = {
            rockfish: {
                weather: 0.30,
                tide: 0.30,
                solunar: 0.15,
                water: 0.15,
                wind: 0.10,
                optimalWaterTemp: [50, 60],
                windSensitivity: 'moderate'
            },
            lingcod: {
                weather: 0.25,
                tide: 0.35,
                solunar: 0.15,
                water: 0.15,
                wind: 0.10,
                optimalWaterTemp: [48, 58],
                windSensitivity: 'high'
            },
            salmon: {
                weather: 0.25,
                tide: 0.20,
                solunar: 0.30,
                water: 0.15,
                wind: 0.10,
                optimalWaterTemp: [52, 62],
                windSensitivity: 'moderate'
            }
        };

        // Enhanced wind penalty thresholds
        this.windThresholds = {
            safe: 7,
            poor: 10,
            penaltyModerate: 0.8,
            penaltySevere: 0.4
        };
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        this.setupEventListeners();
        this.updateCurrentTime();
        this.updateLocationInfo();
        this.generateContinuous72HourForecast();
        this.updateDashboard();
        
        setTimeout(() => {
            this.initializeEnhancedCharts();
        }, 100);
        
        // Update every 5 minutes
        setInterval(() => {
            this.updateCurrentTime();
            this.generateContinuous72HourForecast();
            this.updateDashboard();
        }, 300000);
        
        // Update time every second
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    setupEventListeners() {
        // Location selector - Fixed
        const locationSelector = document.getElementById('location-selector');
        if (locationSelector) {
            locationSelector.addEventListener('change', (e) => {
                this.currentLocation = e.target.value;
                this.updateLocationInfo();
                this.generateContinuous72HourForecast();
                this.updateDashboard();
                this.updateCharts();
            });
        }

        // Species selector
        const speciesButtons = document.querySelectorAll('.species-btn');
        speciesButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                speciesButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSpecies = e.target.dataset.species;
                this.updateBiteScore();
                this.updateForecast();
                this.updateBestTimes();
                if (this.selectedWindow) {
                    this.updateDetailedView();
                }
            });
        });

        // Day tabs for forecast
        const dayTabs = document.querySelectorAll('.day-tab');
        dayTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                dayTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentDay = parseInt(e.target.dataset.day);
                this.updateForecast();
            });
        });

        // Update data button
        const updateBtn = document.getElementById('update-data-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                this.updateData();
            });
        }

        // Export CSV button
        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportEnhancedCSV();
            });
        }

        // Close detailed view
        const closeDetailedView = document.getElementById('close-detailed-view');
        if (closeDetailedView) {
            closeDetailedView.addEventListener('click', () => {
                this.hideDetailedView();
            });
        }

        // Help modal
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeBtn = document.getElementById('close-modal');
        
        if (helpBtn && helpModal) {
            helpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                helpModal.classList.remove('hidden');
            });
        }
        
        if (closeBtn && helpModal) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                helpModal.classList.add('hidden');
            });
        }
        
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.classList.add('hidden');
                }
            });
        }
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    updateLocationInfo() {
        const location = this.locations[this.currentLocation];
        const coordsElement = document.getElementById('current-coordinates');
        
        if (coordsElement && location) {
            coordsElement.textContent = 
                `${location.lat.toFixed(4)}°N, ${Math.abs(location.lon).toFixed(4)}°W`;
        }
    }

    generateContinuous72HourForecast() {
        this.forecastData = [];
        const now = new Date();
        
        // Generate exactly 72 continuous hours from current time
        for (let i = 0; i < 72; i++) {
            const time = new Date(now.getTime() + i * 60 * 60 * 1000);
            const conditions = this.generateConditionsForTime(time);
            this.forecastData.push({
                time: time,
                ...conditions
            });
        }
    }

    generateConditionsForTime(time) {
        const hour = time.getHours();
        const dayOfYear = Math.floor((time - new Date(time.getFullYear(), 0, 0)) / 86400000);
        
        // Simulate realistic California coastal conditions
        const baseTemp = 58 + Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI) * 8;
        const tempVariation = Math.sin(hour / 24 * 2 * Math.PI) * 5;
        
        return {
            airTemp: Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 4),
            waterTemp: Math.round(baseTemp - 3 + (Math.random() - 0.5) * 2),
            windSpeed: Math.round(6 + Math.sin(hour / 24 * 2 * Math.PI) * 8 + Math.random() * 12),
            windDirection: Math.round(270 + Math.sin(time.getTime() / 86400000) * 60),
            pressure: 29.8 + Math.sin(time.getTime() / 86400000 / 2) * 0.4 + (Math.random() - 0.5) * 0.2,
            waveHeight: Math.round((2 + Math.sin(time.getTime() / 86400000) * 2 + Math.random() * 2) * 10) / 10,
            wavePeriod: Math.round(8 + Math.random() * 6),
            tideHeight: this.calculateTideHeight(time),
            cloudCover: Math.round(Math.random() * 100),
            precipitation: Math.random() < 0.15 ? Math.round(Math.random() * 20) : 0
        };
    }

    calculateTideHeight(time) {
        const hours = time.getHours() + time.getMinutes() / 60;
        const tidePhase = (hours / 12) * Math.PI;
        return Math.round((3 + Math.sin(tidePhase) * 2.5) * 10) / 10;
    }

    calculateEnhancedBiteScore(conditions, species = this.currentSpecies) {
        const weights = this.speciesWeights[species];
        
        // Calculate base scores
        const weatherScore = this.calculateWeatherScore(conditions);
        const tideScore = this.calculateTideScore(conditions, conditions.time);
        const solunarScore = this.calculateSolunarScore(conditions.time);
        const waterScore = this.calculateWaterScore(conditions, species);
        const windScore = this.calculateEnhancedWindScore(conditions, species);
        
        // Apply enhanced wind penalties
        let totalScore = Math.round(
            weatherScore * weights.weather +
            tideScore * weights.tide +
            solunarScore * weights.solunar +
            waterScore * weights.water +
            windScore * weights.wind
        );

        // Enhanced wind penalty system
        const windPenalty = this.getWindPenalty(conditions.windSpeed, species);
        totalScore = Math.round(totalScore * windPenalty.multiplier);
        
        return {
            score: Math.max(0, Math.min(100, totalScore)),
            breakdown: {
                weather: Math.round(weatherScore * weights.weather),
                tide: Math.round(tideScore * weights.tide),
                solunar: Math.round(solunarScore * weights.solunar),
                water: Math.round(waterScore * weights.water),
                wind: Math.round(windScore * weights.wind),
                windPenalty: windPenalty
            }
        };
    }

    getWindPenalty(windSpeed, species) {
        const sensitivity = this.speciesWeights[species].windSensitivity;
        let multiplier = 1.0;
        let status = 'good';
        let description = 'No wind penalty';

        if (windSpeed > this.windThresholds.poor) {
            // Strong penalty for winds > 10 knots
            multiplier = this.windThresholds.penaltySevere;
            if (sensitivity === 'high') multiplier *= 0.8; // Extra penalty for sensitive species
            status = 'poor';
            description = `Severe wind penalty (${windSpeed} knots)`;
        } else if (windSpeed > this.windThresholds.safe) {
            // Moderate penalty for winds 7-10 knots
            multiplier = this.windThresholds.penaltyModerate;
            if (sensitivity === 'high') multiplier *= 0.9;
            status = 'moderate';
            description = `Moderate wind penalty (${windSpeed} knots)`;
        }

        return { multiplier, status, description, windSpeed };
    }

    calculateEnhancedWindScore(conditions, species) {
        let score = 50;
        
        // Base wind scoring
        if (conditions.windSpeed >= 5 && conditions.windSpeed <= 7) {
            score += 50; // Optimal range
        } else if (conditions.windSpeed <= 5) {
            score += 30; // Light winds
        } else if (conditions.windSpeed <= 10) {
            score += 10; // Getting challenging
        } else {
            score -= (conditions.windSpeed - 10) * 10; // Increasingly dangerous
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateWeatherScore(conditions) {
        let score = 50;
        
        // Barometric pressure (stable pressure is better)
        if (conditions.pressure >= 29.8 && conditions.pressure <= 30.2) {
            score += 30;
        } else if (conditions.pressure >= 29.6 && conditions.pressure <= 30.4) {
            score += 20;
        } else {
            score += 10;
        }
        
        // Cloud cover (some clouds are good)
        if (conditions.cloudCover >= 20 && conditions.cloudCover <= 60) {
            score += 15;
        } else if (conditions.cloudCover <= 20 || conditions.cloudCover >= 80) {
            score += 5;
        } else {
            score += 10;
        }
        
        // Precipitation (bad for fishing)
        if (conditions.precipitation === 0) {
            score += 5;
        } else {
            score -= conditions.precipitation * 2;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateTideScore(conditions, time) {
        const hour = time.getHours() + time.getMinutes() / 60;
        const tidePhase = (hour / 12) * 2 * Math.PI;
        
        const tideChangePhase = Math.sin(tidePhase);
        const timeToChange = Math.abs(tideChangePhase);
        
        let score = 30;
        
        if (timeToChange >= 0.7) {
            score += 50; // Near tide change
        } else if (timeToChange >= 0.4) {
            score += 30; // Moderate tide movement
        } else {
            score += 10; // Slack tide
        }
        
        if (conditions.tideHeight >= 2 && conditions.tideHeight <= 5) {
            score += 20;
        } else {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateSolunarScore(time) {
        const hour = time.getHours() + time.getMinutes() / 60;
        
        const majorPeriods = [6.5, 18.5]; // Dawn and dusk
        const minorPeriods = [0.5, 12.5]; // Midnight and noon
        
        let score = 20;
        
        for (let major of majorPeriods) {
            const distance = Math.abs(hour - major);
            if (distance <= 1) {
                score += 60 * (1 - distance);
            } else if (distance <= 2) {
                score += 30 * (2 - distance);
            }
        }
        
        for (let minor of minorPeriods) {
            const distance = Math.abs(hour - minor);
            if (distance <= 1) {
                score += 30 * (1 - distance);
            }
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateWaterScore(conditions, species) {
        const optimalRange = this.speciesWeights[species].optimalWaterTemp;
        let score = 30;
        
        if (conditions.waterTemp >= optimalRange[0] && conditions.waterTemp <= optimalRange[1]) {
            score += 50;
        } else {
            const distance = Math.min(
                Math.abs(conditions.waterTemp - optimalRange[0]),
                Math.abs(conditions.waterTemp - optimalRange[1])
            );
            score += Math.max(0, 30 - distance * 5);
        }
        
        if (conditions.waveHeight <= 3) {
            score += 20;
        } else if (conditions.waveHeight <= 5) {
            score += 10;
        } else {
            score -= 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    updateDashboard() {
        this.updateCurrentConditions();
        this.updateBiteScore();
        this.updateForecast();
        this.updateEnhancedBestTimes();
        this.updateSolunarInfo();
        this.lastUpdate = new Date();
        this.updateLastUpdatedTime();
        
        if (Object.keys(this.charts).length > 0) {
            this.updateCharts();
        }
    }

    updateCurrentConditions() {
        const current = this.forecastData[0];
        if (!current) return;
        
        const elements = {
            'current-temp': `${current.airTemp}°F`,
            'current-pressure': `${current.pressure.toFixed(2)} inHg`,
            'current-waves': `${current.waveHeight} ft`,
            'current-water-temp': `${current.waterTemp}°F`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Enhanced wind display with color coding - FIXED
        const windElement = document.getElementById('current-wind');
        if (windElement) {
            windElement.textContent = `${current.windSpeed} knots`;
            // Remove all wind classes first
            windElement.className = windElement.className.replace(/wind-\w+/g, '').trim();
            windElement.classList.add('wind-indicator');
            
            if (current.windSpeed <= this.windThresholds.safe) {
                windElement.classList.add('wind-good');
            } else if (current.windSpeed <= this.windThresholds.poor) {
                windElement.classList.add('wind-moderate');
            } else {
                windElement.classList.add('wind-poor');
            }
        }
        
        // Tide status
        const tideStatus = current.tideHeight > 4 ? 'High' : current.tideHeight < 2 ? 'Low' : 'Mid';
        const tideElement = document.getElementById('current-tide');
        if (tideElement) {
            tideElement.textContent = `${tideStatus} (${current.tideHeight}ft)`;
        }
        
        this.updateSafetyStatus(current);
        this.updateOverallCondition(current);
    }

    updateOverallCondition(conditions) {
        const scoreResult = this.calculateEnhancedBiteScore(conditions);
        const windPenalty = scoreResult.breakdown.windPenalty;
        
        const statusElement = document.getElementById('condition-status');
        const factorsElement = document.getElementById('condition-factors');
        
        if (!statusElement || !factorsElement) return;
        
        let conditionClass = 'good';
        let conditionText = 'Good';
        
        // Determine overall condition with wind penalty consideration
        if (windPenalty.status === 'poor' || scoreResult.score < 40) {
            conditionClass = 'poor';
            conditionText = 'Poor';
        } else if (windPenalty.status === 'moderate' || scoreResult.score < 60) {
            conditionClass = 'moderate';
            conditionText = 'Moderate';
        }
        
        statusElement.className = `condition-status ${conditionClass}`;
        statusElement.textContent = conditionText;
        
        // Show factors affecting condition
        const factors = [];
        if (windPenalty.status !== 'good') {
            factors.push(`<span class="wind-penalty">${windPenalty.description}</span>`);
        }
        if (conditions.waveHeight > 4) {
            factors.push('High wave conditions');
        }
        if (conditions.precipitation > 0) {
            factors.push('Precipitation present');
        }
        
        factorsElement.innerHTML = factors.length > 0 ? 
            factors.join(', ') : 'All factors favorable';
    }

    updateSafetyStatus(conditions) {
        const indicator = document.getElementById('safety-indicator');
        const text = document.getElementById('safety-text');
        
        if (!indicator || !text) return;
        
        let status = 'good';
        let message = 'Conditions Good';
        
        if (conditions.windSpeed > 25 || conditions.waveHeight > 6) {
            status = 'danger';
            message = 'Dangerous Conditions';
        } else if (conditions.windSpeed > 15 || conditions.waveHeight > 4) {
            status = 'caution';
            message = 'Use Caution';
        }
        
        indicator.className = `safety-indicator ${status}`;
        text.textContent = message;
    }

    updateBiteScore() {
        const current = this.forecastData[0];
        if (!current) return;
        
        const scoreResult = this.calculateEnhancedBiteScore(current);
        const score = scoreResult.score;
        const scoreElement = document.getElementById('bite-score');
        const circleElement = scoreElement?.closest('.score-circle');
        const labelElement = document.getElementById('score-label');
        const trendElement = document.getElementById('score-trend');
        
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        
        if (circleElement) {
            circleElement.className = 'score-circle';
            if (score >= 75) {
                circleElement.classList.add('excellent');
                if (labelElement) labelElement.textContent = 'Excellent';
            } else if (score >= 50) {
                circleElement.classList.add('good');
                if (labelElement) labelElement.textContent = 'Good';
            } else {
                circleElement.classList.add('poor');
                if (labelElement) labelElement.textContent = 'Poor';
            }
        }
        
        // Calculate trend
        if (this.forecastData.length > 1 && trendElement) {
            const nextResult = this.calculateEnhancedBiteScore(this.forecastData[1]);
            const trend = nextResult.score - score;
            
            trendElement.className = 'score-trend';
            if (trend > 2) {
                trendElement.textContent = '▲';
                trendElement.classList.add('up');
            } else if (trend < -2) {
                trendElement.textContent = '▼';
                trendElement.classList.add('down');
            } else {
                trendElement.textContent = '▶';
            }
        }
    }

    updateForecast() {
        const container = document.getElementById('forecast-rows');
        if (!container) return;
        
        container.innerHTML = '';
        
        const startIndex = this.currentDay * 24;
        const endIndex = Math.min(startIndex + 24, this.forecastData.length);
        const dayData = this.forecastData.slice(startIndex, endIndex);
        
        dayData.forEach((data, index) => {
            const scoreResult = this.calculateEnhancedBiteScore(data);
            const row = this.createForecastRow(data, scoreResult, startIndex + index);
            container.appendChild(row);
        });
    }

    createForecastRow(data, scoreResult, index) {
        const row = document.createElement('div');
        row.className = 'forecast-row';
        row.dataset.index = index;
        
        const timeStr = data.time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const score = scoreResult.score;
        const scoreClass = score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'poor';
        const tideSymbol = data.tideHeight > 4 ? 'H' : data.tideHeight < 2 ? 'L' : 'M';
        
        if (score >= 70) {
            row.classList.add('highlight');
        }
        
        row.innerHTML = `
            <span>${timeStr}</span>
            <span class="forecast-score ${scoreClass}">${score}</span>
            <span>${data.airTemp}°F ${this.getWeatherIcon(data)}</span>
            <span>${tideSymbol}${data.tideHeight}</span>
            <span class="wind-indicator wind-${this.getWindClass(data.windSpeed)}">${data.windSpeed}kt</span>
            <span>${data.waveHeight}ft</span>
        `;
        
        // Make row clickable to show details
        row.addEventListener('click', () => {
            this.selectTimeWindow(data, scoreResult);
        });
        
        return row;
    }

    getWindClass(windSpeed) {
        if (windSpeed <= this.windThresholds.safe) return 'good';
        if (windSpeed <= this.windThresholds.poor) return 'moderate';
        return 'poor';
    }

    getWeatherIcon(conditions) {
        if (conditions.precipitation > 0) return '🌧️';
        if (conditions.cloudCover > 70) return '☁️';
        if (conditions.cloudCover > 30) return '⛅';
        return '☀️';
    }

    updateEnhancedBestTimes() {
        const today = this.forecastData.slice(0, 24);
        const tomorrow = this.forecastData.slice(24, 48);
        
        const todayBest = this.findEnhancedBestWindows(today, 'today');
        const tomorrowBest = this.findEnhancedBestWindows(tomorrow, 'tomorrow');
        
        this.renderEnhancedBestTimes('best-times-list', todayBest);
        this.renderEnhancedBestTimes('tomorrow-times-list', tomorrowBest);
    }

    findEnhancedBestWindows(data, dayLabel) {
        const windows = [];
        
        for (let i = 0; i < data.length - 1; i++) {
            const scoreResult = this.calculateEnhancedBiteScore(data[i]);
            if (scoreResult.score >= 60) {
                // Find continuous good periods
                let endIndex = i;
                while (endIndex < data.length - 1) {
                    const nextScore = this.calculateEnhancedBiteScore(data[endIndex + 1]);
                    if (nextScore.score >= 50) {
                        endIndex++;
                    } else {
                        break;
                    }
                }
                
                const windowScores = data.slice(i, endIndex + 1).map(d => this.calculateEnhancedBiteScore(d));
                const maxScore = Math.max(...windowScores.map(s => s.score));
                
                windows.push({
                    start: data[i].time,
                    end: data[endIndex].time,
                    score: maxScore,
                    scoreResult: windowScores[windowScores.findIndex(s => s.score === maxScore)],
                    reason: this.getBestTimeReason(data[i], windowScores[0]),
                    data: data.slice(i, endIndex + 1),
                    dayLabel: dayLabel
                });
                
                i = endIndex;
            }
        }
        
        return windows.sort((a, b) => {
            // Sort by time (chronological order)
            return a.start.getTime() - b.start.getTime();
        }).slice(0, 4); // Show top 4 windows per day
    }

    getBestTimeReason(data, scoreResult) {
        const reasons = [];
        const breakdown = scoreResult.breakdown;
        
        if (breakdown.weather > 20) reasons.push('stable pressure');
        if (breakdown.solunar > 15) reasons.push('prime solunar time');
        if (breakdown.tide > 20) reasons.push('active tide');
        if (breakdown.windPenalty.status === 'good') reasons.push('optimal wind');
        if (breakdown.water > 12) reasons.push('good water conditions');
        
        return reasons.length > 0 ? reasons.join(' + ') : 'favorable conditions';
    }

    renderEnhancedBestTimes(containerId, windows) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        windows.forEach(window => {
            const item = document.createElement('div');
            item.className = 'best-time-item clickable';
            
            const startTime = window.start.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            const endTime = window.end.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            const scoreClass = window.score >= 75 ? 'excellent' : 'good';
            
            item.innerHTML = `
                <div class="best-time-header">
                    <span class="best-time-period">${startTime} - ${endTime}</span>
                    <span class="best-time-score ${scoreClass}">${window.score}</span>
                </div>
                <div class="best-time-reason">${window.reason}</div>
            `;
            
            // Make clickable to show detailed view - FIXED
            item.addEventListener('click', () => {
                this.selectTimeWindow(window.data[0], window.scoreResult, window);
                this.highlightSelectedWindow(item);
            });
            
            container.appendChild(item);
        });
    }

    selectTimeWindow(data, scoreResult, window = null) {
        this.selectedWindow = { data, scoreResult, window };
        this.showDetailedView();
    }

    showDetailedView() {
        const panel = document.getElementById('detailed-view-panel');
        if (!panel || !this.selectedWindow) return;
        
        panel.classList.remove('hidden');
        panel.classList.add('fade-in');
        this.updateDetailedView();
    }

    hideDetailedView() {
        const panel = document.getElementById('detailed-view-panel');
        if (!panel) return;
        
        panel.classList.add('hidden');
        this.selectedWindow = null;
        this.clearSelectedHighlights();
    }

    updateDetailedView() {
        if (!this.selectedWindow) return;
        
        const { data, scoreResult, window } = this.selectedWindow;
        
        // Update time range
        const timeRangeElement = document.getElementById('selected-time-range');
        if (timeRangeElement) {
            if (window) {
                const startTime = window.start.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                const endTime = window.end.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                timeRangeElement.textContent = `${startTime} - ${endTime}`;
            } else {
                const timeStr = data.time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                timeRangeElement.textContent = timeStr;
            }
        }
        
        // Update score
        const scoreElement = document.getElementById('selected-score');
        if (scoreElement) {
            const score = scoreResult.score;
            const scoreClass = score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'poor';
            scoreElement.className = `selected-score ${scoreClass}`;
            scoreElement.textContent = `Score: ${score}`;
        }
        
        // Update scoring breakdown
        this.updateScoringBreakdown(scoreResult.breakdown);
        
        // Update recommendations
        this.updateRecommendations(data, scoreResult);
    }

    updateScoringBreakdown(breakdown) {
        const container = document.getElementById('scoring-breakdown');
        if (!container) return;
        
        container.innerHTML = `
            <h4>Scoring Breakdown:</h4>
            <div class="breakdown-item">
                <span>Weather Conditions:</span>
                <span>${breakdown.weather} pts</span>
            </div>
            <div class="breakdown-item">
                <span>Tide Activity:</span>
                <span>${breakdown.tide} pts</span>
            </div>
            <div class="breakdown-item">
                <span>Solunar Influence:</span>
                <span>${breakdown.solunar} pts</span>
            </div>
            <div class="breakdown-item">
                <span>Water Conditions:</span>
                <span>${breakdown.water} pts</span>
            </div>
            <div class="breakdown-item">
                <span>Wind Safety:</span>
                <span>${breakdown.wind} pts</span>
            </div>
            ${breakdown.windPenalty.status !== 'good' ? `
                <div class="breakdown-item wind-penalty">
                    <span>Wind Penalty:</span>
                    <span>${breakdown.windPenalty.description}</span>
                </div>
            ` : ''}
        `;
    }

    updateRecommendations(data, scoreResult) {
        const container = document.getElementById('recommendations');
        if (!container) return;
        
        const recommendations = [];
        const breakdown = scoreResult.breakdown;
        
        if (breakdown.windPenalty.status === 'poor') {
            recommendations.push('Consider postponing trip due to high winds');
            recommendations.push('If fishing, stay close to protected areas');
        } else if (breakdown.windPenalty.status === 'moderate') {
            recommendations.push('Use caution with wind conditions');
            recommendations.push('Consider lighter tackle and closer-to-shore fishing');
        }
        
        if (breakdown.tide > 20) {
            recommendations.push('Excellent tide conditions - focus on structure and drop-offs');
        }
        
        if (breakdown.solunar > 15) {
            recommendations.push('Prime solunar activity - fish should be actively feeding');
        }
        
        if (data.waveHeight <= 2) {
            recommendations.push('Calm sea conditions ideal for kayak fishing');
        } else if (data.waveHeight > 4) {
            recommendations.push('Rough seas - experienced kayakers only');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Standard fishing conditions apply');
            recommendations.push('Use normal tackle and techniques for target species');
        }
        
        container.innerHTML = `
            <h4>Recommendations:</h4>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }

    highlightSelectedWindow(element) {
        // Clear previous selections
        this.clearSelectedHighlights();
        
        // Add selection to clicked element
        element.classList.add('selected');
    }

    clearSelectedHighlights() {
        document.querySelectorAll('.best-time-item.selected, .time-period.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    updateSolunarInfo() {
        const now = new Date();
        
        // Mock moon phase data
        const moonPhases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
        const phaseNames = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                           'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
        
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        const moonPhaseIndex = Math.floor((dayOfYear % 29.5) / 29.5 * 8);
        
        const phaseIcon = document.getElementById('moon-phase-icon');
        const phaseText = document.getElementById('moon-phase-text');
        
        if (phaseIcon) phaseIcon.textContent = moonPhases[moonPhaseIndex];
        if (phaseText) phaseText.textContent = phaseNames[moonPhaseIndex];
        
        // Enhanced solunar periods with clickable functionality - FIXED
        this.renderClickableSolunarPeriods();
        
        // Sun times
        const sunriseElement = document.getElementById('sunrise-time');
        const sunsetElement = document.getElementById('sunset-time');
        
        if (sunriseElement) sunriseElement.textContent = '6:45 AM';
        if (sunsetElement) sunsetElement.textContent = '7:20 PM';
    }

    renderClickableSolunarPeriods() {
        const majorPeriods = [
            { start: '6:30 AM', end: '8:30 AM', type: 'major' },
            { start: '6:30 PM', end: '8:30 PM', type: 'major' }
        ];
        const minorPeriods = [
            { start: '12:30 AM', end: '1:30 AM', type: 'minor' },
            { start: '12:30 PM', end: '1:30 PM', type: 'minor' }
        ];
        
        const majorElement = document.getElementById('major-periods');
        const minorElement = document.getElementById('minor-periods');
        
        if (majorElement) {
            majorElement.innerHTML = majorPeriods.map(period => 
                `<div class="time-period clickable" data-period="${period.start}-${period.end}" data-type="${period.type}">${period.start} - ${period.end}</div>`
            ).join('');
            
            // Add click handlers - FIXED
            majorElement.querySelectorAll('.time-period').forEach(el => {
                el.addEventListener('click', () => {
                    this.selectSolunarPeriod(el, el.dataset.period, el.dataset.type);
                });
            });
        }
        
        if (minorElement) {
            minorElement.innerHTML = minorPeriods.map(period => 
                `<div class="time-period clickable" data-period="${period.start}-${period.end}" data-type="${period.type}">${period.start} - ${period.end}</div>`
            ).join('');
            
            // Add click handlers - FIXED
            minorElement.querySelectorAll('.time-period').forEach(el => {
                el.addEventListener('click', () => {
                    this.selectSolunarPeriod(el, el.dataset.period, el.dataset.type);
                });
            });
        }
    }

    selectSolunarPeriod(element, period, type) {
        // Create enhanced mock data for solunar period
        const now = new Date();
        const mockData = this.generateConditionsForTime(now);
        
        // Enhance solunar score for the selected period
        let enhancedMockData = { ...mockData };
        if (type === 'major') {
            enhancedMockData.solunarBonus = 40; // Major period bonus
        } else {
            enhancedMockData.solunarBonus = 20; // Minor period bonus
        }
        
        const scoreResult = this.calculateEnhancedBiteScore(enhancedMockData);
        
        // Boost solunar component for display
        scoreResult.breakdown.solunar += (enhancedMockData.solunarBonus || 0);
        scoreResult.score = Math.min(100, scoreResult.score + (enhancedMockData.solunarBonus || 0) * 0.3);
        
        this.selectTimeWindow(enhancedMockData, scoreResult);
        this.highlightSelectedWindow(element);
    }

    initializeEnhancedCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            return;
        }

        // Common chart configuration with enhanced axis labels
        const chartConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: true, color: 'rgba(255,255,255,0.1)' },
                    ticks: { 
                        color: '#9ca3af', 
                        font: { size: 11 },
                        maxTicksLimit: 8
                    },
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#9ca3af',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                y: {
                    grid: { display: true, color: 'rgba(255,255,255,0.1)' },
                    ticks: { 
                        color: '#9ca3af', 
                        font: { size: 11 }
                    }
                }
            }
        };

        // Tide Chart with enhanced labels - FIXED
        const tideCanvas = document.getElementById('tide-chart');
        if (tideCanvas) {
            this.charts.tide = new Chart(tideCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Tide Height (ft)',
                        data: [],
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    ...chartConfig,
                    scales: {
                        ...chartConfig.scales,
                        y: {
                            ...chartConfig.scales.y,
                            beginAtZero: true,
                            max: 8,
                            title: {
                                display: true,
                                text: 'Tide Height (ft)',
                                color: '#9ca3af',
                                font: { size: 12, weight: 'bold' }
                            }
                        }
                    }
                }
            });
        }

        // Pressure Chart - FIXED
        const pressureCanvas = document.getElementById('pressure-chart');
        if (pressureCanvas) {
            this.charts.pressure = new Chart(pressureCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Barometric Pressure (inHg)',
                        data: [],
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    ...chartConfig,
                    scales: {
                        ...chartConfig.scales,
                        y: {
                            ...chartConfig.scales.y,
                            min: 29.0,
                            max: 31.0,
                            title: {
                                display: true,
                                text: 'Barometric Pressure (inHg)',
                                color: '#9ca3af',
                                font: { size: 12, weight: 'bold' }
                            }
                        }
                    }
                }
            });
        }

        // Temperature Chart - FIXED
        const tempCanvas = document.getElementById('temperature-chart');
        if (tempCanvas) {
            this.charts.temperature = new Chart(tempCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Water Temperature (°F)',
                        data: [],
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    ...chartConfig,
                    scales: {
                        ...chartConfig.scales,
                        y: {
                            ...chartConfig.scales.y,
                            title: {
                                display: true,
                                text: 'Water Temperature (°F)',
                                color: '#9ca3af',
                                font: { size: 12, weight: 'bold' }
                            }
                        }
                    }
                }
            });
        }

        // Wind Chart with color coding - FIXED
        const windCanvas = document.getElementById('wind-chart');
        if (windCanvas) {
            this.charts.wind = new Chart(windCanvas, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Wind Speed (knots)',
                        data: [],
                        backgroundColor: (ctx) => {
                            const value = ctx.parsed?.y || 0;
                            if (value <= 7) return '#10b981'; // Good - green
                            if (value <= 10) return '#f59e0b'; // Moderate - yellow
                            return '#ef4444'; // Poor - red
                        },
                        borderRadius: 4
                    }]
                },
                options: {
                    ...chartConfig,
                    scales: {
                        ...chartConfig.scales,
                        y: {
                            ...chartConfig.scales.y,
                            beginAtZero: true,
                            max: 35,
                            title: {
                                display: true,
                                text: 'Wind Speed (knots)',
                                color: '#9ca3af',
                                font: { size: 12, weight: 'bold' }
                            }
                        }
                    }
                }
            });
        }

        this.updateCharts();
    }

    updateCharts() {
        if (Object.keys(this.charts).length === 0) return;
        
        const data24h = this.forecastData.slice(0, 24);
        const labels = data24h.map(d => d.time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }));

        if (this.charts.tide) {
            this.charts.tide.data.labels = labels;
            this.charts.tide.data.datasets[0].data = data24h.map(d => d.tideHeight);
            this.charts.tide.update('none');
        }

        if (this.charts.pressure) {
            this.charts.pressure.data.labels = labels;
            this.charts.pressure.data.datasets[0].data = data24h.map(d => d.pressure);
            this.charts.pressure.update('none');
        }

        if (this.charts.temperature) {
            this.charts.temperature.data.labels = labels;
            this.charts.temperature.data.datasets[0].data = data24h.map(d => d.waterTemp);
            this.charts.temperature.update('none');
        }

        if (this.charts.wind) {
            this.charts.wind.data.labels = labels;
            this.charts.wind.data.datasets[0].data = data24h.map(d => d.windSpeed);
            this.charts.wind.update('none');
        }
    }

    updateData() {
        const button = document.getElementById('update-data-btn');
        if (!button) return;
        
        button.classList.add('loading');
        button.textContent = 'Updating...';
        
        setTimeout(() => {
            this.generateContinuous72HourForecast();
            this.updateDashboard();
            
            button.classList.remove('loading');
            button.innerHTML = '<span>Update Data</span>';
        }, 2000);
    }

    updateLastUpdatedTime() {
        if (this.lastUpdate) {
            const timeString = this.lastUpdate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const element = document.getElementById('last-updated');
            if (element) {
                element.textContent = `Last updated: ${timeString}`;
            }
        }
    }

    exportEnhancedCSV() {
        const headers = [
            'Time', 'Bite Score', 'Air Temp', 'Water Temp', 'Wind Speed', 'Wind Status',
            'Wave Height', 'Tide Height', 'Pressure', 'Weather Score', 'Tide Score',
            'Solunar Score', 'Water Score', 'Wind Score', 'Wind Penalty'
        ];
        const rows = [headers];
        
        this.forecastData.slice(0, 72).forEach(data => {
            const scoreResult = this.calculateEnhancedBiteScore(data);
            const breakdown = scoreResult.breakdown;
            
            rows.push([
                data.time.toLocaleString(),
                scoreResult.score,
                data.airTemp,
                data.waterTemp,
                data.windSpeed,
                breakdown.windPenalty.status,
                data.waveHeight,
                data.tideHeight,
                data.pressure.toFixed(2),
                breakdown.weather,
                breakdown.tide,
                breakdown.solunar,
                breakdown.water,
                breakdown.wind,
                breakdown.windPenalty.description
            ]);
        });
        
        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-kayak-fishing-forecast-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize enhanced dashboard
const dashboard = new FishingDashboard();
dashboard.init();