/**
 * Portal from analysis perspective.
 * 
 * Note that "me" means current user.
 * 
 * Note! It is assumed this is a non-neutralized portal!
 */
export default class Portal {
	constructor(guid) {
		this.guid = guid;
		this.destroyed = -1;	// when was the resonator destroyed
	}

	/**
	 * Reset analysis.
	 * 
	 * This should called when non-capture action occured. So e.g. when:
	 * <li>Someone (including me) deployed a resonator.
	 * <li>Someone (including me) linked from/to the portal.
	 * <li>Not-me neutralized a portal (actually "neutralized" action for "me" never occures).
	 * 
	 * No action other then capture is possible on a neutralized portal.
	 * So this means the portal is not neutralized if non-capture occured.
	 */
	resetAnalysisState() {
		this.destroyed = -1;	// when was the resonator destroyed
	}

	/**
	 * Setup destroyed resonator time.
	 * @param {Number} timestamp Timestamp.
	 */
	setDestroyedResonator(timestamp) {
		if (timestamp > this.destroyed) {
			this.destroyed = timestamp;
		}
	}
	/**
	 * Check if any resontor was destroyed by "me".
	 */
	hasDestroyedResonator() {
		return this.destroyed > 0;
	}

	/**
	 * Get IITC portal entity.
	 */
	getPortalEntity() {
		return window.portals[this.guid];
	}
	/**
	 * Is portal neutral.
	 */
	isNeutral() {
		let portalEntity = this.getPortalEntity();
		return portalEntity.options.team == TEAM_NONE;
	}
	/**
	 * Entity refresh time.
	 *
	 * This returns a timestamp that is a server side information, so should be accurate.
	 */
	entityRefreshTime() {
		let portalEntity = this.getPortalEntity();
		return portalEntity.options.timestamp;
	}

	/**
	 * Check state.
	 * 
	 * Assumes that the portal was not neutralized yet. Must be checked outside!
	 */
	stateAnalysis(lastLogTimestamp) {
		let self = this;
		function logDebug(text) {
			console.log(`[stateAnalysis] (${self.guid})`, text)
		}

		// no resonator was destroyed yet so don't bother checking
		if (this.destroyed === -1) {
			// logDebug(`no resonator was destroyed yet so don't bother checking`);
			return false;
		}

		if (!this.isNeutral()) {
			logDebug(`portal is not neutral`);
			return;	// don't know (wait for more log entries)
		}
		// => portal.isNeutral
		
		var portalRefreshTime = this.entityRefreshTime();
	
		// would probably never be true, but have to check
		if (portalRefreshTime == lastLogTimestamp) {
			logDebug(`yes, portal refresh time is the same as log`);
			return true;
		// portal state is newer then the last log entry
		// => a lot might have happened in between
		} else if (portalRefreshTime > lastLogTimestamp) {
			logDebug(`maybe; should refresh log to make sure`);
			return; // maybe; should refresh log to make sure
		// portal state is within the boundaries of analyzed log
		// and as I analized the whole log already and found a resonator destroyed by me
		// then I guess the portal was neutralized by me...
		} else { // if (portalRefreshTime < lastLogTimestamp) {
			// ...but just to be sure check if portal state is not stale
			if (portalRefreshTime >= this.destroyed) {
				logDebug(`yes, portal state is within the boundaries of analyzed log`);
				return true;
			} else {
				logDebug(`maybe; should refresh portal state to make sure`);
				return; // maybe; should refresh portal state to make sure
			}
		}
	}
}
