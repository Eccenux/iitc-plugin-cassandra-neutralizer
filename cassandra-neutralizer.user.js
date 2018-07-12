// ==UserScript==
// @id             iitc-plugin-cassandra-neutralizer@eccenux
// @name           IITC plugin: Cassandra Neutralizer tracker
// @category       Misc
// @version        0.0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    [0.0.1] Track your progress for Cassandra Neutralizer badge. This plugin allows marking portals as neutralized. Use the 'sync' plugin to share between multiple browsers or desktop/mobile. Use 'draw tools' plugin to be able to select areas.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// @updateURL      https://github.com/Eccenux/iitc-plugin-cassandra-neutralizer/raw/master/cassandra-neutralizer.meta.js
// @downloadURL    https://github.com/Eccenux/iitc-plugin-cassandra-neutralizer/raw/master/cassandra-neutralizer.user.js
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


//PLUGIN START ////////////////////////////////////////////////////////

//use own namespace for plugin
window.plugin.cassandraNeutralizer = function() {};

//delay in ms
window.plugin.cassandraNeutralizer.SYNC_DELAY = 5000;

// maps the JS property names to localStorage keys
window.plugin.cassandraNeutralizer.FIELDS = {
	'cassandraNeutralizer': 'plugin-cassandraNeutralizer-data',
	'updateQueue': 'plugin-cassandraNeutralizer-data-queue',
	'updatingQueue': 'plugin-cassandraNeutralizer-data-updating-queue',
};

window.plugin.cassandraNeutralizer.cassandraNeutralizer = {};
window.plugin.cassandraNeutralizer.updateQueue = {};
window.plugin.cassandraNeutralizer.updatingQueue = {};

window.plugin.cassandraNeutralizer.enableSync = false;

window.plugin.cassandraNeutralizer.disabledMessage = null;
window.plugin.cassandraNeutralizer.contentHTML = null;

window.plugin.cassandraNeutralizer.isHighlightActive = false;

/**
 * Very simple logger.
 */
function LOG() {
	var args = Array.prototype.slice.call(arguments); // Make real array from arguments
	args.unshift("[cassandraNeutralizer] ");
	console.log.apply(console, args);
}
function LOGwarn() {
	var args = Array.prototype.slice.call(arguments); // Make real array from arguments
	args.unshift("[cassandraNeutralizer] ");
	console.warn.apply(console, args);
}

/**
 * Portal details loaded.
 */
window.plugin.cassandraNeutralizer.onPortalDetailsUpdated = function() {
	if(typeof(Storage) === "undefined") {
		$('#portaldetails > #resodetails').before(plugin.cassandraNeutralizer.disabledMessage);
		return;
	}

	var guid = window.selectedPortal,
		details = portalDetail.get(guid),
		nickname = window.PLAYER.nickname;
	if(details) {
		function installedByPlayer(entity) {
			return entity && entity.owner == nickname;
		}
	}

	// append all-captured checkbox
	$('#portaldetails > #resodetails').before(plugin.cassandraNeutralizer.contentHTML);
	$('#portaldetails input#cassandraNeutralizer-captured').click(function () {
		var captured = this.checked;
		plugin.cassandraNeutralizer.updateCaptured(captured);
	});

	// init state
	plugin.cassandraNeutralizer.updateCheckedAndHighlight(guid);
};

/**
 * Update/init checboxes state.
 * @param {String} guid
 * @returns {undefined}
 */
window.plugin.cassandraNeutralizer.updateCheckedAndHighlight = function(guid) {
	runHooks('plugincassandraNeutralizerUpdatecassandraNeutralizer', { guid: guid });

	// this portal details are opened
	if (guid == window.selectedPortal) {

		var portalState = plugin.cassandraNeutralizer.getPortalState(guid);
		$('#portaldetails input#cassandraNeutralizer-captured').prop('checked', portalState.all);
		// all selected
		if (portalState.all) {
			LOG('quick init - all captured');
			$('#portaldetails input.cassandraNeutralizer-resonator').prop('checked', true);
		// all un-selected
		} else {
			LOG('quick init - all un-captured');
			$('#portaldetails input.cassandraNeutralizer-resonator').prop('checked', false);
		}
	}

	if (window.plugin.cassandraNeutralizer.isHighlightActive) {
		if (portals[guid]) {
			window.setMarkerStyle (portals[guid], guid == selectedPortal);
		}
	}
};

