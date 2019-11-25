// Setup Mocha using the Chai Expect/Should API (BDD)
mocha.setup('bdd');
var expect = chai.expect;

// Mock data
const mockStations = {
	'data': {
		'stations': [{
	        'address': '7 Juni Plassen', 
	        'capacity': 21, 
	        'lat': 59.9150596, 
	        'lon': 10.7312715, 
	        'name': '7 Juni Plassen', 
	        'station_id': '623'
	      }, {
			'address': 'Adamstuen', 
	        'capacity': 8, 
	        'lat': 59.932792, 
	        'lon': 10.734457, 
	        'name': 'Adamstuen', 
	        'station_id': '425'
	    }]
	}, 
	'last_updated': 1574714265, 
	'success': true, 
	'ttl': 10
};
const mockStationStatus = {
	'data': {
		'stations': {
	  		'623': {
				'is_installed': 1, 
				'is_renting': 1, 
				'is_returning': 1, 
				'last_reported': 1574715128, 
				'num_bikes_available': 0, 
				'num_docks_available': 18, 
				'station_id': '623'
	  		},
	  		'425': {
				'is_installed': 1, 
				'is_renting': 1, 
				'is_returning': 1, 
				'last_reported': 1574715128, 
				'num_bikes_available': 0, 
				'num_docks_available': 5, 
				'station_id': '425'
	  		},
		}
  	}, 
  	'last_updated': 1574715128, 
  	'success': true, 
  	'ttl': 10
};

// Vue resource interceptor, TODO:
// 	-> https://github.com/jgiovanni/vue-resource-mock-api
// 	-> https://github.com/airtonix/vue-resource-mock
Vue.http.interceptors.push(function(request, next) {
	if (request.url == '/json/stations') {
		next(request.respondWith(mockStations, {status: 200})
		);
	} else if (request.url == '/json/stations/status') {
		next(request.respondWith(mockStationStatus, {status: 200})
		);
	}
});

// App instance
describe('app', function() {
	// Create Wrapper for mounted Vue instance
	// app.getStationInformation = function() {
	// };
	const vm = app.$mount();
	const wrapper = VueTestUtils.createWrapper(vm);

	it('should set expected data after mount', function(done) {
		expect(vm.stations).to.be.an('array');
		expect(vm.stations).to.have.an.lengthOf(2);
		expect(vm.focusedStationId).to.be.null;
		expect(vm.updateTimer).to.not.be.null;
		expect(vm.statusUpdatedTimestamp).to.not.be.null;
		expect(vm.errorMessage).to.be.null;
		done();
	});

	it('computed lastStatusUpdate accepts unix timestmap (in seconds)', function(done) {
		// wrapper.setData({statusUpdatedTimestamp: Math.floor((new Date().getTime() / 1000))})
		expect(wrapper.vm.lastStatusUpdate).to.not.be.null;
		done();
	});
 });


// Component: Stations list
describe('component:stations-list', function() {
	let wrapper = VueTestUtils.mount(Vue.component('stations-list', citybike.stationsList));
	wrapper.setProps({
		stations: mockStations.data.stations,
		focusedStationId: null
	})

	it('has correct number of station elements', function(done) {
		let stations = wrapper.findAll('.station');
		expect(stations).to.have.lengthOf(mockStations.data.stations.length);
		done();
	});

	it('has corrent station properties (id/name/address)', function(done) {
		let stations = wrapper.findAll('.station');

		stations.wrappers.forEach(function(station, i) {
			expect(station.rootNode.key).to.equal(mockStations.data.stations[i].station_id);
			expect(station.find('h1').text()).to.equal(mockStations.data.stations[i].name);
			expect(station.find('h2').text()).to.equal(mockStations.data.stations[i].address);
		});

		done();
	});
});


// Component: Station status badge
describe('component:station-badge', function() {
	let wrapper = VueTestUtils.mount(Vue.component('station-badge', citybike.stationBadge));
	let stationStatus = {
		is_installed: 1,
		is_renting: 1,
		is_returning: 1,
		last_reported: 1574696404,
		num_bikes_available: 1,
		num_docks_available: 28,
		station_id: '377'
	};

	it('has correct root element', function(done) {
		expect(wrapper.is('div')).to.be.true;
		expect(wrapper.classes()).to.contain('station-status-badge');
		done();
	});

	it('has correct badge markup', function(done) {
		let badges = wrapper.findAll('div:not(.station-status-badge)');
		expect(badges).to.have.lengthOf(2);
		let counters = wrapper.findAll('span');
		expect(counters).to.have.lengthOf(2);
		done();
	});

	it('has correct initial counter values', function(done) {
		wrapper.findAll('span').wrappers.forEach((counter) => {
			expect(counter.text()).to.equal('?');
		});
    	done();
	});

	it('has correct initial counter color class', function(done) {
		wrapper.findAll('span').wrappers.forEach((counter) => {
			expect(counter.classes()).to.have.lengthOf(0);
		});
    	done();
	});

	it('displays correct bikes/docks count', function(done) {
		wrapper.setProps({status: stationStatus});

		let counters = wrapper.findAll('span');
		
		expect(counters.at(0).text()).to.equal('1');
		expect(counters.at(1).text()).to.equal('28');
		done();
	});

	it('badgeColor method returns correct counter color class', function(done) {
		expect(wrapper.vm.badgeColor(-1)).to.be.undefined;
		expect(wrapper.vm.badgeColor(0)).to.equal('red');
		expect(wrapper.vm.badgeColor(1)).to.equal('orange');
		expect(wrapper.vm.badgeColor(2)).to.equal('orange');
		expect(wrapper.vm.badgeColor(3)).to.equal('orange');
		expect(wrapper.vm.badgeColor(4)).to.equal('green');
		expect(wrapper.vm.badgeColor(99)).to.equal('green');
		
		done();
	});
});


mocha.run();