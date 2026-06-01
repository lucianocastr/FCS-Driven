var timerId;
var Texts;
var monitor;
var tags;
var page;
var version;
var config;
var factory;
var startPage = true;
var version;
var serNr;
var waitACK = false;
var isGeneralFail = false;
var reloadIcon = false;
var srMasterFwOptions;

function onloadInit() {
	Texts = TextEn;
	monitor = new Monitor();
	page = new Page();
	config = new Config();
	factory = new Factory();
	tags = new Tags();
	version = new Version();
	serNr = new SerialNrT();

	guiBlocked(false);
	setTimeout(function() {statusWatchdog();}, 15000);
	if (typeof(window.parent.navi.document.alreadyLoaded) === 'undefined' 
	    || !window.parent.navi.document.alreadyLoaded) {
		startDisplay();
		return;
	}
	var frm = window.parent.navi.serNrFrame;
	startDisplay();

}

var loadVersionCounter;
var loadVersionMaxCount = 30;
function sendDateTime() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				if (typeof window.top.dateIsSet === "undefined" || !window.top.dateIsSet) {
					window.top.dateIsSet = true;
				}
				setTimeout(function() { reloadData(); }, 300);
			}
		}
		var currentDate = new Date();
		var timeSecs = Math.round(currentDate.getTime()/1e3);
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("time_align_str="+hexformat(timeSecs,8));
		xhr = null;
	} catch (err) {}
}
function startDisplay() {
	page.drawMsg("PLEASE,&nbsp;WAIT.&nbsp;LOADING...");
	loadVersionCounter = 0;
	
	// for TEST purposes only - to be removed
	// window.top.dateIsSet = true;
	
	if (typeof window.top.dateIsSet === "undefined" || !window.top.dateIsSet) {
		window.top.dateIsSet = false;
		sendDateTime();
	} else {
		setTimeout(function() { reloadData(); }, 100);
	}
}
function reloadData(){
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
	} catch(err) {}
	showResultIcon(ERR_PENDING);
	waitACK = false;
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
				timerId = setTimeout(function() { loadConfigGlobal(); }, 100);
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
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		timerId = setTimeout(function() { globalConfigReq(); }, 100);
		return;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 6) {
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srSerNr = srarr[2];
	var srTag = srarr[3];
	var srVersion = srarr[4];
	srMasterFwOptions = srarr[5];

	serNr.parse(srSerNr);
	version.parse(srVersion);
	version.store(srVersion);
	tags.parseRawText(srTag);
	
	localStorage.setItem("Tag_"+Prjstr+window.location.host, srTag);
	factory.parse(srFact);
	localStorage.setItem("Factory_"+Prjstr+window.location.host, srFact);
	window.parent.navi.factoryFrame = srFact;
	window.parent.navi.confFrame = srConf;
	localStorage.setItem("FW"+Prjstr+window.location.host, factory.commonUl?0:1);
	version.render(factory.ethernetModuleNotInstalled);
	window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);
	config.parse(srConf,factory);
	config.saveFrameStr(srConf);


	serNr.render();
	end_loading();
}

