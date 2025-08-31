// Kayak Fishing Intelligence Dashboard - Main Application
class FishingDashboard {
    constructor() {
        this.currentLocation = 'pillar_point_harbor';
        this.currentSpecies = 'rockfish';
        this.lastUpdate = null;
        this.charts = {};
        this.forecastData = [];
        
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

        // Species-specific weights
        this.speciesWeights = {
            rockfish: {
                weather: 0.30,
                tide: 0.30,
                solunar: 0.15,
                water: 0.15,
                wind: 0.10,
                optimalWaterTemp: [50, 60]
            },
            lingcod: {
                weather: 0.25,
                tide: 0.35,
                solunar: 0.15,
                water: 0.15,
                wind: 0.10,
                optimalWaterTemp: [48, 58]
            },
            salmon: {
                weather: 0.25,
                tide: 0.20,
                solunar: 0.30,
                water: 0.15,
                wind: 0.10,
                optimalWaterTemp: [52, 62]
            }
        };
    }

    init() {
        // Wait for DOM to be fully loaded
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
        this.generateForecastData();
        this.updateDashboard();
        
        // Initialize charts after a small delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
        
        // Update every 5 minutes
        setInterval(() => {
            this.updateCurrentTime();
            this.generateForecastData();
            this.updateDashboard();
        }, 300000);
        
        // Update time every second
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    setupEventListeners() {
        // Location selector
        const locationSelector = document.getElementById('location-selector');
        if (locationSelector) {
            locationSelector.addEventListener('change', (e) => {
                this.currentLocation = e.target.value;
                this.updateLocationInfo();
                this.generateForecastData();
                this.updateDashboard();
                this.updateCharts();
            });
        }

        // Species selector
        const speciesButtons = document.querySelectorAll('.species-btn');
        speciesButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                speciesButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update current species
                this.currentSpecies = e.target.dataset.species;
                
                // Update dashboard with new species data
                this.updateBiteScore();
                this.updateForecast();
                this.updateBestTimes();
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
                this.exportCSV();
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
            // Close modal on backdrop click
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

    generateForecastData() {
        this.forecastData = [];
        const now = new Date();
        
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
        
        // Simulate realistic conditions based on time and location
        const baseTemp = 58 + Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI) * 8;
        const tempVariation = Math.sin(hour / 24 * 2 * Math.PI) * 5;
        
        return {
            airTemp: Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 4),
            waterTemp: Math.round(baseTemp - 3 + (Math.random() - 0.5) * 2),
            windSpeed: Math.round(8 + Math.sin(hour / 24 * 2 * Math.PI) * 6 + Math.random() * 8),
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
        // Simplified tide calculation (two high/low cycles per day)
        const hours = time.getHours() + time.getMinutes() / 60;
        const tidePhase = (hours / 12) * Math.PI;
        return Math.round((3 + Math.sin(tidePhase) * 2.5) * 10) / 10;
    }

    calculateBiteScore(conditions, species = this.currentSpecies) {
        const weights = this.speciesWeights[species];
        
        // Weather score (30% base, adjusted by species)
        const weatherScore = this.calculateWeatherScore(conditions);
        
        // Tide score (25% base, adjusted by species)
        const tideScore = this.calculateTideScore(conditions, conditions.time);
        
        // Solunar score (20% base, adjusted by species)
        const solunarScore = this.calculateSolunarScore(conditions.time);
        
        // Water conditions score (15%)
        const waterScore = this.calculateWaterScore(conditions, species);
        
        // Wind safety score (10%)
        const windScore = this.calculateWindScore(conditions);
        
        const totalScore = Math.round(
            weatherScore * weights.weather +
            tideScore * weights.tide +
            solunarScore * weights.solunar +
            waterScore * weights.water +
            windScore * weights.wind
        );
        
        return Math.max(0, Math.min(100, totalScore));
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
        
        // Best fishing 2 hours before/after tide changes
        const tideChangePhase = Math.sin(tidePhase);
        const timeToChange = Math.abs(tideChangePhase);
        
        let score = 30;
        
        // Peak scoring during tide changes
        if (timeToChange >= 0.7) {
            score += 50; // Near tide change
        } else if (timeToChange >= 0.4) {
            score += 30; // Moderate tide movement
        } else {
            score += 10; // Slack tide
        }
        
        // Moderate tide heights are better
        if (conditions.tideHeight >= 2 && conditions.tideHeight <= 5) {
            score += 20;
        } else {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateSolunarScore(time) {
        const hour = time.getHours() + time.getMinutes() / 60;
        
        // Simulate major and minor periods
        const majorPeriods = [6.5, 18.5]; // Dawn and dusk
        const minorPeriods = [0.5, 12.5]; // Midnight and noon
        
        let score = 20;
        
        // Check proximity to major periods
        for (let major of majorPeriods) {
            const distance = Math.abs(hour - major);
            if (distance <= 1) {
                score += 60 * (1 - distance);
            } else if (distance <= 2) {
                score += 30 * (2 - distance);
            }
        }
        
        // Check proximity to minor periods
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
        
        // Water temperature scoring
        if (conditions.waterTemp >= optimalRange[0] && conditions.waterTemp <= optimalRange[1]) {
            score += 50;
        } else {
            const distance = Math.min(
                Math.abs(conditions.waterTemp - optimalRange[0]),
                Math.abs(conditions.waterTemp - optimalRange[1])
            );
            score += Math.max(0, 30 - distance * 5);
        }
        
        // Wave conditions (manageable waves are better)
        if (conditions.waveHeight <= 3) {
            score += 20;
        } else if (conditions.waveHeight <= 5) {
            score += 10;
        } else {
            score -= 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    calculateWindScore(conditions) {
        let score = 50;
        
        // Optimal wind speeds for kayak fishing
        if (conditions.windSpeed >= 5 && conditions.windSpeed <= 15) {
            score += 50;
        } else if (conditions.windSpeed <= 5) {
            score += 30; // Light winds
        } else if (conditions.windSpeed <= 20) {
            score += 20; // Moderate winds
        } else {
            score -= (conditions.windSpeed - 20) * 5; // Dangerous winds
        }
        
        return Math.max(0, Math.min(100, score));
    }

    updateDashboard() {
        this.updateCurrentConditions();
        this.updateBiteScore();
        this.updateForecast();
        this.updateBestTimes();
        this.updateSolunarInfo();
        this.lastUpdate = new Date();
        this.updateLastUpdatedTime();
        
        // Update charts if they exist
        if (Object.keys(this.charts).length > 0) {
            this.updateCharts();
        }
    }

    updateCurrentConditions() {
        const current = this.forecastData[0];
        if (!current) return;
        
        const elements = {
            'current-temp': `${current.airTemp}°F`,
            'current-wind': `${current.windSpeed} knots`,
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
        
        // Tide status
        const tideStatus = current.tideHeight > 4 ? 'High' : current.tideHeight < 2 ? 'Low' : 'Mid';
        const tideElement = document.getElementById('current-tide');
        if (tideElement) {
            tideElement.textContent = `${tideStatus} (${current.tideHeight}ft)`;
        }
        
        // Safety assessment
        this.updateSafetyStatus(current);
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
        } else if (conditions.windSpeed > 20 || conditions.waveHeight > 4) {
            status = 'caution';
            message = 'Use Caution';
        }
        
        indicator.className = `safety-indicator ${status}`;
        text.textContent = message;
    }

    updateBiteScore() {
        const current = this.forecastData[0];
        if (!current) return;
        
        const score = this.calculateBiteScore(current);
        const scoreElement = document.getElementById('bite-score');
        const circleElement = scoreElement?.closest('.score-circle');
        const labelElement = document.getElementById('score-label');
        const trendElement = document.getElementById('score-trend');
        
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        
        // Update score circle color
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
            const nextScore = this.calculateBiteScore(this.forecastData[1]);
            const trend = nextScore - score;
            
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
        
        this.forecastData.slice(0, 24).forEach((data, index) => {
            const score = this.calculateBiteScore(data);
            const row = this.createForecastRow(data, score, index);
            container.appendChild(row);
        });
    }

    createForecastRow(data, score, index) {
        const row = document.createElement('div');
        row.className = 'forecast-row';
        
        const timeStr = data.time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const scoreClass = score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'poor';
        const tideSymbol = data.tideHeight > 4 ? 'H' : data.tideHeight < 2 ? 'L' : 'M';
        
        // Highlight best windows
        if (score >= 70) {
            row.classList.add('highlight');
        }
        
        row.innerHTML = `
            <span>${timeStr}</span>
            <span class="forecast-score ${scoreClass}">${score}</span>
            <span>${data.airTemp}°F ${this.getWeatherIcon(data)}</span>
            <span>${tideSymbol}${data.tideHeight}</span>
            <span>${data.windSpeed}kt</span>
            <span>${data.waveHeight}ft</span>
        `;
        
        return row;
    }

    getWeatherIcon(conditions) {
        if (conditions.precipitation > 0) return '🌧️';
        if (conditions.cloudCover > 70) return '☁️';
        if (conditions.cloudCover > 30) return '⛅';
        return '☀️';
    }

    updateBestTimes() {
        const today = this.forecastData.slice(0, 24);
        const tomorrow = this.forecastData.slice(24, 48);
        
        const todayBest = this.findBestWindows(today);
        const tomorrowBest = this.findBestWindows(tomorrow);
        
        this.renderBestTimes('best-times-list', todayBest);
        this.renderBestTimes('tomorrow-times-list', tomorrowBest);
    }

    findBestWindows(data) {
        const windows = [];
        
        for (let i = 0; i < data.length - 1; i++) {
            const score = this.calculateBiteScore(data[i]);
            if (score >= 60) {
                // Find continuous good periods
                let endIndex = i;
                while (endIndex < data.length - 1 && this.calculateBiteScore(data[endIndex + 1]) >= 50) {
                    endIndex++;
                }
                
                windows.push({
                    start: data[i].time,
                    end: data[endIndex].time,
                    score: Math.max(...data.slice(i, endIndex + 1).map(d => this.calculateBiteScore(d))),
                    reason: this.getBestTimeReason(data[i])
                });
                
                i = endIndex; // Skip processed period
            }
        }
        
        return windows.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    getBestTimeReason(data) {
        const reasons = [];
        
        if (data.pressure >= 29.8 && data.pressure <= 30.2) {
            reasons.push('stable pressure');
        }
        
        const hour = data.time.getHours();
        if ((hour >= 5 && hour <= 8) || (hour >= 17 && hour <= 20)) {
            reasons.push('prime solunar time');
        }
        
        const tidePhase = Math.sin((hour / 12) * 2 * Math.PI);
        if (Math.abs(tidePhase) >= 0.7) {
            reasons.push('active tide');
        }
        
        if (data.windSpeed >= 5 && data.windSpeed <= 15) {
            reasons.push('optimal wind');
        }
        
        return reasons.length > 0 ? reasons.join(' + ') : 'favorable conditions';
    }

    renderBestTimes(containerId, windows) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        windows.forEach(window => {
            const item = document.createElement('div');
            item.className = 'best-time-item';
            
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
            
            container.appendChild(item);
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
        
        // Major and minor periods
        const majorPeriods = ['6:30 AM - 8:30 AM', '6:30 PM - 8:30 PM'];
        const minorPeriods = ['12:30 AM - 1:30 AM', '12:30 PM - 1:30 PM'];
        
        const majorElement = document.getElementById('major-periods');
        const minorElement = document.getElementById('minor-periods');
        
        if (majorElement) {
            majorElement.innerHTML = 
                majorPeriods.map(period => `<div class="time-period">${period}</div>`).join('');
        }
        
        if (minorElement) {
            minorElement.innerHTML = 
                minorPeriods.map(period => `<div class="time-period">${period}</div>`).join('');
        }
        
        // Sun times
        const sunriseElement = document.getElementById('sunrise-time');
        const sunsetElement = document.getElementById('sunset-time');
        
        if (sunriseElement) sunriseElement.textContent = '6:45 AM';
        if (sunsetElement) sunsetElement.textContent = '7:20 PM';
    }

    initializeCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            return;
        }

        // Tide Chart
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
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 8
                        }
                    }
                }
            });
        }

