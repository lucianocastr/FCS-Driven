var timerId;
var Texts;
var monitor;
var tags;
var factory;
var NFPAcfg;
var page;
var version;
var config;
var startPage = true;
var serNr;
var waitACK = false;
var isGeneralFail = false;

function onloadInit() {
	Texts = TextEn;
	tags = new Tags();
	factory = new Factory();
	monitor = new Monitor();
	NFPAcfg = new NFPAconf(); 
	page = new Page();
	version = new Version();
	config = new Config();
	serNr = new SerialNrT();

	guiBlocked(false);
	setTimeout(function() {statusWatchdog();}, 15000);
	if (typeof(window.parent.navi.document.alreadyLoaded) === 'undefined' 
	    || !window.parent.navi.document.alreadyLoaded) {
		startDisplay();
		return;
	}
	// var serNr = window.parent.navi.serNr;
	var frm = window.parent.navi.serNrFrame;
	if (!frm) {
		startDisplay();
		return;
	}
	if (serNr.parse(frm) < 0) {
		startDisplay();
		return;
	}
	srNr.render();
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
	window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);
	window.parent.navi.filter_help_args();
	window.parent.navi.filterTool();

	if (typeof(window.parent.navi.confFrame) !== 'undefined') {
		config.parse(window.parent.navi.confFrame);
	}
	var tool_en = [factory.chBandEnabled[0],factory.chBandEnabled[1]];
	if ((factory.fstop[1]-factory.fstart[1])!=(factory.fstop[0]-factory.fstart[0])) tool_en[0] = false;
	if ((factory.fstop[3]-factory.fstart[3])!=(factory.fstop[2]-factory.fstart[2])) tool_en[1] = false;
	window.parent.navi.filtRowDisplay(tool_en[0] || tool_en[1]);
	page.show(tags, factory, version, serNr, config);
	load_status();
}
var loadVersionCounter;
var loadVersionMaxCount = 30;
function startDisplay() {
	page.drawMsg("PLEASE,&nbsp;WAIT.&nbsp;LOADING...");
	loadVersionCounter = 0;
	setTimeout(function() { reloadData(); }, 100);
}
function reloadData(){
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
	} catch(err) {}
	showResultIcon(ERR_PENDING);
	// versionReq();
	globalConfigReq();
}

function globalConfigReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { loadConfigGlobal(); }, tmout);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { globalConfigReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { globalConfigReq(); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("global_req="+1);
		xhr = null;
	} catch (err) {}
}

function loadConfigGlobal() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				parseGlobalConfig(this.responseText);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadConfigGlobal(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadConfigGlobal(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/global_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function parseGlobalConfig(str) {
	if ( typeof(str) === 'undefined' || str === null ) {
		versionReq();
		return;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		versionReq();
		return;
	}
	//localStorage.setItem("GlobalConfig"+Prjstr+window.location.host, str);
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srEq = srarr[2];
	var srSerNr = srarr[3];
	var srTag = srarr[4];
	var srVersion = srarr[5];
	var srNFPA = srarr[6]; 

	serNr.parse(srSerNr);
	serNr.render();

	window.parent.navi.versionFrame = srVersion;
	version.parse(srVersion);
	version.store(this.responseText);

	window.parent.navi.tagsFrame = srTag;
	tags.parseRawText(srTag);

	window.parent.navi.factoryFrame = srFact;
	factory.parse(srFact);
	localStorage.setItem("Factory"+Prjstr+window.location.host, srFact);

	version.render(factory.ethernetModuleNotInstalled);
	window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);

	window.parent.navi.confFrame = srConf;
	config.parse(srConf);
	config.saveFrameStr(srConf);
	window.parent.navi.confNfpaFrame = srNFPA;
	NFPAcfg.parse(srNFPA);
	end_loading();
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
					tagsReq();
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
				version.render(factory.ethernetModuleNotInstalled||false);
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
				var sr = correctASCII(this.responseText);
				window.parent.navi.factoryFrame = sr;
				factory.parse(sr);
				localStorage.setItem("Factory"+Prjstr+window.location.host, correctASCIIOnlyText(sr));
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

function confsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { loadConfigAlt(); }, tmout);
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
		xhr.timeout = 10000
		var req =  "conf_req=1";
		xhr.send(req);
		xhr = null;
	} catch (err) {}
}

