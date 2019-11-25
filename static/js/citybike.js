// ====== Components ===========================================================

Vue.component('l-map', Vue2Leaflet.LMap);
Vue.component('l-tile-layer', Vue2Leaflet.LTileLayer);
Vue.component('l-feature-group', Vue2Leaflet.LFeatureGroup);
Vue.component('l-tooltip', Vue2Leaflet.LTooltip);
Vue.component('l-popup', Vue2Leaflet.LPopup);

Vue.component('station-badge', citybike.stationBadge);
Vue.component('l-station-marker', citybike.stationMarker);
Vue.component('station-popup', citybike.stationPopup);
Vue.component('stations-map', citybike.stationsMap);
Vue.component('stations-list', citybike.stationsList);



// ====== App ==================================================================

var app = new Vue({
    template: `
        <div id="wrapper">
         <header>
          <i class="icon icon-bicycle"></i>
          <span class="name">Bysykkel (Oslo)</span>
          <div class="stats">
           Stativer: {{stations.length}}<br>
           Oppdatert: {{lastStatusUpdate}}
          </div>
         </header>

         <section id="container">
          <stations-map 
            :stations="stations"
            :focused-station="focusedStationId" />

          <stations-list 
            :stations="stations"
            :focused-station="focusedStationId"
            @station-clicked="stationFocused" />
         </section>

         <div id="error" v-if="errorMessage">
          <b>Feilmelding</b>: {{errorMessage}}.
         </div>
        </div>
    `,
    data: {
        stations: [],
        focusedStationId: null,
        updateTimer: null,
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
        // Fetch list of publicly available stations
        getStationInformation() {
            console.log('Fetching stations list');

            this.$http.get('/json/stations').then(response => {
                if (!response.body.success) {
                    this.setErrorState(response.body.message);
                    return;
                }

                // Set station data
                this.stations = response.body.data.stations;

                console.log('> Got '+this.stations.length+' stations');

                // Update station status
                this.updateStationStatus();

                // Start timer (Could possibly be based on returned ttl value.)
                this.updateTimer = setInterval(() => {
                    this.updateStationStatus();
                }, 15000);

            }, error => {
                console.error(error);
                this.setErrorState(error.statusText);
            });
        },

        // Update status information for all stations
        updateStationStatus() {
            if (!this.stations)
                return;

            console.log('Fetching status for all stations');

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

        stationFocused(station_id) {
            console.log('Listed station '+station_id+' clicked');
            this.focusedStationId = station_id;
        },

        setErrorState(message) {
            console.log('Setting error state with message "'+message+'"');

            // Set (and display) error message
            this.errorMessage = message;

            this.statusUpdatedTimestamp = null;

            // Clear any active timer
            if (this.updateTimer)
                clearInterval(this.updateTimer);
        }
    },
    mounted() {
        this.getStationInformation();
    },
});