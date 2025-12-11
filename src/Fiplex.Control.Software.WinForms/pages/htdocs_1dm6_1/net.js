<!--
var isRendered;
var timerId;
var factory;
var version;
var waitingACK;
var tags;
var confFrames;
var needConfUpdate;
var delays = new Delays();
var fiberPorts = [];
var waitingConf = false;
var statCtrl;
var fiberChanged = false;

function statusLoadControl() {
	var self = this;
	this.loadStatusSv = true;
	this.start = function() {
		self.loadStatusSv = true;
	}
	this.stop = function() {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		self.loadStatusSv = false;
	}
	this.isStopped = function() {
		return !self.loadStatusSv;
	}
}

function onloadInit() {
	showResultIcon(ERR_NONE);
	waitingACK = false;
	Texts = TextEn;
	isRendered = false;
	needConfUpdate = false;
	tags = new Array();
	for (var i = 0; i <= window.top.MaxRemotesNr+window.top.MaxExpansorNr; ++i)
		tags.push("");
	window.top.fiplexTagsStr = localStorage.getItem("tags_1dm6"+window.location.host);
	if (window.top.fiplexTagsStr!=null) parse_tags(window.top.fiplexTagsStr);
	factory = new Factory();
	confFrames = new Array();
	version = new Version();
	delays = new Delays();
	window.top.delays = localStorage.getItem("delay_1dm6"+window.location.host);
	if (window.top.delays != null) {
		delays.parse(window.top.delays);
	}
	reloadingConf = false;
	statCtrl = new statusLoadControl();
	statCtrl.start();
	guiBlocked(true);
	if (!window.top.systemReady) {
		rootEl = document.createElement("div");
		rootEl.id = "rootElement";
		rootEl.style.fontSize = "20px";
		document.getElementById("page").appendChild(rootEl);
		rootEl.innerHTML = "PLEASE,&nbsp;WAIT...\n";
		showResultIcon(ERR_PENDING);
	}
	doStart();
}

function doStart() {
	if (!window.top.systemReady) {
		setTimeout(function() { doStart(); }, 1000);
		return;
	}
	window.top.fiplexSerialStr=localStorage.getItem("serial_1dm6"+window.location.host);
	setTimeout(function() {statusWatchdog();}, 15000);
	load_status();
}

