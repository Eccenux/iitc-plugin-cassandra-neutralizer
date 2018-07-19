/**
 * Log analysis main class.
 */
class LogAnalysis {
	constructor() {
		/**
		 * Neutralized portals guids.
		 */
		this.neutralized = [];
		/**
		 * Portals under investigation.
		 * 
		 * Keys are guids.
		 * 
		 * Note! Removed after found to be neutralized.
		 */
		this.inAnalysis = {};
	}

	/**
	 * Is portal already considered to be neutralized.
	 * @param {String} guid Portal id.
	 */
	isNeutrlized(guid) {
		return this.neutralized.indexOf(guid) >= 0;
	}

	/**
	 * Creates a map of position to guid.
	 * 
	 * Creates a position key for each portals and returns a map of that key to actual guid.
	 * 
	 * Note key format should stay in sync. with `LogEntry` format.
	 */
	mapLatLong() {
		let latlngToGuid = {};
		for(let guid in window.portals) {
			let latlng = window.portals[guid].getLatLng();
			let latlngKey = `${latlng.lat};${latlng.lng}`;
			if (latlngKey in latlngToGuid) {
				console.warn(`duplicate latlng: ${latlngKey} for portals: ${latlngToGuid[latlngKey]} and ${guid}`);
			} else {
				latlngToGuid[latlngKey] = guid;
			}
		}
		return latlngToGuid;
	}

	/**
	 * Reads (transforms) public log entries.
	 */
	readLog(publicData) {
		//let data = window.chat._public.data;
		let data = publicData;
		// parse
		let logEntries = $.map(data, function(value, key) {
			return new LogEntry(value, key);
		});
		// sort
		logEntries = logEntries.sort(function(a, b) {
			return a.time - b.time;
		});
	
		return logEntries;
	}	
}