        // Pressure Chart
        const pressureCanvas = document.getElementById('pressure-chart');
        if (pressureCanvas) {
            this.charts.pressure = new Chart(pressureCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Pressure (inHg)',
                        data: [],
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            min: 29.0,
                            max: 31.0
                        }
                    }
                }
            });
        }

        // Temperature Chart
        const tempCanvas = document.getElementById('temperature-chart');
        if (tempCanvas) {
            this.charts.temperature = new Chart(tempCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Water Temp (°F)',
                        data: [],
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Wind Chart
        const windCanvas = document.getElementById('wind-chart');
        if (windCanvas) {
            this.charts.wind = new Chart(windCanvas, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Wind Speed (knots)',
                        data: [],
                        backgroundColor: '#5D878F',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 35
                        }
                    }
                }
            });
        }

        // Update charts with initial data
        this.updateCharts();
    }

    updateCharts() {
        if (Object.keys(this.charts).length === 0) return;
        
        const data24h = this.forecastData.slice(0, 24);
        const labels = data24h.map(d => d.time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }));

        // Update tide chart
        if (this.charts.tide) {
            this.charts.tide.data.labels = labels;
            this.charts.tide.data.datasets[0].data = data24h.map(d => d.tideHeight);
            this.charts.tide.update('none');
        }

        // Update pressure chart
        if (this.charts.pressure) {
            this.charts.pressure.data.labels = labels;
            this.charts.pressure.data.datasets[0].data = data24h.map(d => d.pressure);
            this.charts.pressure.update('none');
        }

        // Update temperature chart
        if (this.charts.temperature) {
            this.charts.temperature.data.labels = labels;
            this.charts.temperature.data.datasets[0].data = data24h.map(d => d.waterTemp);
            this.charts.temperature.update('none');
        }

        // Update wind chart
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
        
        // Simulate API call delay
        setTimeout(() => {
            this.generateForecastData();
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

    exportCSV() {
        const headers = ['Time', 'Bite Score', 'Air Temp', 'Water Temp', 'Wind Speed', 'Wave Height', 'Tide Height', 'Pressure'];
        const rows = [headers];
        
        this.forecastData.slice(0, 24).forEach(data => {
            const score = this.calculateBiteScore(data);
            rows.push([
                data.time.toLocaleString(),
                score,
                data.airTemp,
                data.waterTemp,
                data.windSpeed,
                data.waveHeight,
                data.tideHeight,
                data.pressure.toFixed(2)
            ]);
        });
        
        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `kayak-fishing-forecast-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when DOM is loaded
const dashboard = new FishingDashboard();
dashboard.init();