function reloadData() {
	guiBlocked(true);
	showResultIcon(ERR_PENDING);
	versionReq();
	reloadingConf = true;
	statCtrl.stop();
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
		xhr.send("versioneth_req="+1);
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
					versionReqNoEth();
					return;
				}
				version.render();
				version.store(this.responseText);
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
		xhr.open("GET", "/versioneth.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function versionReqNoEth() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				loadVersionNoEth();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { versionReqNoEth(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { versionReqNoEth(); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("version_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadVersionNoEth() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var err = version.parse(this.responseText);
				if (!err) {
					version.render();
					version.store(this.responseText);
				}
				factReq();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadVersionNoEth(); }, 2000);
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
				localStorage.setItem("factory_1dm6"+window.location.host, window.top.fiplexFactStr);
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

		xhr.open("GET", "/update_fact2.shtml?co="+Date.now(), true);
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
				localStorage.setItem("tags_1dm6"+window.location.host, window.top.fiplexTagsStr);
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
				localStorage.setItem("fibermask_1dm6"+window.location.host, window.top.FiberMask);
				window.top.mode = parseMode(window.top.fiplexConfStr);
				localStorage.setItem("mode_1dm6"+window.location.host, window.top.mode);
				window.top.NFPAMonitor = parseNFPAMonitor(window.top.fiplexConfStr);
				window.top.allowDisFilt = parseAllowDisFilt(window.top.fiplexConfStr);
				window.top.LinkedFreq = parseLinkedFreq(window.top.fiplexConfStr);
				var cfgarr = window.top.fiplexConfStr.split('\t');
				localStorage.setItem("cfg_1dm6"+window.location.host, cfgarr[0]);
				window.parent.navi.configArray = cfgarr;
				window.parent.navi.configFrame = cfgarr[0];
				window.top.redundedFiberRemotes = getRedundedFiberRemotes(false);
				window.top.redundedFiberRemotesIndex = getRedundedFiberRemotes(true);
				if (nr < 0 || nr > window.top.MaxRemotesNr) {
					setTimeout(function() { confReq(); }, 1500);
					return;
				}
				renderConf(reloadAgain, reloadingConf);
				reloadAgain = false;
				reloadingConf = false;
				if (window.top.firstLoad) {
					window.top.firstLoad = false;
				}
				loadDel();
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
	if ((typeof window.top.expansorNr == "undefined") || (ne != window.top.expansorNr)) {
		window.top.expansorNr = ne;
		renderAgain = true;
	}
	if ((typeof window.top.remotesNr == "undefined") || (nr != window.top.remotesNr)) {
		window.top.remotesNr = nr;
		window.top.remotesBitmask = parseRemotesBitmaskFromConf(window.top.fiplexConfStr);
		renderAgain = true;
	}
	var chBitMask = 0;
	for (var n = 0; n <= nr; ++n) {
		var r = computeRemNrInStat(n)
		chBitMask |= parseChannelsEnabled(window.top.fiplexConfStr, n, r);
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
	needConfUpdate = false;
	renderAgain=true; //Always renderPage
	if (renderAgain || !isRendered) {
		removeAllElements();
		renderPage(nr,ne);
		if (isGuiBlocked()) {
			guiBlocked(true);
		}
	}
	parse_config(window.top.fiplexConfStr);
	if (isGuiBlocked()) {
		guiBlocked(true);
	}
	parse_tags(window.top.fiplexTagsStr);
	tagsRender();
	if (renderAgain || !isRendered) {
		for (var n = 1; n <= window.top.MaxRemotesNr; ++n) {
			if (window.top.master_rx_loss_alarm[n] || masterFpgaAlarm) {
				hideUnitContent(n, true);
			}
		}
	}
	if (!isRendered) {
		autoUpdateSave(true);
		autoUpdateSet(true);
	}
	window.top.remotesStatMask = 0;
	isRendered = true;
	autoUpdateSet(autoUpdateRead());
	autoFiltEnSet(autoFiltEnRead());
	updateShAllChCheck();
	showWarnRemote(false);
	fiberChanged = false;
	initFormChangeCheck();
}

