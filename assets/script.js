// ====== App ==================================================================
var app = new Vue({
    delimiters: ['[[', ']]'],
    data: {
        stations: [],
        timer: null,
        statusUpdatedTimestamp: null,
        errorMessage: null,
    },
    computed: {
        lastStatusUpdate() {
            if (!this.statusUpdatedTimestamp)
                return null;
            return new Date(this.statusUpdatedTimestamp * 1000).toLocaleString();
        }
    },
    methods: {
        getStationInformation() {
            // Fetch list of publicly available stations
            this.$http.get('/json/stations').then(response => {
                if (!response.body.success) {
                    this.setErrorState(response.body.message);
                    return;
                }

                // Set station data
                this.stations = response.body.data.stations;

                // Update station status
                this.updateStationStatus();

                // Start timer (Could possibly be based on returned ttl value.)
                this.timer = setInterval(() => {
                    this.updateStationStatus();
                }, 15000);

            }, error => {
                console.error(error);
                this.setErrorState(error.statusText);
            });
        },
        updateStationStatus() {
            if (!this.stations)
                return;

            // Fetch list of publicly available stations
            this.$http.get('/json/stations/status').then(response => {
                if (!response.body.success) {
                    this.setErrorState(response.body.message);
                    return;
                }

                // Update station status
                let status = response.body.data.stations;

                for (let i = 0; i < this.stations.length; i++) {
                    let station_id = this.stations[i].station_id;

                    if (station_id in status) {
                        // Set status data
                        Vue.set(this.stations[i], 'status', status[station_id]);
                    }
                }

                this.statusUpdatedTimestamp = response.body.last_updated;

            }, error => {
                console.error(error);
                this.setErrorState(error.statusText);
            });
        },
        setErrorState(message) {
            // Set (and display) error message
            this.errorMessage = message;

            this.statusUpdatedTimestamp = null;

            // Clear any active timer
            if (this.timer)
                clearInterval(this.timer);
        }
    },
    mounted() {
        this.getStationInformation();
    },
}).$mount('#app');

