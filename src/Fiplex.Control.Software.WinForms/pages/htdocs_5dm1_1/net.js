var timerId;
var Texts;
var monitor;
var tags;
var page;
var version;
var config;
var factory;
var startPage = true;
var serNr;
var waitACK = false;
var isGeneralFail = false;
var frameSeparator = "\t\t\t";
var reloadIcon = false;
var srMasterFwOptions;
var unitToMon = [0,-1];
var nrOfDevices = 1;
var currentDevice;
var forceReload = false;
var reqPartialConf = false;
var toIndex;
var partialConfParams;
var reloading = false;
var fibInfo = new fiberInfo(0);
var countReqs;
var MAX_REQS_CHKRES = 60;
var MAX_REQS_POSTGET = 15;
var postGetTimeout = 500;
var submitConf = false;
var cfgParams;
var frToSubmit = [];
var submitConfigFrames = false;
var confOK = false; //patch to prevent navigate issue DAS Overview<-->Adv Settings

function onloadInit() {
	Texts = TextEn;
	page = new Page();
	tags = [];
	basicCfg = [];
	version = new Version();
	serNr = new SerialNrT();

	guiBlocked(false);
	setTimeout(function() {statusWatchdog();}, 15000);
	if (typeof(window.parent.navi.document.alreadyLoaded) === 'undefined' 
	    || !window.parent.navi.document.alreadyLoaded) {
		startDisplay();
		return;
	}
	startDisplay();

}
function isEqualFreqEn(cfg){
	var res = cfg[0].uldlLinkedFreq[0] || cfg[0].uldlLinkedFreq[1];
	return res;
}
function tool_enable(fact, cfg) {
	var tool_en,result=false;
	if (window.top.monitorMode!=0) return false;

	var tool_en = [fact[0].chBandEnabled[0],fact[0].chBandEnabled[1]];
	if ((fact[0].fstop[1]-fact[0].fstart[1])!=(fact[0].fstop[0]-fact[0].fstart[0])) tool_en[0] = false;
	if ((fact[0].fstop[3]-fact[0].fstart[3])!=(fact[0].fstop[2]-fact[0].fstart[2])) tool_en[1] = false;
	result = result || (tool_en[0] || tool_en[1]);

	return result;
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
				setTimeout(function() { reloadPage(); }, 300);
			}
		}
		var currentDate = new Date();
		var timeSecs = Math.round(currentDate.getTime()/1e3);
		xhr.open("POST", "/index.html", true);
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
		setTimeout(function() { reloadPage(); }, 100);
	}
}
function reloadData(){
	forceReload = true;
}
function reloadPage(){
	reloading = true;
	if (typeof window.top.monitorMode === "undefined") window.top.monitorMode = 0;
	page.updateDevicesToMonitor();
	if(window.top.monitorMode==0 || window.top.monitorMode==2){
		currentDevice = 0;
		nrOfDevices = 1;
		unitToMon = [0,-1];
		monitor = new MonitorGlobal();
	}else{
		try{
			for (var k=0;k<2;k++) unitToMon[k] = ~~localStorage.getItem("dev_"+k+"_"+Prjstr+window.location.host);
			if ((unitToMon[0]==unitToMon[1])||unitToMon[1]==-1){
				unitToMon[1] =-1;
				nrOfDevices = 1;
			}else
				nrOfDevices = 2;
		}catch(err){}
		currentDevice = 0;
		monitor = [];
		for ( var i = 0; i < nrOfDevices; i++ ) monitor.push(new Monitor(unitToMon[i]));
	}
	config = [];
	factory = [];
	for ( var i = 0; i < nrOfDevices; i++ ) {
		config.push(new Config(unitToMon[i]));
		factory.push(new Factory());
	}
	if (window.top.monitorMode==1){
		if (typeof(window.parent.navi.confFrame) !== 'undefined') {
			parseGlobalConfig(window.parent.navi.confFrame,2); //mode 2 is to just parse the stored global aggregated basic conf
		}
	}
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
	confOK = false;
	// alert("globalConfigReq");
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countReqs = 0;
				timerId = setTimeout(function() { loadConfigGlobal(); }, computeTimeoutReqMs(false));
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
		if (window.top.monitorMode == 1){
			var params = '"';
			params = hexformat(unitToMon[currentDevice],4);
			xhr.send('gconf_str='+params);
		}else{
			xhr.send('gbconf_str="');
		}
		xhr = null;
	} catch (err) {}
}
function getPartialConf(p){
	waitACK = true;
	showResultIcon(ERR_PENDING);
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countReqs = 0;
				timerId = setTimeout(function() { loadPartialConf(p); }, computeTimeoutReqMs(false));
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { getPartialConf(p); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { getPartialConf(p); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		var params = partialConfCommands[p[1]];
		params += hexformat(p[0],4);
		xhr.send("pconf_str="+params);
		xhr = null;
	} catch (err) {}
}
function setForcePaFrame(frm){
	var cfg = new Config(1);
	cfg.parseGeneral(frm,0);
	for (var b=0;b<2;b++){
		for (var i=0;i<2;i++){
			if (cfg.paEnabled[b][i])
				cfg.forcePaOn[b][i] = true;
			else
				cfg.forcePaOff[b][i] = true;
		}
	}
	frm=cfg.getFrmGeneral();
	return frm;
}
function processPartialConf(p,frmi){
	//function parameters
	//p[0] = index of origin unit
	//p[1] = type of partial conf: 0-general, 1/2-freq band0/1, 3-squelch, 4-alarm
	//frmi = frame of partial conf coming from origin unit
	var validframe = "01";
	var frms = [];
	var frm;
	var paramFreqFrame;
	var copyFreqRemoteToMaster;
	for ( var i = 0; i < toIndex.length; i++ ) {
		copyFreqRemoteToMaster = false; //if true, freq from remote is copied to master. In this case, complete config frame for master is created
		// instead partial config
		frm = frmi;
		switch (p[1]){
			case 0: //general partial conf
				frm = setForcePaFrame(frmi.substr(2)); //this function updates forcePaOn and forcePaOff according to paEnabled
				frm = "05"+frm; //forcing update on band0 and band1 parameters
				break;
			case 1: //freq band 0 partial conf
			case 2: //freq band 1 partial conf
				paramFreqFrame = p[1]==1?"03":"0C";//forcing update only on desired band
				var cfgR = new Config(1); //cfgR = local config remote object
				if(p[0]==0){//copied freq from master to remote, but it is considered that fstep can be different
					var cfgM = new Config(0); //cfgM = local config master object
					cfgM.parseFilter(frmi.substr(2),0,factory[0]); //cfgM: freq object fields updated with partial conf frame coming from master
					//cfgR: freq object fields updated with cfgM fields, master factory and basic conf from destination remote
					cfgR.genConfigFilterULFromDL(cfgM,factory[0],basicCfg[toIndex[i]]); 
				}else{//copied freq from remote to remote
					if (toIndex[i]==0){//copied freq from remote to master
						copyFreqRemoteToMaster = true;
						break;
					}else{
						//cfgR: freq object fields updated with with partial conf frame coming from remote, master factory and basic conf from destination remote
						cfgR.parseFilterWithBasicConfig(frmi.substr(2),factory[0],basicCfg[p[0]]);
					}
				}
				frm = cfgR.getFrmFilterWithBasicConfig(factory[0],basicCfg[toIndex[i]]);
				frm = paramFreqFrame+frm;
				break;
			case 3: //squelch partial conf
				frm = "0F"+frmi.substr(2);
				break;
		}
		if (!copyFreqRemoteToMaster){ //normal cases: partial config is created
			var frmcnf = partialConfCommands[p[1]];
			frmcnf+=hexformat(toIndex[i],4)+validframe;
			frmcnf+=frm;
		}else{//exceptional case: freq from remote is copied to master, and a complete master config is created
			var cfgM = new Config(0); //cfgM = local config master object
			var cfgR = new Config(1); //cfgR = local config remote object
			cfgM.parse(config[0].frm,factory[0]); //cfgM updated with current master config
			cfgR.parseFilterWithBasicConfig(frmi.substr(2),factory[0],basicCfg[p[0]]);
			cfgM.genConfigFilterDLFromUL(cfgR,factory[0],basicCfg[p[0]],p[1]-1);//p[1]-1: is band
			var frmcnf = hexformat(0,4)+validframe;
			frmcnf += cfgM.getFrm(factory[0]); //generate config master frame
		}
		frms.push({type: 'ctl_conf_str=', frame: frmcnf});
	}
	submitFrms(frms);
}
function loadPartialConf(p) {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText.length<remoteHeaderLength){ //fcs returns string "WAITS" if USB response is not ready
					if (countReqs<MAX_REQS_POSTGET){
						countReqs++;
						timerId = setTimeout(function() { loadPartialConf(p); }, postGetTimeout);
					}else{
						getPartialConf(p);
					}
				}else
					processPartialConf(p,this.responseText);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { getPartialConf(p); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { getPartialConf(p); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function statusReq() {
	if (!confOK){ //patch to prevent navigate issue DAS Overview<-->Adv Settings
		console.log("Error navigation DAS Overview<-->Adv Settings");
		currentDevice = 0;
		globalConfigReq();
		return;
	}
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countReqs = 0;
				tmrIdStat = setTimeout(function() { load_status(); }, computeTimeoutReqMs(true));
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			tmrIdStat = setTimeout(function() { statusReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			tmrIdStat = setTimeout(function() { statusReq(); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		var params = '"';
		if (window.top.monitorMode == 1){
			params = hexformat(unitToMon[currentDevice],4);
		}
		xhr.send("stat_str="+params);
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
				if (this.responseText.indexOf("BUSY") >= 0) {
					setTimeout(function() { globalConfigReq(); }, Math.floor(Math.random()*1000));
					return;
				}
				if (this.responseText.indexOf("RCFG") >= 0) { //Load file operation: GUI goes to DAS Overview
					navigateToOverview();
					return;
				}
				if (this.responseText.length<remoteHeaderLength){ //fcs returns string "WAIT" if USB response is not ready
					if (countReqs<MAX_REQS_POSTGET){
						countReqs++;
						timerId = setTimeout(function() { loadConfigGlobal(); }, postGetTimeout);
					}else{
						globalConfigReq();
					}
				}else
					parseGlobalConfig(this.responseText,window.top.monitorMode==1?1:0);
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
			timerId = setTimeout(function() { globalConfigReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		var page_str  = "/global_conf.shtml";		// ((window.top.monitorMode == 0 || window.top.monitorMode == 2) && monitor.isAggBasic)
		if (window.parent.navi.isEthernetMode) {
			if (window.top.monitorMode == 1){
				page_str = "/update_conf.shtml";
			}
		}
		xhr.open("GET", page_str+"?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function parseGlobalConfig(str,mode) {
	if ( typeof(str) === 'undefined' || str === null ) {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		timerId = setTimeout(function() { globalConfigReq(); }, 100);
		return;
	}
	str = correctASCII(str);
	if (mode == 0){
		window.parent.navi.confFrame = str;
		localStorage.setItem("GConf"+Prjstr+window.location.host,str);
	}
	var deviceStr = str.split(frameSeparator);
	
	if (mode == 0 || mode == 2) { //mode = 0, monitorMode = 0 / mode = 1, monitorMode = 1 / mode = 2 monitorMode = 1 but stored global aggregated basic conf is parsed
		if (deviceStr[0].length < (remoteHeaderLength+masterGlobalConfigLength)) {
			console.log("Error cfg master length");
			globalConfigReq();
			return;	
		}
		parseGlobalConfigUnit(deviceStr[0].substr(remoteHeaderLength), 0, mode==2?0:-1); //first master to obtain fiberinfo from master global config
		remoteGlobalConfResponseValid[0]=true;
		for (var k=1;k<deviceStr.length;k++){ //provisional while expansion and their remotes are implemented and basic frame is parsed
			var indexRemote = parseInt(deviceStr[k].substring(0,4),16); if (indexRemote<0) indexRemote+=65536;
			if (fibInfo.FOmoduleConnected[indexRemote]){
				var frameLengthMin = ((indexRemote & 0xff)==0?expBasicGlobalConfigLength:remoteBasicGlobalConfigLength)+remoteHeaderLength;
				var frameLengthMax = frameLengthMin+60;
				if (deviceStr[k].length < frameLengthMin || deviceStr[k].length > frameLengthMax){
					//remoteGlobalConfResponseValid[indexRemote] = false;
					console.log("Error cfg exp/remote length");
					globalConfigReq();
					return;	
				}else{
					remoteGlobalConfResponseValid[indexRemote] = (1 === parseInt(deviceStr[k].substring(4,6),16));
					//if (remoteGlobalConfResponseValid[indexRemote]){
						parseGlobalBasicConfigUnit(deviceStr[k].substr(remoteHeaderLength), indexRemote);
					//}
				}
			}
		}
		if (mode == 0){
			if (str.length<(remoteHeaderLength+masterConfigLength)){ //unexpected error on FCS, global basic aggregated is not ready
				globalConfigReq();
				return;
			}
			end_loading();
		}
		return;
	}else{
		if (unitToMon[currentDevice]>0){
			var frameLength = (unitToMon[currentDevice] & 0xff)==0?expGlobalConfigLength:remoteGlobalConfigLength;
			if (deviceStr[0].length < frameLength+remoteHeaderLength) {
				remoteGlobalConfResponseValid[unitToMon[currentDevice]] = false;
			}else{
				remoteGlobalConfResponseValid[unitToMon[currentDevice]] = (1 === parseInt(deviceStr[0].substring(4,6),16));
			}
		}
	}
	//Header control
	var dev = parseInt(deviceStr[0].substring(0,4),16);
	if (dev != unitToMon[currentDevice]){
		console.log("Error conf: received["+hexformat(dev,4)+"] expected["+hexformat(unitToMon[currentDevice],4)+"]");
		setTimeout(function() { globalConfigReq(); }, 500);
		return;
	}
	if (remoteGlobalConfResponseValid[unitToMon[currentDevice]])
		parseGlobalConfigUnit(deviceStr[0].substr(remoteHeaderLength), currentDevice);
	else{
		alert("Error retrieving device info. Check status on DAS Overview section");
		window.parent.navi.document.getElementById("start").click();
	}
	currentDevice++;
	if (currentDevice == nrOfDevices){
		currentDevice = 0;
		end_loading();
	}else{
		globalConfigReq();
	}
}
function parseGlobalBasicConfigUnit(str,n){
	basicCfg[n] = new BasicConf(n);
	basicCfg[n].parse(str);
	var srTag = basicCfg[n].tag;
	tags[n] = new Tags();
	tags[n].parseRawText(srTag);
}
function parseGlobalConfigUnit(str, n, forceIndex) {
	var unit_n = 0;
	if (typeof(forceIndex) !== "undefined" && forceIndex>=0 )
		unit_n = forceIndex;
	else
		unit_n = unitToMon[n];
		
	var srarr = str.split('\t');
	if ((unit_n==0 && srarr.length < 7)||(unit_n>0 && srarr.length < 5)) {
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srSerNr = srarr[2];
	var srTag = srarr[3];
	var srVersion = srarr[4];
	tags[unit_n] = new Tags();
	tags[unit_n].parseRawText(srTag);
	
	localStorage.setItem("Factory_"+unit_n+"_"+Prjstr+window.location.host, srFact);
	factory[n].parse(srFact);
	
	config[n].parse(srConf,factory[n]);
	config[n].saveFrameStr(srConf);
	
	if (unit_n==0){
		fibInfo.parse(srarr[5]);
		srMasterFwOptions = srarr[6];
		serNr.parse(srSerNr);
		serNr.render();
		version.parse(srVersion);
		version.store(srVersion);
		window.parent.navi.factoryFrame = srFact;
		localStorage.setItem("FW"+Prjstr+window.location.host, factory[n].commonUl?0:1);
		version.render(factory[n].ethernetModuleNotInstalled);
		window.parent.navi.hideIPconf(factory[n].ethernetModuleNotInstalled);
	}
}

function end_loading() {
	confOK = true;
	window.parent.navi.filter_help_args(); 
	window.parent.navi.filterTool();
	window.parent.navi.document.alreadyLoaded = true;
	var tool_en = tool_enable(factory,config);
	window.parent.navi.filtRowDisplay(tool_en);
	page.show(tags, factory, serNr, version, config, fibInfo, basicCfg);
	reloading = false;
	//window.top.pageloading = false;
	guiBlocked(false);
	for (var band=0;band<2;band++){
		page.uldlLinkedDisable(0,band);
	}
	showResultIcon(ERR_NONE);
	reloadIcon = false;
	tmrIdStat = setTimeout(function() { statusReq(); }, 100);
}

var tmrIdStat;
var oldStatusTimerId = 0;
function statusWatchdog() {
	if (typeof(tmrIdStat) !== "undefined" && tmrIdStat != null) {
		if (oldStatusTimerId == tmrIdStat) {
			tmrIdStat = setTimeout(function() {statusReq();}, 1000);
		} else {
			oldStatusTimerId = tmrIdStat;
		}
		setTimeout(function() { statusWatchdog(); }, 180000);
	}
}
function setConfigFramesToSubmit(frms){
	showResultIcon(ERR_PENDING);
	frToSubmit = frms;
	submitConfigFrames = true;
}
function nextRequest(){
	if (fileLoad){
		fileLoad = false;
		postData();
	}else if (fileSave[0]){
		fileSave[0] = false;
		initSaveCfg(0);
	}else if (fileSave[1]){
		fileSave[1] = false;
		initSaveCfg(1);
	}else if (forceReload){
		forceReload = false;
		reloadPage();
	}else if(submitConfigFrames){
		submitConfigFrames = false;
		submitFrms(frToSubmit);
	}else if(submitConf){
		submitConf = false;
		submitConfig(cfgParams);
	}else if(reqPartialConf){
		reqPartialConf = false;
		getPartialConf(partialConfParams);
	}else
		statusReq();
}
function navigateToOverview(){
	alert("DAS is being re-configured by another instance. This operation cannot be done while this GUI is in Advanced Settings section");
	setTimeout(function() {
		window.parent.navi.document.getElementById("start").click();
		window.top.MonitorMode = 0;
		forceReload = true;
		nextRequest();
	}, 1000);
}
function load_status() {
	var tmout = computeTimeoutReqMs(true);
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
						if (this.responseText.indexOf("BUSY") >= 0) {
							tmrIdStat = setTimeout(function() { statusReq(); }, Math.floor(Math.random()*1000));
							return;
						}
						if (this.responseText.indexOf("RCFG") >= 0) { //Load file operation: GUI goes to DAS Overview
							navigateToOverview();
							return;
						}
						if (this.responseText.length<remoteHeaderLength){ //fcs returns string "WAIT" if USB response is not ready
							if (countReqs<MAX_REQS_POSTGET){
								countReqs++;
								tmrIdStat = setTimeout(function() { load_status(); }, postGetTimeout);
							}else{
								statusReq();
							}
						}else{
							localStorage.setItem("Status_"+unitToMon[currentDevice]+"_"+Prjstr+window.location.host, this.responseText);
							if ( isGeneralFail ) {
								onloadInit();
								isGeneralFail = false;
								// startDisplay();
							} else { 
								if (!reloading && !forceReload){
									if (window.top.monitorMode == 1 && !monitor[currentDevice].isAggBasic){
										if (window.parent.navi.isEthernetMode) {
											// verify if the response is for the current device, required for rabbit in case of multiple client browsers
											var dev = parseInt(this.responseText.substring(0,4),16);
											if (dev != unitToMon[currentDevice]){
												// console.log("status conflict: received["+hexformat(dev,4)+"] expected["+hexformat(unitToMon[currentDevice],4)+"]");
												// request status for the current device again, random delay to avoid conflicts is required
												tmrIdStat = setTimeout(function(){ statusReq(); }, Math.floor(Math.random()*1000));
												return;
											} else {
												// console.log("status Ok: received["+hexformat(dev,4)+" expected["+hexformat(unitToMon[currentDevice],4)+"]");
											}
											// now display status for the current device
										}
										monitor[currentDevice].parse(this.responseText);
										page.showStatus(monitor[currentDevice],currentDevice);
										currentDevice++;
										if (currentDevice == nrOfDevices) currentDevice = 0;
									}else if ((window.top.monitorMode == 0 || window.top.monitorMode == 2) && monitor.isAggBasic){
										var ret = monitor.parse(this.responseText);
										if (ret>=0)
											page.showStatus(monitor,0);
										else
											console.log("error status frame");
									}
								}
								isGeneralFail = false;
							}
						}
					}
				}
				
				if (!waitACK){
					tmrIdStat = setTimeout(function() { nextRequest(); }, timeoutMs);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			if (!waitACK){
				tmrIdStat = setTimeout(function() { nextRequest(); }, tmout);
			}
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			if (!waitACK){
				tmrIdStat = setTimeout(function() { nextRequest(); }, tmout);
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		var page_str  = "update.shtml";		// ((window.top.monitorMode == 0 || window.top.monitorMode == 2) && monitor.isAggBasic)
		if (window.parent.navi.isEthernetMode) {
			if (window.top.monitorMode == 1 && !monitor[currentDevice].isAggBasic){
				page_str = "status_adv.shtml";
			}
		}
		xhr.open("GET", page_str+"?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitParams(){
	this.ndev = 0;
	this.isReset = false;
	this.isolVerif = false;
	this.isolClear = false;
	this.clearErrors = false;
	this.delayMeas = false;
	this.forceSend = false;
	this.forcePaOn = [[false,false],[false,false]];
	this.forcePaOff = [[false,false],[false,false]];
	this.setDefaultRelay = false;
	this.forcePlaMeas = false;
}
function submitform(s){
	if (typeof(s)==="undefined"){
		cfgParams = new submitParams();
	}else{
		cfgParams = s;
	}
	submitConf = true;
}
function submitConfig(s) { //s = object containing all submit parameters
	if (unitToMon[0]==0 && page.masterFimwareIsChanged()) { //Only for master
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
			page.masterFirmwareSet(self.factory[0].commonUl ? 0:1);
			submitConf = false;
			nextRequest();
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

	var frmcnf;
	var cmd;
	if (window.top.monitorMode==2){
		cmd = "ctl_tags_str=";
		frmcnf = page.readTags();
	}else{
		cmd = "ctl_conf_str=";
		frmcnf = page.readTotalConfsFrm(s);
	}
	if (frmcnf.length == 0) {
		waitACK = false;
		tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		guiBlocked(false);
		return;
	}
	var frms = [];
	for ( var i = 0; i < frmcnf.length; i++ ) {
		frms.push({type: cmd, frame: frmcnf[i]});
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
	var valid = [];
	for (var n=0;n<frms.length;n++){
		valid[n] = false;
		var ind = n==0? 0:1
		var header = parseInt(frms[n].frame.substring(ind,ind+4),16);
		var h1 = header & 0xff; var h2 = header>>8 & 0xff;
		if (h1==0 && h2>0) continue; //discard expansions
		if (parseInt(frms[n].frame.substring(ind+4,ind+6),16)==1 && remoteGlobalConfResponseValid[header]) valid[n] = true;
	}
	var frmToSend = [];
	for (var n=0;n<frms.length;n++){
		if (valid[n]) frmToSend.push(frms[n])
	}
	submitFrms(frmToSend);
}

function submitFrms(frms) {
	var self = this;
	clearTimeout(tmrIdStat);
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
	var frmHex = removeNoHex(frm[0].frame);
	if (frmHex.length>remoteHeaderLength && frm[0].type!='options_str=' && frm[0].type!='ctl_tags_str='){
		var nr = parseInt(frmHex.substring(0,4),16);
		var i1 = nr & 0xff; var i2 = nr>>8 & 0xff;
		window.parent.navi.document.getElementById("cfgprog").innerHTML = nr==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1);
	}
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countReqs = 0;
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
		if (frm[0].type == 'ctl_tags_str=') {
			document.getElementById("ctl_tags_str").value = frm[0].frame;
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
	if (typeof countReqs === "undefined")
		countReqs = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++countReqs < MAX_REQS_CHKRES) {
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
	currentDevice = 0;
	globalConfigReq();
	page.deepDischarge.clearDeepDischargeButtonClicked();
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
		forceRfOffSwDisableStateSet(isDisable);
	} catch (err) {}
}

function computeTimeoutReqMs(isStatus) {
	if (window.parent.navi.isEthernetMode) {
		if (typeof(isStatus) !== "undefined" && isStatus) {
			return 1000;
		}
		return 2000;
	} else {
		return postGetTimeout;
	}
}
