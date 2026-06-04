function onloadInit() {
	eventLog = new EventLog();
	eventLog.reqLogData();
	showResultIcon(ERR_PENDING);
}
function reloadData() {
	if (typeof(eventLog) === "undefined" || !eventLog) {
		eventLog = new EventLog();
	}
	eventLog.reqLogData();
	showResultIcon(ERR_PENDING);
}
function submitform() {

}