/**
 * State object for this plugin.
 *
 * Note. This just for documentation.
 *
 * @returns {PortalState}
 */
function PortalState() {
	/**
	 * True if neutralized.
	 */
	this.all = false;
	// add maybe automation? -- read captures from intel and mark as maybe?
}

/**
 * Fix in-proper values and/or add default values.
 *
 * @param {PortalState} portalState
 * @returns {PortalState}
 */
function fixPortalState(portalState) {
	if (typeof portalState.all !== 'boolean') {
		portalState.all = false;
	}
	return portalState;
}

/**
 * Gets or create (initialize) state for the portal.
 *
 * Note! This also sets the initial portal state.
 *
 * @param {String} guid Portal GUID.
 * @returns {PortalState} State object.
 */
window.plugin.cassandraNeutralizer.getOrCreatePortalState = function(guid) {
	var portalState = plugin.cassandraNeutralizer.cassandraNeutralizer[guid];
	// create
	if (!portalState) {
		plugin.cassandraNeutralizer.cassandraNeutralizer[guid] = portalState = {};
		// add defaults
		fixPortalState(portalState);
	}
	// fix in-proper values or un-freeze
	else {
		if (Object.isFrozen(portalState)) {
			LOGwarn('portalState is frozen - replacing it');
			portalState = $.extend({}, portalState);
			plugin.cassandraNeutralizer.cassandraNeutralizer[guid] = portalState;
		}
		fixPortalState(portalState);
	}
	return portalState;
};

/**
 * Gets state for the portal.
 *
 * Note! You MUST NOT assume that changes to returend object will reflect state changes.
 * You SHOULD NOT change returned object.
 *
 * @param {String} guid Portal GUID.
 * @returns {PortalState} State object.
 */
window.plugin.cassandraNeutralizer.getPortalState = function(guid) {
	var portalState = plugin.cassandraNeutralizer.cassandraNeutralizer[guid];
	if (!portalState) {
		portalState = {};
	}
	fixPortalState(portalState);
	return portalState;
};

/**
 * Update/set captured (neutralized) state.
 *
 * Note. Switching off neutralized state will bring back previously set state.
 *
 * @param {Boolean} fullyCaptured Is neutralized for sure.
 * @param {String} guid [optional] Portal GUID (defaults to `selectedPortal`).
 * @param {Boolean} delaySync [optional] (default=false) If true then data will not be saved to server nor will portal details state change.
 */
window.plugin.cassandraNeutralizer.updateCaptured = function(fullyCaptured, guid, delaySync) {
	if(guid == undefined) guid = window.selectedPortal;

	if (!delaySync) {
		LOG('updateCaptured: ', fullyCaptured, guid);
	}

	var portalState = plugin.cassandraNeutralizer.getOrCreatePortalState(guid);
	var stateChanged = false;

	if (fullyCaptured !== portalState.all) {
		stateChanged = true;
		portalState.all = fullyCaptured;
	}

	if (delaySync) {
		return;
	}

	if(!stateChanged) {
		LOGwarn('state didn\'t change');
		return;
	}

	plugin.cassandraNeutralizer.updateCheckedAndHighlight(guid);
	plugin.cassandraNeutralizer.sync(guid);
};

// <editor-fold desc="Selected portals tools" defaultstate="collapsed">
/**
 * Checks if the point is contained within a polygon.
 *
 * Based on //https://rosettacode.org/wiki/Ray-casting_algorithm
 *
 * @param {Array} polygonPoints Array of LatLng points creating a polygon.
 * @param {Object} point LatLng point to check.
 * @returns {Boolean}
 */
