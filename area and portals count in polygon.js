//
// Calculate visible polygon area
var polygons = window.plugin.cassandraNeutralizer.getVisiblePolygons();

for (var i = 0; i < polygons.length; i++) {
	var polygon = polygons[i];
	var area = L.GeometryUtil.geodesicArea(polygon._latlngs);	// `L.GeometryUtil.geodesicArea` is from Draw Tools.
	var kmArea = Math.round(area/1000) / 1000;
	console.log(`${kmArea} km^2`);
}

//
// Number of portals (and selection info)
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
