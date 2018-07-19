/**
 * Log entry from analysis perspective.
 * 
 * Warning! Due to technical constraints `guid` is actually a key like:
 * `${lat};${lng}`
 * 
 * Note! Expected log/chat format is:
	{
		0: timestamp,
		1: whatever,
		2: chatRowHtml,
		3: username
	}
 */
class LogEntry {
	constructor(value, key) {
		// basic data
		/**
		 * Key of the log entry from `window.chat._public.data`.
		 */
		this.key = key;
		/**
		 * Log entry (action) timestamp.
		 */
		this.time = value[0];
		this.username = value[3];

		// TEST-only
		/**
		 * Full HTML text.
		 * REMOVE ME! Added for debugging only. Makes the object significantly larger.
		 */
		this.tempText = value[2];

		// parsed
		let parsed = this.parseHtml(value[2]);
		/**
		 * Action code name.
		 */
		this.action = parsed.action;
		/**
		 * Main/1st portal guid.
		 */
		this.guid = parsed.guids[0];
		/**
		 * All guids (may be more then one e.g. for links).
		 */
		this.guids = parsed.guids;
	}

	/**
	 * Parse log row.
	 * 
	 * Note! This is optimized for neutralization analysis. Not all actions are recognized.
	 */
	parseHtml(html) {
		let parsed = {
			action : 'unknown',
			guids : [],
		}

		// actions
		if (html.search(/<td>\s*destroyed a Resonator\b/) >= 0) {
			parsed.action = 'resKill';
		}
		else if (html.search(/<td>\s*captured\b/) >= 0) {
			parsed.action = 'capture';
		}

		// portal(s) identity
		html.replace(/selectPortalByLatLng\s*\(\s*([\d\.]+),\s*([\d\.]+)\)/g, function(a, lat, lng){
			let latlngKey = `${lat};${lng}`;
			parsed.guids.push(latlngKey);
		});

		return parsed;
	}
}

// Example HTML
/*
<tr><td>
	<time title=\"2018-07-18 23:09:52&lt;small class=&quot;milliseconds&quot;&gt;.411&lt;/small&gt;\" data-timestamp=\"1531948192411\">23:09</time>
	</td><td>
	<span class=\"invisep\">&lt;</span>
	<mark class=\"nickname\" style=\"cursor:pointer; color:#03DC03\">Jarvis</mark>
	<span class=\"invisep\">&gt;</span>
	</td>
	<td> destroyed a Resonator on 
	<a onclick=\"window.selectPortalByLatLng(54.519563, 18.547142);return false\" 
	title=\"Kościuszki Square 8, Gdynia, Poland\" 
	href=\"/intel?ll=54.519563,18.547142&z=17&pll=54.519563,18.547142\" 
	class=\"help\">Gemini, tablica</a>
</td></tr>
*/