// -----------------------------
// Calculate visible polygon area
// -----------------------------
var polygons = window.plugin.cassandraNeutralizer.getVisiblePolygons();

for (var i = 0; i < polygons.length; i++) {
	var polygon = polygons[i];
	var area = L.GeometryUtil.geodesicArea(polygon._latlngs);	// `L.GeometryUtil.geodesicArea` is from Draw Tools.
	var kmArea = Math.round(area/1000) / 1000;
	console.log(`${kmArea} km^2`);
}

// -----------------------------
// Number of portals (and selection info)
// -----------------------------
var selection = window.plugin.cassandraNeutralizer.getSelectedPortals();

// empty selection info
if (selection.polygons.length === 0) {
	console.warn(`
		No polygons are visible in this view.
		Note that the polygon must be fully visible (all corners must be in view).
	`.replace(/\t+/g, ''));
} else {
	console.log(`
		Visible polygon(s) ${selection.polygons.length}
		Portal(s): ${selection.portals.length}
	`.replace(/\t+/g, ''));
}


// -----------------------------
//  Collecting data for large areas (like for a whole city)
//  Note! DO NOT try to do this for a country. Will probably crash your browser.
// -----------------------------

// 1. Disable clearing portals out of screen
window.Render.prototype.clearPortalsOutsideBounds = function(bounds) {}
// 2. Disable deleting portals from list at all
window.Render.prototype.deletePortalEntity = function(guid) {}

// -----------------------------
//  Counting portals in large areas (partially or fully out of bounds)
// -----------------------------

// 1. Collect portals (use "Collecting data for large areas").

// 2. Make sure you get all polygons, not just those fully visible
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
		polygons.push(layer);
	});

	return polygons;
};

// 3. Use script in section: "Number of portals (and selection info)".