var rayCastingUtils = {
	/**
	 * Checks if the point is contained within a polygon.
	 *
	 * Based on //https://rosettacode.org/wiki/Ray-casting_algorithm
	 *
	 * @param {Array} polygonPoints Array of LatLng points creating a polygon.
	 * @param {Object} point LatLng point to check.
	 * @returns {Boolean}
	 */
	contains : function (polygonPoints, point) {
		var lat = point.lat;
		var lng = point.lng;
		var count = 0;
		for (var b = 0; b < polygonPoints.length; b++) {
			var vertex1 = polygonPoints[b];
			var vertex2 = polygonPoints[(b + 1) % polygonPoints.length];
			if (this.west(vertex1, vertex2, lng, lat))
				++count;
		}
		return count % 2 ? true : false;
	},
	/**
	 * @param {Object} A 1st point of an edge.
	 * @param {Object} B 2nd point of an edge.
	 * @param {Number} lng
	 * @param {Number} lat
     * @return {boolean} true if (lng,lat) is west of the line segment connecting A and B
	 */
    west : function (A, B, lng, lat) {
        if (A.lat <= B.lat) {
            if (lat <= A.lat || lat > B.lat ||
                lng >= A.lng && lng >= B.lng) {
                return false;
            } else if (lng < A.lng && lng < B.lng) {
                return true;
            } else {
                return (lat - A.lat) / (lng - A.lng) > (B.lat - A.lat) / (B.lng - A.lng);
            }
        } else {
            return this.west(B, A, lng, lat);
        }
    }
};

/**
 * Get visible portals withing given bounds.
 *
 * @param {L.LatLngBounds} bounds Rectangular bounds.
 * @param {Array} polygonPoints Array of LatLng points creating a polygon.
 * @returns {Array} Array of guids for portals that are within bounds.
 */
window.plugin.cassandraNeutralizer.getPortalsInBounds = function(bounds, polygonPoints) {
	var visiblePortals = [];
	$.each(window.portals, function(guid,portal) {
		var ll = portal.getLatLng();
		var isInside = false;
		if (bounds.contains(ll)) {
			if (!polygonPoints) {
				isInside = true;
			} else if (rayCastingUtils.contains(polygonPoints, ll)) {
				isInside = true;
			}
		}
		if (isInside) {
			visiblePortals.push(guid);
		}
	});
	return visiblePortals;
};

/**
 * Get polygons that are fully visible.
 * 
 * @returns {Array} Array of `L.Polygon`
 */
window.plugin.cassandraNeutralizer.getVisiblePolygons = function() {
	if (!window.plugin.drawTools) {
		return [];
	}

	var visibleBounds = map.getBounds();

	var polygons = [];
	window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
		if (!(layer instanceof L.Polygon)) {
			return;
		}

		if (visibleBounds.contains(layer.getBounds())) {
			polygons.push(layer);
		}
	});

	return polygons;
};

/**
 * Get polygons that are in fully visible polygons.
 *
 * @returns {Array} Array of guids for portals that are within bounds.
 */
window.plugin.cassandraNeutralizer.getSelectedPortals = function() {
	var selection = {
		polygons: [],
		portals: []
	};
	if (!window.plugin.drawTools) {
		return selection;
	}

	// find visible polygons
	var polygons = window.plugin.cassandraNeutralizer.getVisiblePolygons();
	if (polygons.length === 0) {
		return selection;
	}
	selection.polygons = polygons;

	// find and set state for portals in polygons
	for (var i = 0; i < polygons.length; i++) {
		var selectedPortals = window.plugin.cassandraNeutralizer.getPortalsInBounds(
			polygons[i].getBounds(),
			polygons[i].getLatLngs()
		);
		for (var j = 0; j < selectedPortals.length; j++) {
			if (selection.portals.indexOf(selectedPortals[j]) < 0) {	// avoid duplicates
				selection.portals.push(selectedPortals[j]);
			}
		}
	}

	return selection;
};
// </editor-fold>

