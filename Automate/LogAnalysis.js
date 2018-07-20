import Portal from "./Portal.js";
import LogEntry from './LogEntry.js';

/**
 * Log analysis main class.
 */
export default class LogAnalysis {
	constructor(meName, portals, chat) {
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

		/**
		 * "me"
		 */
		this.meName = meName;

		// prepare data
		this.latlngToGuid = this.mapLatLong(portals);
		this.logEntries = this.readLog(chat);
	}

	/**
	 * Is portal already considered to be neutralized.
	 * @param {String} guid Portal id.
	 */
	isNeutrlized(guid) {
		return this.neutralized.indexOf(guid) >= 0;
	}
	/**
	 * Set as neutralized.
	 * @param {String} guid Portal id.
	 */
	setNeutralized(guid) {
		console.log(`[analysis] portal ${guid} neutralized`);
		// remove from investigation list
		if (guid in this.inAnalysis) {
			delete this.inAnalysis[guid];
		}
		// remember internally
		this.neutralized.push(guid);

		// change global neutralization state
		// ...for now will NOT change the neutralization state in the neutralizer plugin
	}

	/**
	 * Get fake/simplified LatLng object.
	 * @param {Object} portal Simple portal object.
	 */
	getLatLng(portal) {
		return {
			lat: portal.options.data.latE6/1E6,
			lng: portal.options.data.lngE6/1E6,
		}
	}

	/**
	 * Creates a map of position to guid.
	 * 
	 * Creates a position key for each portals and returns a map of that key to actual guid.
	 * 
	 * Note key format should stay in sync. with `LogEntry` format.
	 */
	mapLatLong(portals) {
		let latlngToGuid = {};
		for(let guid in portals) {
			let latlng = this.getLatLng(portals[guid]);
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

	/**
	 * 
	 * @param {LogEntry} logEntry 
	 */
	analyzeEntry(logEntry) {
		// skip chitchat entries
		if (logEntry.guids.length < 1) {
			return;
		}
		
		// skip entries with portal out of bounds
		if (!(logEntry.guid in this.latlngToGuid)) {
			//console.warn(`unknown portal ${logEntry.guid}; mabe need to zoom in?`)
			//console.log(logEntry)
			return;
		}

		let portalGuid = this.latlngToGuid[logEntry.guid];

		// skip already found
		if (this.isNeutrlized(portalGuid)) {
			return;
		}

		let portal;
		//let fresh = false;
		if (portalGuid in this.inAnalysis) {
			portal = this.inAnalysis[portalGuid];
		} else {
			//fresh = true;
			portal = new Portal(portalGuid);
			this.inAnalysis[portalGuid] = portal;
		}

		let myAction = logEntry.username === this.meName;

		// [me] destroyed a Resonator on ...
		if (logEntry.action === 'resKill' && myAction) {
			portal.setDestroyedResonator(logEntry.time);
		// Case destroy>captured
		} else if (logEntry.action === 'capture') {
			if (portal.hasDestroyedResonator()) {
				this.setNeutralized(portalGuid);
			}
		// Case destroy>not captured
		} else if (portal.hasDestroyedResonator()) {
			portal.resetAnalysisState();
		}
	}
}