function loadDel() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				window.top.delays = this.responseText;
				localStorage.setItem("delay_1dm6"+window.location.host, window.top.delays);
				delays.parse(window.top.delays);
				gdRender(delays, fiberPorts);
				waitingConf = false;
				if (isSimplexConfErr()) {
					showWarnSimplex(true, simplexRemotesArr());
					alert(simplexErrorMessage());
				} else if (isSimplexFactErr())  {
					showWarnFactSimplex(true, simplexRemotesArr());
					alert(simplexErrorMessage());
				}
				statCtrl.start();
				setTimeout(function() { load_status(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); loadDel(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); loadDel(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/update_del.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

var tmrIdStat;
var oldStatusTimerId = 0;

function statusWatchdog() {
	if (typeof(tmrIdStat) !== "undefined" && tmrIdStat != null && !waitingACK) {
		if (oldStatusTimerId == tmrIdStat) {
			statCtrl.start();
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
		if (waitingACK || statCtrl.isStopped()) {
			return;
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var serverResponse = this.responseText;
				if (!isStatusFrmOk(serverResponse)) {
					tmrIdStat = setTimeout(function() { load_status(); }, 1000);
					return;
				}
				localStorage.setItem("stat_1dm6"+window.location.host, serverResponse);
				var nr = getRemotesNrFromStatus(serverResponse);
				if (nr < 0) {
					tmrIdStat = setTimeout(function() { load_status(); }, 1000);
					return;
				}
				var ne = getExpansorsNrFromStatus(serverResponse);
				window.top.NumFiberRemote = parseNumFiberRemote(serverResponse);
				var autoUpdt = isAutoUpdateEnabled();
				var changed_rx_loss_mask = 0;
				try {
					changed_rx_loss_mask = parse_status(serverResponse, autoUpdt);
				} catch(err) {}
				if (changed_rx_loss_mask == 1 && autoUpdt) {
					needConfUpdate = true;
				}
				if (changed_rx_loss_mask != 0 && !autoUpdt) {
					showWarnRemote(true);
					fiberChanged = true;
				}
				var doFastUpdate = false;
				if (!isRendered) {
					if (window.top.firstLoad || reloadAgain) {
						doFastUpdate = true;
					} else {
						parse_tags(window.top.fiplexTagsStr);
						factory.parse(window.top.fiplexFactStr);
						version.parse(version.retrieve());
						redrawAll(true);
						if (isGuiBlocked()) {
							guiBlocked(true);
						}
						isRendered = true;
					}
				} else if (!isFpgaAlarm(serverResponse)) {
					if (reloadAgain) {
						doFastUpdate = true;
					} else if (nr < 0 || nr > window.top.MaxRemotesNr) {
						doFastUpdate = true;
					} else if ((nr != window.top.remotesNr || needConfUpdate)) { 
						if (autoUpdt) {
							doFastUpdate = true;
						} else {
							showWarnRemote(true);
							fiberChanged = true;
						}
					}
				}
				if (needConfUpdate && (isAllRemoteConfValid() || factory.isTestMode())) {
					needConfUpdate = false;
				}
				if (doFastUpdate) {
					reloadData();
				} else {
					if (!waitingConf && !statCtrl.isStopped()) {
						if (isGuiBlocked()) {
							setTimeout(function() {
								guiBlocked(false);
							}, 2000)
						}
						tmrIdStat = setTimeout(function() { load_status(); }, 1000);
					}
				}
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

function submitClearCounters() {
	try {
		formatClearCounters(window.top.fiplexConfStr);
		if (confFrames.length > 0){
			if (typeof window.top.submitLocked == "undefined") {
				window.top.submitLocked = false;
			}
			if (window.top.submitLocked) {
				setTimeout(function() { guiBlocked(false); }, 15000);
				return;
			}
			guiBlocked(true);
			showResultIcon(ERR_PENDING);
			statCtrl.stop();
			waitingACK = true;
			submitframe();
		}
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

function submitform(reset_nr) {
	try {
		if (!checkChange()) {
			if (typeof(reset_nr) === "undefined" || reset_nr < 0) {
				return;
			}
		}
		format_config(window.top.fiplexConfStr, reset_nr);
		if (isSimplexConfErr()) {
			if (typeof(reset_nr) === "undefined" || reset_nr < 0) {
				showWarnSimplex(true, simplexRemotesArr());
				alert(simplexErrorMessage());
				return;
			}
		} else if (isSimplexFactErr()) {
			if (typeof(reset_nr) === "undefined" || reset_nr < 0) {
				showWarnFactSimplex(true, simplexRemotesArr());
				alert(simplexErrorMessage());
				return;
			}
		}
		if (confFrames.length > 0){
			if (typeof window.top.submitLocked == "undefined") {
				window.top.submitLocked = false;
			}
			if (window.top.submitLocked) {
				setTimeout(function() { guiBlocked(false); }, 15000);
				return;
			}
			guiBlocked(true);
			showResultIcon(ERR_PENDING);
			statCtrl.stop();
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
		guiBlocked(false);
	};
})();

function xhrOnEnd() {
	guiBlocked(true);
	waitingConf = true;
	if (!isAutoUpdateEnabled() && fiberChanged) {
		tagsReq();
	} else {
		confReq();
	}
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