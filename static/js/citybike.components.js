var citybike = (function () { 

	// Component: Bike station status badge (shared between 
	// stations list and marker popup)
	var stationBadge = {
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
	};


	// Component: Bike station marker. Extends leaflet marker.
	var stationMarker = {
	    extends: Vue2Leaflet.LMarker,
	    props: ['station', 'status'],
	    computed: {
	    	iconObject() { return this.mapObject._icon; }
	    },
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
	    }
	};

	// Component: Station marker popup
	var stationPopup = {
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
	};

	// Component: Stations map
	var stationsMap = {
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
	            :key="station.station_id"
	            :icon="markerIcon"
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
	            markerIcon: L.divIcon({
	            	iconSize: [10, 10],
	            	className: 'bike-station-icon',
	        	})
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
	    }
	};

	// Component: Stations list
	var stationsList = {
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
	};


	return {
		stationMarker: stationMarker,
		stationPopup: stationPopup,
		stationBadge: stationBadge,
		stationsMap: stationsMap,
		stationsList: stationsList,
	}
	
})();