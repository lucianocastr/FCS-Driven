<!--
var isRendered;
var timerId;
var tags;

function onloadInit() {
	showResultIcon(ERR_NONE);
	Texts = TextEn;
	isRendered = false;
	if (!window.top.systemReady) {
		rootEl = document.createElement("div");
		rootEl.id = "rootElement";
		rootEl.style.fontSize = "20px";
		document.getElementById("page").appendChild(rootEl);
		rootEl.innerHTML = "PLEASE,&nbsp;WAIT...\n";
		setTimeout(function() { showResultIcon(ERR_PENDING); }, 500);
	}
	doStart();
}
function reloadData() {
	showResultIcon(ERR_PENDING);
	tagsReq();
}
function doOnUnload() {
	isRendered = false;
}
function doStart() {
	if (!window.top.systemReady) {
		setTimeout(function() { doStart(); }, 1000);
		return;
	}
	window.top.fiplexSerialStr = localStorage.getItem("serial_1de"+window.location.host);
	setTimeout(function() {statusWatchdog();}, 15000);
	tagsReq();
}
function tagsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				setTimeout(function() { load_tags(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("tags_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.fiplexTagsStr = this.responseText;
				localStorage.setItem("tags_1de"+window.location.host, window.top.fiplexTagsStr);
				tagRender();
				setTimeout(function() { load_status(); }, 100);
			}
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
var tmrIdStat;
var oldStatusTimerId = 0;
function statusWatchdog() {
	if (typeof(tmrIdStat) !== "undefined" && tmrIdStat != null) {
		if (oldStatusTimerId == tmrIdStat) {
			tmrIdStat = setTimeout(function() {load_status();}, 1000);
		} else {
			oldStatusTimerId = tmrIdStat;
		}
		setTimeout(function() { statusWatchdog(); }, 15000);
	}
}
function load_status() {
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var serverResponse = this.responseText;
				localStorage.setItem("stat_1de"+window.location.host, serverResponse);
				var st = new Status(serverResponse);
				renderStatus(st);
				showResultIcon(ERR_NONE);
				if (!isRendered) {
					redrawAll();
					isRendered = true;
				}
				tmrIdStat = setTimeout(function() { load_status(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function submitform(x) {
}
(function() {
	onunload = function() {
		cursorClear();
		showResultIcon(ERR_NONE);
	};
})();

function restoreSmState() {
	window.top.submitLocked = false;
	inputDisable(false);
	cursorClear();
	showResultIcon(ERR_NONE);
}
function xhrOnEnd() {
	isRendered = false;
	reloadData();
}
// -->