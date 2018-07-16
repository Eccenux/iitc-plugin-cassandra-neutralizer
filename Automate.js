/**
 * Automation helper class(es).
 *
 * Kind of code (some parts might be pseudo code - e.g. `foreach`; some parts might be missing).
 * 
 * Note that "me" means current user.
 */

 /**
  * Portal from analysis perpective.
  * 
  * Note! It is assumed this is a non-neutralized portal!
  */
class Portal {
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
	stateAnalysis = function (lastLogTimestamp) {
		// no resonator was destroyed yet so don't bother checking
		if (this.destroyed === -1) {
			return false;
		}

		if (!portal.isNeutral()) {
			return;	// don't know (wait for more log entries)
		}
		// => portal.isNeutral

		
		var portalRefreshTime = portal.entityRefreshTime();
	
		if (portalRefreshTime == lastLogTimestamp) {
			return true;
		} else if (portalRefreshTime > lastLogTimestamp) {
			return; // maybe; should refresh log to make sure
		} else { // if (portalRefreshTime < lastLogTimestamp) {
			// if I destroyed the resonator and then the portal state was neutral then I neutralized the portal
			if (destroyedResonatorTime < portalRefreshTime) {
				return NEUTRALIZED_BY_ME;
			} else {
				return MAYBE, (optionally) check log from portalRefreshTime for any captures on the portal.
			}
		}
	}
}
