var timerId;
var Texts;
var monitor;
var tags;
var factory;
var page;
var version;
var freqs;
var confs;
var startPage = true;
var fwHasChanged = false;
var revisionNr;
var serNr;

function onloadInit() {
	Texts = TextEn;
	tags = new Tags();
	factory = new Factory();
	monitor = new Monitor();
	page = new Page();
	version = new Version();
	freqs = new Frequency();
	confs = new Conf();
	confAdj = new ConfAdj();
	guiBlocked(false);
	setTimeout(function() {statusWatchdog();}, 15000);
	if (typeof(window.parent.navi.document.alreadyLoaded) === 'undefined' 
	    || !window.parent.navi.document.alreadyLoaded) {
		startDisplay();
		return;
	}
	var serNr = window.parent.navi.serNr;
	if ((typeof(serNr) === 'undefined')
		|| (serNr === null)
		|| !serNr.isReady())
	{
		startDisplay();
		return;
	}
	var frm = window.parent.navi.versionFrame;
	if (!frm) {
		startDisplay();
		return;
	}
	if (version.parse(frm) < 0) {
		startDisplay();
		return;
	}
	frm = window.parent.navi.tagsFrame;
	if (frm) {
		tags.parse(frm);
	}
	frm = window.parent.navi.factoryFrame;
	if (frm) {
		if (factory.parse(frm) < 0) {
			startDisplay();
			return;
		}
	}
	var osc = factory.getOsc();
	var clk = factory.getClkNr();
	var adj = isDisplayAdj(factory, version);
	var showFilterTool = factory.isULDLFreqConsistent();
	window.parent.navi.filter_help_args(osc, clk, adj);
	window.parent.navi.filterTool(osc, clk);
	if (typeof(window.parent.navi.freqsFrame) !== 'undefined') {
		freqs.parseFrameStr(window.parent.navi.freqsFrame);
	}
	if (typeof(window.parent.navi.confsFrame) !== 'undefined') {
		confs.parseFrameStr(window.parent.navi.confsFrame);
	}
	if (typeof(window.parent.navi.confAdjFrame) !== 'undefined') {
		confAdj.parseFrameStr(window.parent.navi.confAdjFrame);
	}
	// if (version.isFwBwAdj()) {
	if (isDisplayAdj(factory, version)) {
		window.parent.navi.filtRowDisplay(false);
		page.show(tags, factory, version, confAdj);
	} else {
		window.parent.navi.filtRowDisplay(showFilterTool);
		page.show(tags, factory, version, confs, freqs, serNr);
	}
	load_status();
}
var loadVersionCounter;
var loadVersionMaxCount = 30;
function startDisplay() {
	page.drawMsg("PLEASE,&nbsp;WAIT.&nbsp;LOADING...");
	loadVersionCounter = 0;
	setTimeout(function() { reloadData(); }, 1000);
}
function reloadData(){
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
	} catch(err) {}
	showResultIcon(ERR_PENDING);
	versionReq();
}
function versionReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				if (fwHasChanged) {
					fwHasChanged = false;
					timerId = setTimeout(function() { loadVersion(); }, 3000);
				} else {
					loadVersion();
				}
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
				} else if (version.isFwNull()) {
					if (++loadVersionCounter > loadVersionMaxCount) {
						loadVersionCounter = loadVersionMaxCount;
						var msg = "PLEASE,&nbsp;WAIT.&nbsp;LOADING...";
						msg += "<br>";
						msg += "ALERT: HARDWARE FAIL";
						page.drawMsg(msg);
					}
					setTimeout(function() {versionReq();}, 1000);
					return;
				}
				version.render();
				version.store(this.responseText);
				window.parent.navi.versionFrame = this.responseText;
				iC = 0;
				tagsReq();
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
				if (fwHasChanged) {
					fwHasChanged = false;
					timerId = setTimeout(function() { loadVersionNoEth(); }, 3000);
				} else {
					loadVersionNoEth();
				}
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
					window.parent.navi.versionFrame = this.responseText;
				}
				tagsReq();
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
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { load_fact(); }, tmout);
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
				var sr = this.responseText;
				window.parent.navi.factoryFrame = sr;
				factory.parse(sr);
				localStorage.setItem("Factory"+Prjstr+window.location.host, sr);
				confsReq();
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

