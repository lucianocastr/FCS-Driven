<!--
var isRendered;
var timerId;
var factory;
var version;
var waitingACK;
var tags;
var confFrames;
var needConfUpdate;
var lastConfUpdate;
function onloadInit() {
	showResultIcon(ERR_NONE);
	waitingACK = false;
	Texts = TextEn;
	isRendered = false;
	needConfUpdate = false;
	lastConfUpdate = false;
	tags = new Array();
	for (var i = 0; i <= window.top.MaxRemotesNr+window.top.MaxExpansorNr; ++i)
		tags.push("");
	window.top.fiplexTagsStr = localStorage.getItem("tags_1dm4"+window.location.host);
	if (window.top.fiplexTagsStr!=null) parse_tags(window.top.fiplexTagsStr);
	factory = new Factory();
	confFrames = new Array();
	version = new Version();
	reloadingConf = false;
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
	//factReq();
	versionReq();
	reloadingConf = true;
}
function doOnUnload() {
	isRendered = false;
}
function versionReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				loadVersion();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { versionReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { versionReq(); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("version_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadVersion() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var err = version.parse(this.responseText);
				if (err) {
					versionReq();
					return;
				}
				version.render();
				version.store(this.responseText);
				//tagsReq();
				factReq();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadVersion(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			versionReq();
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/version.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}

function doStart() {
	if (!window.top.systemReady) {
		setTimeout(function() { doStart(); }, 1000);
		return;
	}
	window.top.fiplexSerialStr=localStorage.getItem("serial_1dm4"+window.location.host);
	setTimeout(function() {statusWatchdog();}, 15000);
	load_status();
}
function factReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				setTimeout(function() { load_fact(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.fiplexFactStr = this.responseText;
				window.parent.navi.factoryFrame = this.responseText;
				factory.parse(window.top.fiplexFactStr);
				localStorage.setItem("factory_1dm4"+window.location.host, window.top.fiplexFactStr);
				tagsReq();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
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
				localStorage.setItem("tags_1dm4"+window.location.host, window.top.fiplexTagsStr);
				confReq();
			}
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function confReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				setTimeout(function() { load_conf(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("conf_req="+1);
		xhr = null;
	} catch (err) {}
}

function load_conf() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.fiplexConfStr = this.responseText;
				var nr = getRemotesNrFromConf(window.top.fiplexConfStr,window.top.MaxRemotesNr);
				window.top.FiberMask = parseFiberMask(window.top.fiplexConfStr);
				localStorage.setItem("fibermask_1dm4"+window.location.host, window.top.FiberMask);
				window.top.mode = parseMode(window.top.fiplexConfStr);
				localStorage.setItem("mode_1dm4"+window.location.host, window.top.mode);
				window.top.NFPAMonitor = parseNFPAMonitor(window.top.fiplexConfStr);
				window.top.allowDisFilt = parseAllowDisFilt(window.top.fiplexConfStr);
				window.top.LinkedFreq = parseLinkedFreq(window.top.fiplexConfStr);
				var cfgarr = window.top.fiplexConfStr.split('\t');
				localStorage.setItem("cfg_1dm4"+window.location.host, cfgarr[0]);
				window.parent.navi.configFrame = cfgarr[0];
				window.top.redundedFiberRemotes = getRedundedFiberRemotes(false);
				window.top.redundedFiberRemotesIndex = getRedundedFiberRemotes(true);
				if (nr < 0 || nr > window.top.MaxRemotesNr) {
					setTimeout(function() { confReq(); }, 1500);
					restoreSmState();
					return;
				}
				renderConf(reloadAgain, reloadingConf);
				reloadAgain = false;
				reloadingConf = false;
				showResultIcon(ERR_NONE);
				if (window.top.firstLoad) {
					window.top.firstLoad = false;
				}
				restoreSmState();
				setTimeout(function() { load_status(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/update_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function renderConf(renderAgain, channelsEnabledOnly) {
	var nr = getRemotesNrFromConf(window.top.fiplexConfStr,window.top.MaxRemotesNr);
	var ne = getExpansorsNrFromConf(window.top.fiplexConfStr,window.top.MaxRemotesNr);
	if (typeof window.top.expansorNr == "undefined")
		window.top.expansorNr = ne;
	if ((typeof window.top.remotesNr == "undefined") || (nr != window.top.remotesNr)) {
		window.top.remotesNr = nr;
		window.top.remotesBitmask = parseRemotesBitmaskFromConf(window.top.fiplexConfStr);
		renderAgain = true;
	}
	var chBitMask = 0;
	for (var n = 0; n <= nr; ++n) {
		chBitMask |= parseChannelsEnabled(window.top.fiplexConfStr, n);
	}
	if (typeof window.top.showChannelsBitmask == "undefined" || 
	    (chBitMask != window.top.showChannelsBitmask && channelsEnabledOnly)) {
		window.top.showChannelsBitmask = chBitMask;
		renderAgain = true;
	}
	if (needConfUpdate) {
		renderAgain = true;
		if (chBitMask != window.top.showChannelsBitmask) {
			window.top.showChannelsBitmask = chBitMask;
		}
	}
	renderAgain=true; //Always renderPage
	if (renderAgain || !isRendered) {
		removeAllElements();
		renderPage(nr,ne);
	}
	parse_config(window.top.fiplexConfStr);
	parse_tags(window.top.fiplexTagsStr);
	tagsRender();
	if (renderAgain || !isRendered) {
		for (var n = 1; n <= window.top.MaxRemotesNr; ++n) {
			if (window.top.master_rx_loss_alarm[n] || masterFpgaAlarm) {
				hideUnitContent(n, true);
			}
		}
	}
	isRendered = true;
	initFormChangeCheck();
}

var tmrIdStat;
var oldStatusTimerId = 0;
function statusWatchdog() {
	if (typeof(tmrIdStat) !== "undefined" && tmrIdStat != null && !waitingACK) {
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
		if (waitingACK)
			return;
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var serverResponse = this.responseText;
				localStorage.setItem("stat_1dm4"+window.location.host, serverResponse);
				var nr = getRemotesNrFromStatus(serverResponse);
				var ne = getExpansorsNrFromStatus(serverResponse);
				window.top.NumFiberRemote = parseNumFiberRemote(serverResponse);
				var changed_rx_loss_mask = parse_status(serverResponse);
				if (changed_rx_loss_mask == 1)
					needConfUpdate = true;
				var doFastUpdate = false;
				if (!isRendered) {
					if (window.top.firstLoad || reloadAgain) {
						doFastUpdate = true;
					} else {
						parse_tags(window.top.fiplexTagsStr);
						factory.parse(window.top.fiplexFactStr);
						redrawAll(true);
						isRendered = true;
					}
				} else if (!isFpgaAlarm(serverResponse)) {
					if (reloadAgain) {
						doFastUpdate = true;
					} else if (nr < 0 || nr > window.top.MaxRemotesNr) {
						doFastUpdate = true;
					} else 	if (nr != window.top.remotesNr || needConfUpdate) {
						doFastUpdate = true;
					}
				}
				if (needConfUpdate && isAllRemoteConfValid()) {
					if (true) { //en lugar de lastConfUpdate
						lastConfUpdate = false;
						needConfUpdate = false;
					} else {
						lastConfUpdate = true;
					}
				}
				if (doFastUpdate)
					reloadData();
				else
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

var countConf;
var wasReset = false;

function submitform(reset_nr) {
	try {
		if (!checkChange()) {
			if (typeof(reset_nr) === "undefined" || reset_nr < 0) {
				return;
			}
		}
		format_config(window.top.fiplexConfStr, reset_nr);
		if (confFrames.length > 0){
			if (typeof window.top.submitLocked == "undefined") {
				window.top.submitLocked = false;
			}
			if (window.top.submitLocked) {
				setTimeout(function() { restoreSmState(); }, 15000);
				return;
			}
			showResultIcon(ERR_PENDING);
			xhrOnStart();
			clearTimeout(tmrIdStat);
			wasReset = reset_nr >= 0;
			waitingACK = true;
			submitframe();
		}
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}
function submitframe() {
	if (confFrames.length <= 0)
		return;
	var frm = confFrames[0];
	document.getElementById("ctl_conf_str").value = frm;
	var xhr = xmlreq();
	xhr.onreadystatechange  = function(ev) {
		if (this.readyState == 4 && this.status == 200) {
			countConf = 0;
			setTimeout(function() { check_result(); }, 1000 );
		}
	}
	xhr.onerror = function(ev) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
	xhr.ontimeout = function(ev) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
	xhr.open("POST", "/start.zhtml", true);
	xhr.timeout = 5000;
	xhr.send("ctl_conf_str="+frm);
	xhr = null;
}
(function() {
	onunload = function() {
		window.top.submitLocked = false;
		clicksDisable(false);
		inputDisable(false);
		cursorClear();
		showResultIcon(ERR_NONE);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	clicksDisable(true);
	inputDisable(true);
	cursorWait();
}

function restoreSmState() {
	window.top.submitLocked = false;
	clicksDisable(false);
	inputDisable(false);
	cursorClear();
	showResultIcon(ERR_NONE);
}
function xhrOnEnd() {
	confReq();
}

function check_result() {
	if (typeof countConf === "undefined")
		countConf = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			var error;
			if (this.readyState == 4 && this.status == 200) {
				error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++countConf < 40) {
						setTimeout(function() { check_result(); }, 1000);
						return;
					} else
						error = ERR_FAIL;
				}
				if (error == ERR_OK && confFrames.length > 1) {
					confFrames.splice(0, 1);
					submitframe();
				} else {
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
					waitingACK = false;
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

function clicksDisable(isDisable) {
	try {
		for (var i = 0; i <= window.top.MaxRemotesNr; ++i) {
			resetDisableStateSet(i, isDisable);
			hpaSwDisableStateSet(i, isDisable);
		}
	} catch (err) {}
}
// -->