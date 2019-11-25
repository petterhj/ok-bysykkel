// Component: Bike station status badge
Vue.component('station-badge', {
    template: `
        <div class="station-status-badge">
         <div title="Sykler" :class="badgeColor(bikeCount)">
          <i class="icon icon-bicycle"></i>
          <span>{{bikeCount}}</span>
         </div>
         <div title="Låser" :class="badgeColor(dockCount)">
          <i class="icon icon-lock"></i>
          <span>{{dockCount}}</span>
         </div>
        </div>
    `,
    props: ['status'],
    computed: {
        bikeCount() {
            return (this.status ? this.status.num_bikes_available : '?');
        },
        dockCount() {
            return (this.status ? this.status.num_docks_available : '?');
        }
    },
    methods: {
        badgeColor(count) {
            if (count == 0) {
                return 'red';
            } else if (count > 0 && count <= 3) {
                return 'orange';
            } else if (count > 3) {
                return 'green';
            }
        }
    }
});


// ====== Map ==================================================================

Vue.component('l-map', Vue2Leaflet.LMap);
Vue.component('l-tile-layer', Vue2Leaflet.LTileLayer);
Vue.component('l-feature-group', Vue2Leaflet.LFeatureGroup);
Vue.component('l-tooltip', Vue2Leaflet.LTooltip);
Vue.component('l-popup', Vue2Leaflet.LPopup);


// Component: Bike station marker
Vue.component('l-station-marker', {
    extends: Vue2Leaflet.LMarker,
    props: ['station', 'status'],
    data() {
        return {
            iconObject: null,
        }
    },
    computed: {  },
    watch: {
        status: function(current, previous) {
            if (!current) {
                this.resetIcon();
                return;
            }

            // Check for changes and update state
            if (!previous || (current.num_bikes_available != previous.num_bikes_available || 
                                current.num_docks_available != previous.num_docks_available)) {
                
                console.log('Updating marker icon for '+this.station.station_id+': '+this.station.name);

                // Update marker icon
                this.resetIcon();
                this.setIconColor(current.num_bikes_available);
                this.animateIcon();
            }
        }
    },
    methods: {
        animateIcon() {
            L.DomUtil.addClass(this.iconObject, 'animate');
            setTimeout(() => {
                L.DomUtil.removeClass(this.iconObject, 'animate');
            }, 6000);
        },
        setIconColor(count) {
            if (count == 0) {
                L.DomUtil.addClass(this.iconObject, 'red');
            } else if (count > 0 && count <= 3) {
                L.DomUtil.addClass(this.iconObject, 'orange');
            } else if (count > 3) {
                L.DomUtil.addClass(this.iconObject, 'green');
            }
        },
        resetIcon() {
            L.DomUtil.removeClass(this.iconObject, 'red');
            L.DomUtil.removeClass(this.iconObject, 'green');
            L.DomUtil.removeClass(this.iconObject, 'orange');
            L.DomUtil.removeClass(this.iconObject, 'animate');
        }
    },
    created() {
        // Set marker icon
        this.icon = L.divIcon({
            iconSize: [10, 10],
            className: 'bike-station-icon',
        });
    },
    mounted() {
        // Set icon object
        this.iconObject = this.mapObject._icon;
    }
});


// Component: Station popup
Vue.component('station-popup', {
    template: `
        <l-popup>
         <div class="station-popup">
          <h1>{{name}}</h1> 
          <h2 v-if="displayAddress">{{address}}</h2>
          <station-badge :status="station.status" />
         </div>
        </l-popup>
    `,
    props: ['station'],
    computed: {
        name() { return this.station.name.trim(); },
        address() { return this.station.address.trim(); },
        displayAddress() { return (this.name.toLowerCase() != this.address.toLowerCase() ? true : false); }
    }
});


// Component: Stations map
Vue.component('stations-map', {
    template: `
        <div id="map">
         <l-map ref="map"style="height: 100%; width: 100%" 
          :zoom="zoom" 
          :center="center"
          :bounds="bounds"
          @ready="mapReady">
         
          <l-tile-layer :url="url"></l-tile-layer>

          <l-feature-group ref="stationsGroup">
           <l-station-marker v-for="station in stations" v-if="station.lat && station.lon"
            :lat-lng="{lat: station.lat, lon: station.lon}"
            :station="station"
            :status="station.status">
           
            <l-tooltip :options="{ permanent: false, interactive: true }">
             {{station.name}}
            </l-tooltip>

            <station-popup :station="station" />

           </l-station-marker>
          </l-feature-group>
         </l-map>
        </div>
    `,
    props: ['stations', 'focusedStation'],
    data () {
        return {
            url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
            zoom: 13,
            center: [59.911126, 10.752529],
            bounds: [],
        };
    },
    watch: {
        stations: function(current, previous) {
            // Fit bounds of stations feature group 
            let bounds = this.$refs.stationsGroup.mapObject.getBounds();
            this.bounds = (bounds.isValid() ? bounds : this.bounds);
        },
        focusedStation: function(current_id, previous_id) {
            // Find station marker
            this.$refs.stationsGroup.$children.forEach((marker, i) => {
                if (current_id == marker.station.station_id) {
                    // Set marker as map center (should ideally be offsetted 
                    // based on stations list sidebar)
                    this.center = marker.latLng;

                    // Fire click event
                    marker.mapObject.fire('click');
                }
            });
        }
    },
    methods: {
        // Fired when the leaflet map instance is ready
        mapReady(map) {
            // Move zoom control
            map.zoomControl.setPosition('topright');

            // Attribution
            map.attributionControl.addAttribution([
                '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                '<a href="https://oslobysykkel.no/apne-data/sanntid">Oslo Bysykkel</a>',
                '<a href="https://urbansharing.com/">Urban Sharing</a>'
            ].join(' | '));
        }
    },
    mounted() {       
    }
});




// ====== List =================================================================

// Component: Stations list
Vue.component('stations-list', {
    template: `
        <div id="stations">
         <div class="station" v-for="station in stations" :key="station.station_id"
            :class="{ active: (focusedStation == station.station_id) }" 
            @click="$emit('station-clicked', station.station_id)">
          <div class="details">
           <h1>{{station.name}}</h1>
           <h2>{{station.address}}</h2>
          </div>
          
          <station-badge :status="station.status" />
         </div>
        </div>
    `,
    props: ['stations', 'focusedStation'],
    // watch: {
    //     focusedStation: function(current_id, previous_id) {
    //         console.log(current_id);
    //     }
    // }
});



// ====== App ==================================================================

var app = new Vue({
    delimiters: ['[[', ']]'],
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
        getStationInformation() {
            // Fetch list of publicly available stations
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

        updateStationStatus() {
            if (!this.stations)
                return;

            // Fetch status update for all stations
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
        console.log(this.$refs)
    },
}).$mount('#app');