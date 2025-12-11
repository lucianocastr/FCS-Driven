var timerId;
var Texts;
var monitor;
var tags;
var NFPAcfg;
var page;
var version;
var config;
var factory;
var startPage = true;
var version;
var serNr;
var waitACK = false;
var isGeneralFail = false;
var nrOfRemotes = 2;
var frameSeparator = "\t\t\t";
var globalConfigLength = 2876;
var configLength = 1572;
var remoteHeaderLength = 4;
var remoteGlobalConfResponseValid = [false, false];
var reloadIcon = false;

function onloadInit() {
	Texts = TextEn;
	monitor = new MonitorGlobal();
	page = new Page();
	config = [];
	factory = [];
	NFPAcfg = [];
	tags = [];
	version = [];
	serNr = [];
	for ( var i = 0; i <= nrOfRemotes; i++ ) {
		config.push(new Config());
		factory.push(new Factory());
		NFPAcfg.push(new NFPAconf());
		tags.push(new Tags());
		version.push(new Version());
		serNr.push(new SerialNrT());
	}

	guiBlocked(false);
	setTimeout(function() {statusWatchdog();}, 15000);
	if (typeof(window.parent.navi.document.alreadyLoaded) === 'undefined' 
	    || !window.parent.navi.document.alreadyLoaded) {
		startDisplay();
		return;
	}
	var frm = window.parent.navi.serNrFrame;
	startDisplay();
	window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);

}
function isEqualFreqEn(){
	var confMask = localStorage.getItem('confOpt'+Prjstr+window.location.host);
	if (typeof(confMask)==="undefined" || confMask==null) confMask = 0;
	return (DAScentric?false:(confMask & 0x1)!=0);
}
var tool_enable = function(fact) {
	var tool_en,result=false;
	if (!isEqualFreqEn()) return false;
	for (var nr=0;nr<=nrOfRemotes;nr++){
		var tool_en = [fact[nr].chBandEnabled[0],fact[nr].chBandEnabled[1]];
		if ((fact[nr].fstop[1]-fact[nr].fstart[1])!=(fact[nr].fstop[0]-fact[nr].fstart[0])) tool_en[0] = false;
		if ((fact[nr].fstop[3]-fact[nr].fstart[3])!=(fact[nr].fstop[2]-fact[nr].fstart[2])) tool_en[1] = false;
		result = result || (tool_en[0] || tool_en[1]);
	}
	return result;
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
		globalConfigReq();
		return;
	}
	str = correctASCII(str);
	var deviceStr = str.split(frameSeparator);
	if (deviceStr.length < (1+nrOfRemotes)) {
		alert("Error retrieving info. Global conf error subframes nr="+deviceStr.length);	// debug
	}
	if (deviceStr[0].length < globalConfigLength) {
		alert("Error retrieving info. Global conf master length="+deviceStr[0].length);	// debug
	}
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		remoteGlobalConfResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
		if (remoteGlobalConfResponseValid[n]) {
			if (deviceStr[remoteNr].length < globalConfigLength+remoteHeaderLength) {
				//alert("Error retrieving info. Global conf remote length="+deviceStr[remoteNr].length);	// debug
				remoteGlobalConfResponseValid[n] = false;
			}
		}
	}
	// master
	parseGlobalConfigUnit(deviceStr[0], 0);
	version[0].render(factory[0].ethernetModuleNotInstalled);
	window.parent.navi.hideIPconf(factory[0].ethernetModuleNotInstalled);
	// remotes
	for (var n = 0; n < nrOfRemotes; n++) {
		var remoteNr = n+1;
		if (!remoteGlobalConfResponseValid[n]) {
			continue;
		}
		parseGlobalConfigUnit(deviceStr[remoteNr].substr(remoteHeaderLength), remoteNr);
	}

	serNr[0].render();
	end_loading();
}
function parseGlobalConfigUnit(str, n) {
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srEq = srarr[2];
	var srSerNr = srarr[3];
	var srTag = srarr[4];
	var srVersion = srarr[5];
	var srNFPA = srarr[6]; 

	serNr[n].parse(srSerNr);
	version[n].parse(srVersion);
	if (n == 0) {
		version[n].store(srVersion);
	}

	tags[n].parseRawText(srTag);

	if (n == 0) {
		window.parent.navi.factoryFrame = srFact;
	}
	localStorage.setItem("Factory_"+n+"_"+Prjstr+window.location.host, srFact);
	factory[n].parse(srFact);


	window.parent.navi.confFrame = srConf;
	config[n].parse(srConf,factory[n]);
	config[n].saveFrameStr(srConf,n);
	
	//if (n == 0) {
		window.parent.navi.confNfpaFrame[n] = srNFPA;
	//}
	NFPAcfg[n].parse(srNFPA);
}

function confsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { loadConfig(); }, tmout);
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

function loadConfig() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var sr = this.responseText;
				var deviceStr = sr.split(frameSeparator);
				if (deviceStr.length != 1+nrOfRemotes) {
					alert("Error retrieving info. Conf error subframes nr="+deviceStr.length);	// debug
					end_loading();
					return;
				}
				if (deviceStr[0].length < configLength) {
					alert("Error retrieving info. Conf master length="+deviceStr[0].length);	// debug
					end_loading();
					return;
				}
				window.parent.navi.confFrame = deviceStr[0];
				config[0].parse(deviceStr[0],factory[0]);
				config[0].saveFrameStr(deviceStr[0],0);
				
				for (var n = 0; n < nrOfRemotes; n++ ) {
					var remoteNr = n+1;
					remoteGlobalConfResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
					if (remoteGlobalConfResponseValid[n]) {
						if (deviceStr[remoteNr].length < configLength+remoteHeaderLength) {
							remoteGlobalConfResponseValid[n] = false;
							config[remoteNr].saveFrameStr("",remoteNr);
						}else{
							config[remoteNr].parse(deviceStr[n+1].substr(remoteHeaderLength),factory[n+1]);
							config[remoteNr].saveFrameStr(deviceStr[n+1].substr(remoteHeaderLength),remoteNr);
						}
					}else{
						config[remoteNr].saveFrameStr("",remoteNr);
					}
					
				}
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
	var tool_en = tool_enable(factory);
	window.parent.navi.filtRowDisplay(tool_en);
	// var serNr = window.parent.navi.serNr;
	page.show(tags, factory, version[0], serNr[0], config, NFPAcfg);
	for (var nr=0;nr<=nrOfRemotes;nr++){
		for (var band=0;band<2;band++){
			page.simplexSettingsDisable(nr,band);
			page.uldlLinkedDisable(nr,band);
		}
	}
	guiBlocked(false);
	page.remotesMainPowerLimitDLDisable();
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
								page.showStatus(monitor.monitorUnit);
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

function submitform(ndev, isReset, isolVerif, isolClear, clearErrors, forceSend, forcePaOn, forcePaOff) { //ndev indica a qué equipo se refieren el resto de argumentos
	var doReset = false;
	var doIsolVerif = false;
	var doIsolClear = false;
	var doClearErrors = false;
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
	if (typeof(clearErrors) != "undefined") {
		doClearErrors = clearErrors || false;
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
	//no se evalúa si el formaulario cambió a la espera de realizarlo por comparación de tramas
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

	var frmcnf = page.readTotalConfsFrm(ndev, doReset, doIsolVerif, doIsolClear, doClearErrors, doForceSend, doForcePaOn, doForcePaOff);
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

function toolSubmit(frms) {
	waitACK = true;
	clearTimeout(tmrIdStat);
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	var valid = [];
	for (var n=0;n<frms.length;n++){
		valid[n] = true;
		var header = parseInt(frms[n].frame.substring(0,2),16);
		if (header>0 && header<=nrOfRemotes && parseInt(frms[n].frame.substring(2,4),16)==1 && !remoteGlobalConfResponseValid[header-1])
			valid[n] = false;
	}
	var frmToSend = [];
	for (var n=0;n<frms.length;n++){
		if (valid[n]) frmToSend.push(frms[n])
	}
	submitFrms(frmToSend);
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
		// clearTimeout(tmrIdStat);
		// page.close();
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
		for (var b = 0; b < 2; ++b) {
			for (var band = 0; band < 2; ++band) {
				for (var nr=0;nr<=nrOfRemotes;nr++){
					page.hpaSwDisableStateSet(b, band, nr, isDisable);
				}
			}
		}
	} catch (err) {}
}

function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 2000;
	} else {
		return 100;
	}
}
