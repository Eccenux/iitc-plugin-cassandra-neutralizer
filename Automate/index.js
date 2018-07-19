import LogAnalysis from './LogAnalysis.js';
import LogEntry from './LogEntry.js';
import Portal from './Portal.js';
//import chat from './_save/chat.js';
//import portals from './_save/portals.js';

//console.log(chat);
//console.log(portals);
//let portal = new Portal('blah');

let logAnalysis = new LogAnalysis();
let latlngToGuid = logAnalysis.mapLatLong(portals);
console.log(latlngToGuid);