window.plugin.cassandraNeutralizer.updateVisiblePortals = function(fullyCaptured) {
	if (!window.plugin.drawTools) {
		alert('Error: You must install draw tools before using this function.');
		return;
	}

	// find portals in visible polygons
	var selection = window.plugin.cassandraNeutralizer.getSelectedPortals();

	// empty selection info
	if (selection.polygons.length === 0) {
		alert('No polygons are visible in this view. \n\
			Note that the polygon must be fully visible (all corners must be in view).');
		return;
	}
	if (selection.portals.length === 0) {
		alert('No portals are visible in the visible polygon(s).');
		return;
	}

	// confirmation
	if (!confirm('Are you sure you want to change state for all selected portals ('+selection.portals.length+')?')) {
		return;
	}

	// find and set state for portals in polygons
	for (var i = 0; i < selection.portals.length; i++) {
		var guid = selection.portals[i];
		plugin.cassandraNeutralizer.updateCaptured(fullyCaptured, guid, true);
	}
	plugin.cassandraNeutralizer.massPortalsUpdate(selection.portals);
};

/**
 * Saves state of many portals to server and runs GUI updates.
 *
 * This should be run after many portal state changes.
 * Use especially with `delaySync=true` in `updateCaptured`.
 *
 * @param {Array} portals Portal GUIDs
 */
window.plugin.cassandraNeutralizer.massPortalsUpdate = function(portals) {
	// a full update - update the selected portal sidebar
	if (window.selectedPortal) {
		plugin.cassandraNeutralizer.updateCheckedAndHighlight(window.selectedPortal);
	}
	// and also update all highlights, if needed
	if (window.plugin.cassandraNeutralizer.isHighlightActive) {
		resetHighlightedPortals();
	}

	// make sure changes are saved locally (should not be required, but...)
	plugin.cassandraNeutralizer.storeLocal('cassandraNeutralizer');
	// save to server
	plugin.sync.updateMap('cassandraNeutralizer', 'cassandraNeutralizer', portals);
};

// <editor-fold desc="Storage/sync" defaultstate="collapsed">

/**
 * Forces saving all portals.
 */
window.plugin.cassandraNeutralizer.forceSync = function() {
	var allGuids = Object.keys(plugin.cassandraNeutralizer.cassandraNeutralizer);
	// confirmation
	if (!confirm('Are you REALLY sure you want to force saving all portals ('+allGuids.length+')?')) {
		return;
	}
	plugin.sync.updateMap('cassandraNeutralizer', 'cassandraNeutralizer', allGuids);
};

// stores the gived GUID for sync
plugin.cassandraNeutralizer.sync = function(guid) {
	plugin.cassandraNeutralizer.updateQueue[guid] = true;
	plugin.cassandraNeutralizer.storeLocal('cassandraNeutralizer');
	plugin.cassandraNeutralizer.storeLocal('updateQueue');
	plugin.cassandraNeutralizer.syncQueue();
};

// sync the queue, but delay the actual sync to group a few updates in a single request
window.plugin.cassandraNeutralizer.syncQueue = function() {
	if(!plugin.cassandraNeutralizer.enableSync) return;
	
	clearTimeout(plugin.cassandraNeutralizer.syncTimer);
	
	plugin.cassandraNeutralizer.syncTimer = setTimeout(function() {
		plugin.cassandraNeutralizer.syncTimer = null;

		$.extend(plugin.cassandraNeutralizer.updatingQueue, plugin.cassandraNeutralizer.updateQueue);
		plugin.cassandraNeutralizer.updateQueue = {};
		plugin.cassandraNeutralizer.storeLocal('updatingQueue');
		plugin.cassandraNeutralizer.storeLocal('updateQueue');

		plugin.sync.updateMap('cassandraNeutralizer', 'cassandraNeutralizer', Object.keys(plugin.cassandraNeutralizer.updatingQueue));
	}, plugin.cassandraNeutralizer.SYNC_DELAY);
};

