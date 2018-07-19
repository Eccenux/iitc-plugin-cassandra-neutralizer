import LogAnalysis from './LogAnalysis.js';
import LogEntry from './LogEntry.js';
import Portal from './Portal.js';
//import chat from './_save/chat.js';
//import portals from './_save/portals.js';

//console.log(chat);
//console.log(portals);
//let portal = new Portal('blah');

let analysis = new LogAnalysis(PLAYER.nickname, portals, chat);

// test/temp
let latlngToGuid = analysis.latlngToGuid;
let logEntries = analysis.logEntries;
window.logEntries = logEntries;

// test
function testInfo() {
	console.log(latlngToGuid);
	let guid = Object.keys(portals).pop();
	console.log(guid, portals[guid]);
	console.log(logEntries);
}
testInfo();

for (let i = 0; i < logEntries.length; i++) {
	const logEntry = logEntries[i];
	analysis.analyzeEntry(logEntry);
}