function loadConfigAlt() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var sr = this.responseText;
				window.parent.navi.confFrame = sr;
				config.parse(sr);
				config.saveFrameStr(sr);
				end_loading();
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
		xhr.open("GET", "/update_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function end_loading() {
	window.parent.navi.filter_help_args(); 
	window.parent.navi.filterTool();
	window.parent.navi.document.alreadyLoaded = true;
	var tool_en = [factory.chBandEnabled[0],factory.chBandEnabled[1]];
	if ((factory.fstop[1]-factory.fstart[1])!=(factory.fstop[0]-factory.fstart[0])) tool_en[0] = false;
	if ((factory.fstop[3]-factory.fstart[3])!=(factory.fstop[2]-factory.fstart[2])) tool_en[1] = false;
	window.parent.navi.filtRowDisplay(tool_en[0] || tool_en[1]);
	var serNr = window.parent.navi.serNr;
	page.show(tags, factory, version, serNr, config, NFPAcfg);
	guiBlocked(false);
	for (var band=0;band<2;band++){
		page.simplexSettingsDisable(band);
		page.uldlLinkedDisable(band);
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
					if ( monitor.isZeros ) {
						var msg = "ALERT: HARDWARE FAIL";
						page.drawMsg(msg);
						isGeneralFail = true;
					} else {
						if ( isGeneralFail ) {
							onloadInit();
							isGeneralFail = false;
							// startDisplay();
						} else {
							page.showStatus(monitor);
							isGeneralFail = false;
						}
					}
				}
				var timeoutMs = isFileOpBusy() ? 10000 : computeTimeoutReqMs();
				tmrIdStat = setTimeout(function() { load_status(); }, timeoutMs);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 100);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 100);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

var countConf;

function submitform(isReset, isolVerif, isolClear, band, forceSend, forcePaOn, forcePaOff) {
	var doReset = false;
	var doIsolVerif = false;
	var doIsolClear = false;
	var doForceSend = false;
	var doForcePaOn = [[false,false],[false,false]];
	var doForcePaOff = [[false,false],[false,false]];	
	if (typeof(isReset) !== "undefined") {
		doReset = isReset || false;
	}
	if (typeof(isolVerif) != "undefined") {
		doIsolVerif = isolVerif || false;
	}
	if (typeof(isolClear) != "undefined") {
		doIsolClear = isolClear || false;
	}
	if (typeof(forceSend) != "undefined") {
		doForceSend = forceSend || false;
	}
	if (typeof(forcePaOn) != "undefined") {
		for (var i=0;i<2;i++){
			for (var j=0;j<2;j++){
				doForcePaOn[i][j] = forcePaOn[i][j];
			}
		}
	}
	if (typeof(forcePaOff) != "undefined") {
		for (var i=0;i<2;i++){
			for (var j=0;j<2;j++){
				doForcePaOff[i][j] = forcePaOff[i][j];
			}
		}
	}
	if (!checkChange() && !doReset && !doIsolVerif && !doIsolClear && !doForceSend)	{
		return;
	}
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}

	clearTimeout(tmrIdStat);
	waitACK = true;
	showResultIcon(ERR_PENDING);
	xhrOnStart();

	var frmcnf = page.readConfsFrm(doReset, doIsolVerif, doIsolClear, band, doForceSend, doForcePaOn, doForcePaOff);
	if (frmcnf.length == 0) {
		guiBlocked(false);
		return;
	}
	var frms = [];
	frms.push({type: 'ctl_conf_str=', frame: frmcnf[0]});
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
	waitACK = false;	
	confsReq();
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
		return 1000;
	} else {
		return 100;
	}
}