//Call after IITC and all plugin loaded
window.plugin.cassandraNeutralizer.registerFieldForSyncing = function() {
	if(!window.plugin.sync) return;
	window.plugin.sync.registerMapForSync('cassandraNeutralizer', 'cassandraNeutralizer', window.plugin.cassandraNeutralizer.syncCallback, window.plugin.cassandraNeutralizer.syncInitialed);
};

//Call after local or remote change uploaded
window.plugin.cassandraNeutralizer.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
	if(fieldName === 'cassandraNeutralizer') {
		plugin.cassandraNeutralizer.storeLocal('cassandraNeutralizer');
		// All data is replaced if other client update the data during this client
		// offline,
		// fire 'plugincassandraNeutralizerRefreshAll' to notify a full update
		if(fullUpdated) {
			// a full update - update the selected portal sidebar
			if (window.selectedPortal) {
				plugin.cassandraNeutralizer.updateCheckedAndHighlight(window.selectedPortal);
			}
			// and also update all highlights, if needed
			if (window.plugin.cassandraNeutralizer.isHighlightActive) {
				resetHighlightedPortals();
			}

			window.runHooks('plugincassandraNeutralizerRefreshAll');
			return;
		}

		if(!e) return;
		if(e.isLocal) {
			// Update pushed successfully, remove it from updatingQueue
			delete plugin.cassandraNeutralizer.updatingQueue[e.property];
		} else {
			// Remote update
			delete plugin.cassandraNeutralizer.updateQueue[e.property];
			plugin.cassandraNeutralizer.storeLocal('updateQueue');
			plugin.cassandraNeutralizer.updateCheckedAndHighlight(e.property);
			window.runHooks('plugincassandraNeutralizerUpdatecassandraNeutralizer', {guid: e.property});
		}
	}
};

//syncing of the field is initialed, upload all queued update
window.plugin.cassandraNeutralizer.syncInitialed = function(pluginName, fieldName) {
	if(fieldName === 'cassandraNeutralizer') {
		plugin.cassandraNeutralizer.enableSync = true;
		if(Object.keys(plugin.cassandraNeutralizer.updateQueue).length > 0) {
			plugin.cassandraNeutralizer.syncQueue();
		}
	}
};

window.plugin.cassandraNeutralizer.storeLocal = function(name) {
	var key = window.plugin.cassandraNeutralizer.FIELDS[name];
	if(key === undefined) return;

	var value = plugin.cassandraNeutralizer[name];

	if(typeof value !== 'undefined' && value !== null) {
		localStorage[key] = JSON.stringify(plugin.cassandraNeutralizer[name]);
	} else {
		localStorage.removeItem(key);
	}
};

window.plugin.cassandraNeutralizer.loadLocal = function(name) {
	var key = window.plugin.cassandraNeutralizer.FIELDS[name];
	if(key === undefined) return;

	if(localStorage[key] !== undefined) {
		plugin.cassandraNeutralizer[name] = JSON.parse(localStorage[key]);
	}
};
// </editor-fold>

// <editor-fold desc="Highlighter" defaultstate="collapsed">
window.plugin.cassandraNeutralizer.highlighter = {
	title: 'Cassandra Neutralizer',	// this is set in setup as a user-visible name
	
	highlight: function(data) {
		var guid = data.portal.options.ent[0];
		var portalState = plugin.cassandraNeutralizer.getPortalState(guid);

		var style = {};

		// Opaque -- fully neutralized.
		if (portalState.all) {
			style.fillOpacity = 0.2;
			style.opacity = 0.2;
		}
		// Red -- not neutralized.
		else {
			style.fillColor = 'red';
			style.fillOpacity = 0.7;
		}
		/*
		// Yellow -- maybe state?
		else {
			style.fillColor = 'gold';
			style.fillOpacity = 0.8;
		}
		*/

		data.portal.setStyle(style);
	},

	setSelected: function(active) {
		window.plugin.cassandraNeutralizer.isHighlightActive = active;
	}
};
// </editor-fold>