function end_loading() {
	version.render(factory.ethernetModuleNotInstalled);
	window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);
	window.parent.navi.document.alreadyLoaded = true;
	page.show(tags, factory, version, serNr, config);
	guiBlocked(false);
	showResultIcon(ERR_NONE);
	reloadIcon = false;
	tmrIdStat = setTimeout(function() { load_status(); }, 100);
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
	var tmout = computeTimeoutReqMs();
	var timeoutMs = isFileOpBusy() ? 10000 : tmout;
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					if (!waitACK){
						monitor.parse(this.responseText,factory);
						/*if ( monitor.isZeros ) {
							var msg = "ALERT: HARDWARE FAIL";
							page.drawMsg(msg);
							isGeneralFail = true;
						} else {*/
							localStorage.setItem("Status"+Prjstr+window.location.host, this.responseText);
							if ( isGeneralFail ) {
								onloadInit();
								isGeneralFail = false;
								// startDisplay();
							} else {
								page.showStatus(monitor);
								isGeneralFail = false;
							}
						//}
					}
				}
				
				if (!waitACK){
					tmrIdStat = setTimeout(function() { load_status(); }, timeoutMs);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			if (!waitACK){
				tmrIdStat = setTimeout(function() { load_status(); }, tmout);
			}
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			if (!waitACK){
				tmrIdStat = setTimeout(function() { load_status(); }, tmout);
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

var countConf;

function submitform(isReset, clearErrors, forceSend, setDefaultRelay) {
	if (page.masterFimwareIsChanged()) {
		if (typeof window.top.submitLocked === "undefined")
			window.top.submitLocked = false;
		if (window.top.submitLocked) {
			setTimeout(function() { guiBlocked(false); }, 15000);
			return;
		}
		var newFirmwareNr = page.masterFirmwareGet();
		var message = "Please, confirm loading new band firmware "+
			(newFirmwareNr==0?"700/800 MHz":"VHF/UHF")+
			".\nThis action will take up to 30 seconds to complete."+
			".\nAny other configuration changes will be discarded.";
		if (!confirm(message)) {
			page.masterFirmwareSet(self.factory.commonUl ? 0:1);
			return;
		}
		var firstByte=0;
		try {
			firstByte = parseInt(srMasterFwOptions.substr(0, 2), 16);
			firstByte &= 0xFE;
		} catch(e){}
		firstByte += (newFirmwareNr & 0x01);
		var frm = hexformat(firstByte ,2)+srMasterFwOptions.substring(2);
		clearTimeout(tmrIdStat);
		waitACK = true;
		showResultIcon(ERR_PENDING);
		xhrOnStart();
		options_str = frm;
		var frms = [];
		frms.push({type: 'options_str=', frame: frm});
		submitFrms(frms);
		return;
	}
	var doReset = false;
	var doClearErrors = false;
	var doForceSend = false;
	var doSetDefaultRelay = false;
	
	
	if (typeof(setDefaultRelay) !== "undefined") {
		doSetDefaultRelay = setDefaultRelay || false;
	}
	if (typeof(isReset) !== "undefined") {
		doReset = isReset || false;
	}
	if (typeof(clearErrors) != "undefined") {
		doClearErrors = clearErrors || false;
	}
	if (typeof(forceSend) != "undefined") {
		doForceSend = forceSend || false;
	}
	//no se evalúa si el formulario cambió para poder forzar freq remoto = freq master
	/*if (!checkChange() && !doReset && !doIsolVerif && !doIsolClear && !doClearErrors && !doForceSend)	{
		return;
	}*/
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

	var frmcnf = page.readConfsFrm(doReset, doClearErrors, doForceSend, doSetDefaultRelay);
	if (frmcnf.length == 0) {
		waitACK = false;
		setTimeout(function() { load_status(); }, 1000);
		guiBlocked(false);
		return;
	}
	var frms = [];
	for ( var i = 0; i < frmcnf.length; i++ ) {
		frms.push({type: 'ctl_conf_str=', frame: frmcnf[i]});
	}
	submitFrms(frms);
}
function submitFrm(frm){
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

	var frms = [];
	frms.push({type: 'ctl_conf_str=', frame: frm});
	submitFrms(frms);
}

function toolSubmit(frms) {
	waitACK = true;
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
		if (frm[0].type == 'ctl_conf_str=') {
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
	};
})();
function xhrOnStart() {
	guiBlocked(true);
}
function xhrOnEnd() {
	waitACK = false;	
	globalConfigReq();
	page.deepDischarge.clearDeepDischargeButtonClicked();
}

function clicksDisable(isDisable) {
	try {
		page.resetDisableStateSet(isDisable);
	} catch (err) {}
}
