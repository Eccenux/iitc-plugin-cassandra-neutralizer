Automation notes
================

Trying to figure out when a portal was neutralized by me...

Log-only analysis
-----------------

Log analysis. Note! Requires continues log scanning and saving lots of data.  

For sure:
1. [eccenux]	destroyed a Resonator on WW II House
2. [eccenux]	captured WW II House

More generic:
1. [eccenux]	destroyed a Resonator on WW II House
...any actions NOT on WW II House
2. [eccenux]	captured WW II House

Even more generic:
1. [eccenux]	destroyed a Resonator on WW II House
...any actions NOT on WW II House
2. [any my-faction user]	captured WW II House

my-faction only? Or any faction?

Log + current state (scribbles)
-------------------

1. [eccenux]	destroyed a Resonator on WW II House -> `destroyedResonatorTime`
...any actions NOT on WW II House
2. Check portal state.

```
if (portal.isNeutral()) {
	if (portal.refreshTime == log.refreshTime) {
		return NEUTRALIZED_BY_ME;
	} else if (portal.refreshTime > log.refreshTime) {
		return MAYBE, REFRESH_LOG;
	} else if (portal.refreshTime < log.refreshTime) {
		//return MAYBE, check log from portal.refreshTime;
		ASSERT(destroyedResonatorTime < log.refreshTime);
		// if I destroyed the resonator and then the portal state was neutral then I neutralized the portal
		if (destroyedResonatorTime < portal.refreshTime) {
			return NEUTRALIZED_BY_ME;
		} else {
			return MAYBE, (optionally) check log from portal.refreshTime for any captures on the portal.
		}
	}
}
```

(?) Implies that I should:
1. Gather `log.lastMessageTime`.
2. Gather `portal.lastCaptureTime` (from log).
3. (?) Gather `portal.lastKonwState` (from log). States: {NEUTRAL, ENL, RES}.
4. Gather `portal.destroyedResonatorTime`.


Can I get `portal.refreshTime`? Is it the same as `map.refreshTime` (if that exists)?

Can I get `log.refreshTime`? Is it the same as `log.lastMessageTime`?

Most importantly -- can I ever be sure that `portal.refreshTime` is the same as `log.refreshTime`? Probably not... Would have to load portal state from the server and then force log refresh and then I will be sure that I have the current state of the portal (current within log limits)... But that's not really feasible.

Useful data
-----------

* `new Date(chat._public.oldestTimestamp)` ~ `log.firstMessageTime`
* `new Date(chat._public.newestTimestamp)` ~ `log.lastMessageTime`
* `new Date(portals[selectedPortal].options.timestamp))` seem to be something like lastStateChangeTime... Hm...
* `portals[selectedPortal].options.data.team` is in {'E', 'R', 'N'}.
* `portals[selectedPortal].options.team` is in {TEAM_NONE, TEAM_ENL, TEAM_RES}. `TEAM_RES` etc is defined globally by IITC.

Algorithm
---------

Check log each time log is loaded. For now I assume whole log is check from oldest to youngest. Should probably figure out how to do this incrementally.

Note! Before analyzing any log entry I should probably do something like:
```
if (analysis.isNeutrlized(logEntry.portalGuid)) {
	continue;
}
```
I must also preserve a list of analyzed portals, but only for portals not yet marked as neutralized (preserve a list of neutralized guids only to conserve memory).

### Case destroy>captured ###
1. [me]	destroyed a Resonator on WW II House -> `portal.setDestroyedResonator(logEntry.time);`
...any actions NOT on WW II House
2. [any user]	captured WW II House  ->
```
if (portal.hasDestroyedResonator()) {
	analysis.setNeutralized(logEntry.portalGuid);
}
```

Note that `any user` includes me.

### Case destroy>not captured ###
1. [me]	destroyed a Resonator on WW II House -> `portal.setDestroyedResonator(logEntry.time);`
...any actions NOT on WW II House
2. [not-me]	(non-capture action) WW II House  -> `portal.resetAnalysisState();`

### Case destroy>no action###
1. [me]	destroyed a Resonator on WW II House -> `portal.setDestroyedResonator(logEntry.time);`
...any actions NOT on WW II House
2. Log end reached. ->
```
	lastLogTimestamp = chat._public.newestTimestamp;
	// analyze portals that were found in log, but not yet neutralized
	foreach (portal in analysis.getUnknowStateList()) {
		let state = portal.stateAnalysis(lastLogTimestamp);
		if (state === true) {
			analysis.setNeutralized(portal.guid);
		}
	}
```

See `Portal` code in `Automate.js`.

TODO
----

### Prototype ###

1. [x] Finish `Portal` class.
2. [x] Prepare log for analysis.
2. [ ] Create analysis class prototype that
	1. For `setNeutralized` would show `console.log('[analysis] portal ${title} neutralized')` (and would NOT change the neutralization state in the neutralizer plugin).
	2. For `isNeutrlized` would only check internal lists (rather then also check state in the neutralizer plugin). 
2. [ ] Add `console.log` in `stateAnalysis` (especially when returning `undefined`/maybe).
3. [ ] Setup webpack?
3. [ ] Write analysis algorithm based on assumption that we analyze the whole log.
4. [ ] Write automated tests for some edge cases? 
5. [ ] Add the whole thing to the plugin, but rather then starting analysis upon log change, add a new button-link in "Casandra Neutralizer" window for manually started analysis. 
6. [ ] Test if neutralization is logged as expected to JS console.

### Working version ###

1. [ ] Freeze chat refresh before analysis (if possible). If not then I might just set 
2. [ ] Add "(beta!)" near the analysis button.
3. [ ] Re-write `setNeutralized` and `isNeutrlized`.
4. [ ] Remove `tempText` from `LogEntry`.
10. [ ] Real world testing. 
50. [ ] Release?
100. [ ] New world order! :-)