window.plugin.cassandraNeutralizer.setupCSS = function() {
	$("<style>")
	.prop("type", "text/css")
	.html("\
	#cassandraNeutralizer-container {\n\
		display: block;\n  text-align: center;\n\
		margin: .6em 0 .3em;\n\
		padding: 0 .5em;\n\
	}\n\
	#cassandraNeutralizer-container label {\n\
		margin: 0 .5em;\n\
	}\n\
	#cassandraNeutralizer-container input {\n\
		vertical-align: middle;\n\
	}\n\
	")
	.appendTo("head");
};

  // Manual import, export and reset data
window.plugin.cassandraNeutralizer.openDialog = function() {
    dialog({
		html: plugin.cassandraNeutralizer.dialogContentHTML,
		dialogClass: 'ui-dialog-cassandraNeutralizer',
		title: 'Cassandra Neutralizer'
    });
	// move to top
	$('.ui-dialog-cassandraNeutralizer').offset({top:0});
};

window.plugin.cassandraNeutralizer.setupContent = function() {
	plugin.cassandraNeutralizer.contentHTML = '<div id="cassandraNeutralizer-container">'
			+ '<p><label><input type="checkbox" id="cassandraNeutralizer-captured"> Neutralized (Cassandra)</label></p>'
		+ '</div>'
	;
	plugin.cassandraNeutralizer.disabledMessage = '<div id="cassandraNeutralizer-container" class="help" title="Your browser does not support localStorage">Plugin Cassandra Neutralizer disabled</div>';

	// add link in toolkit to open dialog
	$('#toolbox').append('<a \n\
		onclick="plugin.cassandraNeutralizer.openDialog();return false;" \n\
		title="Cassandra Neutralizer mass operations for current selection">Cassandra Neutralizer</a>');

	// dialog
	plugin.cassandraNeutralizer.dialogContentHTML = ''
		+'<p>Draw polygon(s) to "select" portals.<p>'
		+'<p>Mark selected portals as: '
			+'<a id="cassandraNeutralizer-massOp-done" onclick="plugin.cassandraNeutralizer.updateVisiblePortals(true); return false"> Done</a> '
			+' &bull; '
			+'<a id="cassandraNeutralizer-massOp-undone" onclick="plugin.cassandraNeutralizer.updateVisiblePortals(false); return false"> Not done</a>'
		+'</p>'
	;

	// leaflet (sidebar buttons)
	$('.leaflet-control-container .leaflet-top.leaflet-left').append(''
		+'<div class="leaflet-control-cassandra-neutralizer leaflet-bar leaflet-control">'
		+'	<a class="leaflet-control-cassandra-neutralizer-done" href="#" title="Cassandra Neutralizer done" onclick="plugin.cassandraNeutralizer.updateVisiblePortals(true); return false">✅</a>'
		+'	<a class="leaflet-control-cassandra-neutralizer-undone" href="#" title="Cassandra Neutralizer undone" onclick="plugin.cassandraNeutralizer.updateVisiblePortals(false); return false">❌</a>'
		+'</div>'
	);
};

var setup = function() {
	window.pluginCreateHook('plugincassandraNeutralizerUpdatecassandraNeutralizer');
	window.pluginCreateHook('plugincassandraNeutralizerRefreshAll');

	window.plugin.cassandraNeutralizer.setupCSS();
	window.plugin.cassandraNeutralizer.setupContent();
	window.plugin.cassandraNeutralizer.loadLocal('cassandraNeutralizer');
	window.addPortalHighlighter(window.plugin.cassandraNeutralizer.highlighter.title, window.plugin.cassandraNeutralizer.highlighter);
	window.addHook('portalDetailsUpdated', window.plugin.cassandraNeutralizer.onPortalDetailsUpdated);
	window.addHook('iitcLoaded', window.plugin.cassandraNeutralizer.registerFieldForSyncing);
};

//PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