function isDisplayAdj(factory, version) {
	if (!factory.isDualFwAllowed()) {
		return version.isFwBwAdj();
	}
	if (typeof(revisionNr) === 'undefined') {
		return version.isFwBwAdj();
	}
	return (revisionNr == 1);
}

function confsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { loadConfs(); }, tmout);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confsReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		// var req = version.isFwBwAdj() ? "conf_adj_req=1" : "confs_req=1";
		var req = isDisplayAdj(factory, version) ? "conf_adj_req=1" : "confs_req=1";
		xhr.send(req);
		xhr = null;
	} catch (err) {}
}

function loadConfs() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var sr = this.responseText;
				// if (version.isFwBwAdj()) {
				if (isDisplayAdj(factory, version)) {
					window.parent.navi.confAdjFrame = sr;
					confAdj.parseFrameStr(sr);
					confAdj.saveFrameStr(sr);
					end_loading();
				} else {
					window.parent.navi.confsFrame = sr;
					confs.parseFrameStr(sr);
					confs.saveFrameStr(sr);
					freqsReq();
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confsReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };
		var req;
		// if (version.isFwBwAdj()) {
		if (isDisplayAdj(factory, version)) {
			req = "/update_conf.shtml?co="+Date.now();
		} else {
			req = "/update_confs.shtml?co="+Date.now();
		}
		xhr.open("GET", req, true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function freqsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { load_freqs(); }, tmout);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { freqsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { freqsReq(); }, 2000);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("freq_req="+1);
		xhr = null;
	} catch (err) {}
}

function load_freqs() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var sr = this.responseText;
				window.parent.navi.freqsFrame = sr;
				freqs.parseFrameStr(sr);
				freqs.saveFrameStr(sr);
				end_loading();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { freqsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { freqsReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_freq.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function end_loading() {
	var osc = factory.getOsc();
	var clk = factory.getClkNr();
	var adj = isDisplayAdj(factory, version);
	var showFilterTool = factory.isULDLFreqConsistent();
	window.parent.navi.filter_help_args(osc, clk, adj);
	window.parent.navi.filterTool(osc, clk);
	window.parent.navi.document.alreadyLoaded = true;
	// if (version.isFwBwAdj()) {
	if (isDisplayAdj(factory, version)) {
		window.parent.navi.filtRowDisplay(false);
		page.show(tags, factory, version, confAdj);
	} else {
		window.parent.navi.filtRowDisplay(showFilterTool);
		var serNr = window.parent.navi.serNr;
		page.show(tags, factory, version, confs, freqs, serNr);
	}
	guiBlocked(false);
	page.uldlLinkedDisable();
	if (!page.isAdj()) {
		page.simplexSettingsDisable();
	}
	tmrIdStat = setTimeout(function() { load_status(); }, 100);
}

function tagsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				timerId = setTimeout(function() { load_tags(); }, 1000);
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
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var frm = this.responseText;
				window.parent.navi.tagsFrame = frm;
				tags.parse(frm);
				factReq();
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
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
		setTimeout(function() { statusWatchdog(); }, 65000);
	}
}

function load_status() {
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					monitor.parse(this.responseText);
					page.showStatus(monitor);
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
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

var countConf;

function submitform(isReset, fwChange, fwNr, isolVerif, isolClear) {
	var doReset = false;
	var doFwChg = false;
	var doIsolVerif = false;
	var doIsolClear = false;
	if (typeof(isReset) !== "undefined") {
		doReset = isReset || false;
	}
	if (typeof(fwChange) !== "undefined") {
		doFwChg = fwChange || false;
	}
	if (typeof(isolVerif) != "undefined") {
		doIsolVerif = isolVerif || false;
	}
	if (typeof(isolClear) != "undefined") {
		doIsolClear = isolClear || false;
	}
	if (!checkChange() && !doReset && !doFwChg && !doIsolVerif && !doIsolClear) {
		return;
	}
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	if (!doReset && doFwChg) {
		fwHasChanged = true;
		if (typeof(fwNr) !== 'undefined') {
			revisionNr = (fwNr == 0 ? 0 : 1);
		}
	}
	clearTimeout(tmrIdStat);
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	if (page.isAdj()) {
		var frmcnf = page.readAdjConfsFrm(doReset, doFwChg);
		if (frmcnf === null) {
			guiBlocked(false);
			return;
		}
		var frms = [];
		frms.push({type: 'ctl_conf_str=', frame: frmcnf});
		submitFrms(frms);
		return;
	}
	var frmfrq = page.readFreqsFrm();
	if (frmfrq === null) {
		guiBlocked(false);
		return;
	}
	var frmcnf = page.readConfsFrm(doReset, doFwChg, doIsolVerif, doIsolClear);
	if (frmcnf.length == 0 && frmfrq.length == 0) {
		guiBlocked(false);
		return;
	}
	var frms = [];
	for (var i = 0; i < frmfrq.length && i < 2; ++i) {
		frms.push({type: 'frequency_str=', frame: frmfrq[i]});
	}
	for (var i = 0; i < frmcnf.length && i < 2; ++i) {
		frms.push({type: 'confs_str=', frame: frmcnf[i]});
	}
	submitFrms(frms);
}

function toolSubmit(frms) {
	clearTimeout(tmrIdStat);
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	submitFrms(frms);
}

function submitFrms(frms) {
	var self = this;
	if (typeof(frms) !== 'undefined') {
		self.frms = frms;
	}
	try {
		if (self.frms.length == 0) {
			showResultIcon(ERR_OK);
			setTimeout(function() { xhrOnEnd(); }, 1500);
			return;
		}
		var frm = self.frms.splice(0, 1);
		doSubmitFrm(frm);
	} catch (e) {}
}

function doSubmitFrm(frm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countConf = 0;
				setTimeout(function() { checkResultFrms(); }, 100);
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
		if (frm[0].type == 'confs_str=') {
			// confs_str = frm[0].frame;
			document.getElementById("confs_str").value = frm[0].frame;
		}
		if (frm[0].type == 'frequency_str=') {
			// frequency_str = frm[0].frame;
			document.getElementById("frequency_str").value = frm[0].frame;
		}
		if (frm[0].type == 'ctl_conf_str=') {
			// ctl_conf_str = frm[0].frame;
			document.getElementById("ctl_conf_str").value = frm[0].frame;
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send(frm[0].type+frm[0].frame);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

function checkResultFrms() {
	if (typeof countConf === "undefined")
		countConf = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++countConf < 60) {
						setTimeout(function() { checkResultFrms(); }, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}
				if (error == ERR_FAIL) {
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
					return;
				}
				submitFrms();
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
	} catch (err) {}
}

(function() {
	onunload = function() {
		guiBlocked(false);
		clearTimeout(tmrIdStat);
		page.close();
	};
})();
function xhrOnStart() {
	guiBlocked(true);
	window.parent.navi.filterHelpDisable();
}
function xhrOnEnd() {
	if (fwHasChanged) {
		versionReq();
	} else {
		confsReq();
	}
}

function clicksDisable(isDisable) {
	try {
		page.resetDisableStateSet(isDisable);
		for (var i = 0; i < 2; ++i) {
			page.hpaSwDisableStateSet(i, isDisable);
		}
	} catch (err) {}
}

function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 300;
	} else {
		return 100;
	}
}
