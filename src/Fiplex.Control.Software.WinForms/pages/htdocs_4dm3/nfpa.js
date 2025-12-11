var gui;
var NFPAStr;
var NFPAcfg;
var NFPAstat;
var tags;
var tmrId;
var countCheck;
var config;
var factory;
var RFsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 };
var VSWRsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 25 };
var BBLevelInsettings = {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 };
var nrOfRemotes = 2;
var globalConfigLength = 2876;
var configLength = 1572;
var remoteHeaderLength = 4;
var statLength = 294;
var remoteGlobalConfResponseValid = [false, false];
var remoteStatResponseValid = [false, false];
var frameSeparator = "\t\t\t";
var version;

function onloadInit() {	
	gui = new GUI_NFPA();
	NFPAcfg = [];
	NFPAStr = [];
	config = [];
	factory = [];
	tags = [];
	for ( var n = 0; n <=nrOfRemotes; n++ ) {
		NFPAcfg.push(new NFPAconf());
		config.push(new Config());
		factory.push(new Factory());
		NFPAStr.push("");
		tags.push(new Tags());
	}
	showResultIcon(ERR_NONE);
	globalConfigReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function reloadData(){
	globalConfigReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
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
				gui.createForm();
				gui.showConf(NFPAcfg);
				window.top.submitLocked = false;
				cursorClear();
				reloadIcon = false;
				waitACK = false;	
				showResultIcon(ERR_NONE);
				guiBlocked(false);
				refreshEnables();
				load_status();
				
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
		globalConfigReq();
		return;
	}
	parseGlobalConfigUnit(deviceStr[0], 0);
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		remoteGlobalConfResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
		if (remoteGlobalConfResponseValid[n]) {
			if (deviceStr[remoteNr].length < globalConfigLength+remoteHeaderLength) {
				//alert("Error retrieving info. Global conf remote length="+deviceStr[remoteNr].length);	// debug
				remoteGlobalConfResponseValid[n] = false;
			}else{
				parseGlobalConfigUnit(deviceStr[remoteNr].substr(remoteHeaderLength), remoteNr);
			}
		}
	}
}
function parseNFPAStatus(str) {
	var nfpa = [];
	for (var nr=0;nr<=nrOfRemotes;nr++)
		nfpa.push(new NFPAstatus());
	
	if ( typeof(str) === 'undefined' || str === null ) {
		if (!waitACK){
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		return;
	}
	str = correctASCII(str);
	var deviceStr = str.split(frameSeparator);
	if (deviceStr.length < (1+nrOfRemotes)) {
		if (!waitACK){
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		return;
	}
	nfpa[0].parse(deviceStr[0]);
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		remoteStatResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
		if (remoteStatResponseValid[n]) {
			if (deviceStr[remoteNr].length < statLength+remoteHeaderLength) {
				remoteStatResponseValid[n] = false;
			}else{
				nfpa[remoteNr].parse(deviceStr[remoteNr].substr(remoteHeaderLength));
			}
		}
		if (!remoteStatResponseValid[n]) remoteGlobalConfResponseValid[n] = false;
	}
	return nfpa;
}
function parseGlobalConfigUnit(str, n) {
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srTag = srarr[4];
	var srNFPA = srarr[6]; 
		
	tags[n].parseRawText(srTag);
	factory[n].parse(srFact);
	NFPAcfg[n].parse(srNFPA);
	config[n].parse(srConf,factory[n]);
	
	NFPAStr[n] = srNFPA;
	if (n==0) {
		var srVersion = srarr[5];
		version = new Version();
		version.parse(srVersion);
	}
}

function load_status() {
	var tmout = computeTimeoutReqMs();
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact) {
			clearTimeout(tmrIdFact);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState ===4 && this.status === 200) {
				if (!waitACK){
					NFPAstat = parseNFPAStatus(this.responseText);
					gui.showStatus(NFPAstat);
				}
				var timeoutMs = isFileOpBusy() ? 10000 : tmout;
				if (!waitACK){
					tmrIdStat = setTimeout(function() { load_status(); }, timeoutMs);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			if (!waitACK){
				tmrIdFact = setTimeout(function() { load_status(); }, tmout);
			}
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			if (!waitACK){
				tmrIdFact = setTimeout(function() { load_status(); }, tmout);
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_nfpa.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform() {
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	
	var frameArray = [];
	var NFPAcfgToSend = new NFPAconf();
	NFPAcfgToSend.parse(NFPAStr[0]);
	gui.readConf(NFPAcfgToSend,0);
	var frm = NFPAcfgToSend.getFrm();

	if (frm != NFPAStr[0]) {
		var remoteHeader = hexformat(0, 2);    // master + valid==true
		remoteHeader += hexformat(1, 2);
		frameArray.push(remoteHeader+frm);
	}
	
	for (var i = 0; i < nrOfRemotes; i++) {
		if ( remoteGlobalConfResponseValid[i] ){

			var NFPAcfgToSend = new NFPAconf();
			NFPAcfgToSend.parse(NFPAStr[i+1]);
			gui.readConf(NFPAcfgToSend, i+1 );
			frm = NFPAcfgToSend.getFrm();
			if (frm != NFPAStr[i+1]) {
				var remoteHeader = hexformat(i+1, 2);
				remoteHeader += hexformat(1, 2);
				frameArray.push(remoteHeader+frm);
			}
			
		}
	}

	clearTimeout(tmrIdStat);
	waitACK = true;
	submitFrms(frameArray);
}

function submitFrms(frms) {
	var self = this;
	if (typeof(frms) !== 'undefined') {
		self.frms = frms;
	} 
	try {
		if (self.frms.length == 0) {
			showResultIcon(ERR_OK);
			setTimeout(function() { globalConfigReq(); }, 1000);
			return;
		}
		var frm = self.frms.splice(0, 1);
	doSubmit(frm);
	} catch (e) {}
}

function doSubmit(frm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countCheck = 0;
					setTimeout(function() { check_result(); }, 100);
				} else {
					showResultIcon(ERR_FAIL);
					setTimeout(function() { xhrOnEnd(); }, 1500);
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
		document.getElementById("nfpa_str").value = frm;
		xhr.open("POST", "/nfpa.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("nfpa_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		window.top.submitLocked = false;
		cursorClear();
		showResultIcon(ERR_NONE);
		guiBlocked(false);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	cursorWait();
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
}

function xhrOnEnd() {
	window.top.submitLocked = false;
	cursorClear();
	reloadIcon = false;
	waitACK = false;	
	showResultIcon(ERR_NONE);
	guiBlocked(false);
	globalConfigReq();
}

function check_result() {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 25) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
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
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function refreshCtrlEnable(num,mode,nr,val){
	try{
		document.getElementById("enabled_"+num+"_"+mode+"_0_"+nr).disabled = !val;
		//todos los textos blancos y disabled
		var isExtGlobalAlarm = (nr==0 && mode == 0 && num >=8 && num <= 10) || (nr>0 && mode == 0 && num >=8 && num <= 11);
		document.getElementById("AlName_"+num+"_"+mode+"_"+nr).style.backgroundColor = (isExtGlobalAlarm ? "white" : "#DDDDDD");
		document.getElementById("AlName_"+num+"_"+mode+"_"+nr).disabled = !isExtGlobalAlarm;
	} catch (err) {}
}
function refreshEnables(){
	//Se reutiliza refreshEnables para forzar disabled Antenna isolation, Osc. Detection en general y
	//Overload UL, DL PA Fail, Tx Power Low, VSWR, Rx Power Low, DL AGC Fail en band-specific
	for (var nr=0;nr<=nrOfRemotes;nr++){
		for (var mode=0;mode<2;mode++){
			for (var num=0;num<16;num++){
				var alDisable = (mode==0 && (num==2||num==3));
				if (DAScentric) alDisable = alDisable || (nr==0 && mode==1 && (num==0 || (num>=2 && num<=6)));
				refreshCtrlEnable(num,mode,nr,!alDisable);
			}
		}
	}
}
function GUI_NFPA() {
	this.readConf = function(nfpa,nr){
		for (var band=0;band<2;band++){
			nfpa.retLossTh[band] = this.RetLossThGet(band,nr);
			nfpa.minPowerVSWR[band] = this.VSWRMinPowerGet(band,nr);
			nfpa.alarmNumSens[band] = this.AlarmSensGet(band,nr);
			nfpa.timeTxLowPowLow[band] = this.timeTriggerGet(band,nr);
		}
		for (var k=0;k<3;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k,nr)==1;
		
		for (var k=8;k<12;k++)
			nfpa.alarmNames[0][k] = document.getElementById("AlName_"+k+"_0_"+nr).value;
		if (nr==0) nfpa.alarmNames[0][11] = "Force RF OFF";
		for (var k=0;k<16;k++){
			nfpa.globalAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_0_0_"+nr).checked; //Se cambió a checkbox
			for (var j=0;j<4;j++) {
				nfpa.relayAssignGlobalAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_0_"+j+"_"+nr).checked;
			}
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				nfpa.externalAlarmPolarity[externalAlarmNr] = document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+nr).checked;
			}
		}
		for (var k=0;k<16;k++){
			// se usa el primer byte de alarm enable
			nfpa.bandAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_1_0_"+nr).checked; //Se cambió a checkbox
			if (nr==0 && DAScentric){ //Se fuerza algunas alarmas como siempre deshabilitadas
				nfpa.bandAlarmsEnabled[0] = false; //Overload UL
				nfpa.bandAlarmsEnabled[2] = false; //DL PA Fail
				nfpa.bandAlarmsEnabled[3] = false; //TX Power Low
				nfpa.bandAlarmsEnabled[4] = false; //VSWR
				nfpa.bandAlarmsEnabled[5] = false; //Rx Power Low
				nfpa.bandAlarmsEnabled[6] = false; //DL AGC Fail
			}
			if (nr>0){
				nfpa.bandAlarmsEnabled[1] = false; //Overload DL
				if (!config[nr].remoteIsDonnorAntennaCapable) {
					nfpa.bandAlarmsEnabled[5] = false; //Rx Power Low
				}
			}
			for (var j=0;j<4;j++)
				nfpa.relayAssignBandAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_1_"+j+"_"+nr).checked;
		}
		for (var j=0;j<2;j++)
			nfpa.antennaDisconnectionThreshold[j] = this.bbLevelInThGet(nr,j);
		for (var k = 0; k < this.alarmThrshElements.length; k++) {
			var el = document.getElementById(this.AlarmThrshElementsId(k, 0, nr));
			nfpa.alarmThrshData[k].valueThr = parseInt(el.value);
			var el = document.getElementById(this.AlarmThrshElementsId(k, 1, nr));
			nfpa.alarmThrshData[k].hysteresis = parseFloat(el.value);
		}
	}
	this.showStatus = function(nfpa){
		try{
			for (var nr=0;nr<=nrOfRemotes;nr++){
				if (nr>0){
					if (!remoteStatResponseValid[nr-1]) this.showUnit(nr,false);
					if (remoteStatResponseValid[nr-1] && !remoteGlobalConfResponseValid[nr-1]){
						if (!reloadIcon){
							showResultIcon(ERR_RELOAD);
							reloadIcon = true;
						}
					}
				}
				for (var k=0;k<2;k++){
					setMetValue("rfPowFwd_"+k+"_"+nr, nfpa[nr].powDirect[k]);
					setMetValue("rfPowRev_"+k+"_"+nr, nfpa[nr].powReverse[k]);
					setMetValue("returnLoss_"+k+"_"+nr, nfpa[nr].retLoss[k]);
					var el = document.getElementById("warnPowerMess_"+k+"_"+nr);
					el.style.display = nfpa[nr].powDirect[k]<NFPAcfg[nr].minPowerVSWR[k]?"table-cell":"none";	
					this.timeElapsedSet(k,nr,nfpa[nr].txLowerPowerTimeHigh[k],nfpa[nr].txLowerPowerTimeLow[k],NFPAcfg[nr].timeTxLowPowLow[k]);
					setMetValue("bbLevelIn_"+nr+"_"+k, nfpa[nr].bbLevel[k]);
				}
				
			}
		} catch(e){}
	}
	this.showUnit = function(nr,show){
		try {
			var el = document.getElementById("unitDiv_"+nr);
			el.style.display = ( show ? "block" : "none" );
		} catch(e){}
	}
	this.showConf = function(nfpa){
		var bdaOnly = !remoteGlobalConfResponseValid[0] && !remoteGlobalConfResponseValid[1];
		this.showUnit(0,true);
		if (!bdaOnly){
			for (var nr=0;nr<=nrOfRemotes;nr++){
				if (nr>0 && remoteGlobalConfResponseValid[nr-1]) this.showUnit(nr,true);
				var el = document.getElementById("powmeas_"+nr);
				el.innerHTML =  nr==0?masterName:remoteName+" "+nr;
				var el = document.getElementById("confAlarm_"+nr);
				el.innerHTML =  nr==0?masterName:remoteName+" "+nr;
				var el = document.getElementById("althres_"+nr);
				el.innerHTML =  nr==0?masterName:remoteName+" "+nr;
				var el = document.getElementById("tagpName_"+nr);
				el.innerHTML = "POWER&nbsp;MEASUREMENTS - " + tags[nr].getTag();
				var el = document.getElementById("tagcName_"+nr);
				el.innerHTML = "CONFIGURATION&nbsp;ALARMS - " + tags[nr].getTag();
			}
		}
		for (var nr=0;nr<=nrOfRemotes;nr++){
			for (var band=0;band<2;band++){
				//visualizaciones que dependen de factory				
				var show = factory[nr].chBandEnabled[band] || factory[nr].adjBandEnabled[band];
				if (nr==0){
					if (!factory[nr].commonUl){
						document.getElementById("antDisconnTitle_"+band).innerHTML = "ANTENNA&nbsp;DISCONNECTION " + factory[nr].bandNames[band];
						document.getElementById("antDisconnTitle_"+band).style.display = show?"table-cell":"none";
						document.getElementById("antDisconnCtrl_"+band).style.display = show?"table-cell":"none";
					}
					
				}
				if (nr==0 && DAScentric) show = false; //se oculta para master
				for (var k=0;k<3;k++){
					var el = document.getElementById("powbandrow_"+k+"_"+band+"_"+nr);
					el.style.display = show? "table-row" :"none";
				}
				var el = document.getElementById("powbandtitle_"+band+"_"+nr);
				el.innerHTML = factory[nr].bandNames[band].toUpperCase();
				RFsettings.max = factory[nr].powerlimit[2*band+1] + 5;
				RFsettings.min = RFsettings.max - 50;
				RFsettings.high_warn = factory[nr].powerlimit[2*band+1];
				RFsettings.high_alarm = factory[nr].powerlimit[2*band+1] + factory[nr].MAX_PWR_DELTA;
				setMetRange("rfPowFwd_"+band+"_"+nr, RFsettings);
				setMetRange("rfPowRev_"+band+"_"+nr, RFsettings);
				var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
				el.setAttribute("max",factory[nr].powerlimit[2*band+1]);
				el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
				var el = document.getElementById("althresrow_"+band+"_"+nr);
				el.style.display = show? "table-row" :"none";
				var el = document.getElementById("althrestitle_"+band+"_"+nr);
				el.innerHTML = "DOWNLINK&nbsp;OUTPUT&nbsp;POWER&nbsp;ALARM&nbsp;"+factory[nr].bandNames[band].toUpperCase()+" (dBm)";
				//
				this.RetLossThSet(band,nr,nfpa[nr].retLossTh[band]);
				this.VSWRMinPowerSet(band,nr,nfpa[nr].minPowerVSWR[band]);
				this.AlarmSensSet(band,nr,nfpa[nr].alarmNumSens[band]);
				this.timeTriggerSet(band,nr,nfpa[nr].timeTxLowPowLow[band]);

				for (var k=0;k<3;k++)
					this.relayStatusCtrlSet(k,nr,nfpa[nr].relayLogicConfigNormal[k]);
				
				for (var k=0;k<16;k++){
					if (k==11 && nr==0)
						document.getElementById("AlName_"+k+"_0_0").value = "Force RF OFF";
					else
						document.getElementById("AlName_"+k+"_0_"+nr).value = nfpa[nr].alarmNames[0][k];
					if (nr==0 && (k==2 || k==3) && DAScentric)
						document.getElementById("enabled_"+k+"_0_0_"+nr).checked = false; //se fuerza el valor de Ant.Isolation y Osc.Detection en master si DAScentric
					else
						document.getElementById("enabled_"+k+"_0_0_"+nr).checked = nfpa[nr].globalAlarmsEnabled[k]; //Se cambió a checkbox
					for (var j=0;j<4;j++) document.getElementById("relay_enabled_"+k+"_0_"+j+"_"+nr).checked = nfpa[nr].relayAssignGlobalAlarm[k][j];
					if ( k >= 8 && k <= 11 ) {
						var externalAlarmNr = k - 8;
						document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+nr).checked = nfpa[nr].externalAlarmPolarity[externalAlarmNr];
					}
				}
				for (var k=0;k<16;k++){
					if (k==5)
						document.getElementById("AlName_"+k+"_1_"+nr).value = "Rx Power Low / Donor Antenna";
					else
						document.getElementById("AlName_"+k+"_1_"+nr).value = nfpa[nr].alarmNames[1][k];
					document.getElementById("enabled_"+k+"_1_0_"+nr).checked = nfpa[nr].bandAlarmsEnabled[k];
					for (var j=0;j<4;j++) document.getElementById("relay_enabled_"+k+"_1_"+j+"_"+nr).checked = nfpa[nr].relayAssignBandAlarm[k][j];

				}
						
				for (var k = 0; k < this.alarmThrshElements.length; k++) {
					var el = document.getElementById(this.AlarmThrshElementsId(k, 0, nr));
					el.value = nfpa[nr].alarmThrshData[k].valueThr;
					var el = document.getElementById(this.AlarmThrshElementsId(k, 1, nr));
					el.value = nfpa[nr].alarmThrshData[k].hysteresis.toFixed(1);
				}
			}
			for (var k = 0; k < 2; k++) 
				this.bbLevelInThSet(nr,k,nfpa[nr].antennaDisconnectionThreshold[k]);
		}
	}
	this.createForm = function(){
		var cont = document.getElementById("page");
			for(var nr=0;nr<=nrOfRemotes;nr++){
				this.createUnit(cont, nr);
			}
	}
	this.createUnit = function(cont,nr) {
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv_"+nr;
		unitDiv.className = "unitbox";
		unitDiv.style.display = "none";
		cont.appendChild(unitDiv);
		var headDiv = this.createUnitHead("POWER&nbsp;MEASUREMENTS","tagpName_"+nr,"","powmeas_"+nr,nr);
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		if (nr==0 && DAScentric){
			var tab = document.createElement("table");
			tab.className = "contenttable";
			tab.style.width = "100%";
			contentDiv.appendChild(tab);
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = document.createElement("td");
			cell.className = "contentcell";
			rowb.appendChild(cell);
			var tab = this.createRowPowerBand(nr);
			cell.appendChild(tab);
		}else{
			var tab = this.createRowPowerBand(nr);
			contentDiv.appendChild(tab);
		}
		var headDiv = this.createUnitHead("CONFIGURATION&nbsp;ALARMS","tagcName_"+nr,"","confAlarm_"+nr,nr);
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createRelayConfig(nr);
		contentDiv.appendChild(tab);
		var headDiv = this.createUnitHead("ALARM&nbsp;THRESHOLDS","","","althres_"+nr,nr);
		// Se ha decidido que no se usarán umbrales de alarma
		headDiv.style.display = "none";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.style.display = "none";
		var tab = this.createAlarmThresholds(nr);
		contentDiv.appendChild(tab);
	}
	this.createBroadbandLevelIn = function(nr, band) {
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";	
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("bbLevelIn_"+nr+"_"+band, BBLevelInsettings, "Broadband&nbsp;Input&nbsp;Level", "dBm");
		tb.appendChild(row);
		var row = this.createBBLevelInTh(nr,band);
		tb.appendChild(row);
		return cellb;
	}
	this.createBBLevelInTh = function(nr,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Broadband&nbsp;Input&nbsp;Threshold";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "bbLevelInTh_"+nr+"_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = -70;
		el.min = -100;
		el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
		el.onchange = function(ev) {
			var num = parseFloat(this.value);
			var max = ~~this.max;
			var min = ~~this.min;
			if (num < min) {
				this.value = min;
			} else if (num > max) {
				this.value = max;
			} else {
				this.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.innerHTML = "dBm";
		cell.style.textAlign = "right";
		return row;
	}
	this.bbLevelInThSet = function(nr, band, val) {
		try {
			var el = document.getElementById("bbLevelInTh_"+nr+"_"+band);
			if (!isNaN(val)) {
				el.value = val.toFixed(0);
			}
		} catch (err) { }
	}
	this.bbLevelInThGet = function(nr, band) {
		try {
			var el = document.getElementById("bbLevelInTh_"+nr+"_"+band);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createRelayConfig = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRelayStatusAlarm(nr);
		rowb.appendChild(cell);
		for (var mode = 0; mode < 2; mode++){
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = this.createGeneralRelayConfig(mode,nr);
			cell.className = "contentcell";		
			rowb.appendChild(cell);
		}
		return tab;
	}
	this.createGeneralRelayConfig = function(mode,nr){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.className = "alarmTable";
		tbl.setAttribute("border","1");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = (mode==0?"GENERAL":"BAND-SPECIFIC")+"&nbsp;RELAY&nbsp;SETTINGS";
		cell.colSpan = 16;
		row.appendChild(cell);
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var k=0;k<2;k++){
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Name";
			cell.rowSpan = 2;
			cell.colSpan = 2;
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Enabled";
			cell.rowSpan = 2;
			row.appendChild(cell);
			if (mode == 0) {
				var cell = document.createElement("th");
				cell.className = "alarmTable";
				cell.innerHTML = "Polarity"+"<br/>"+"High";
				cell.rowSpan = 2;
				row.appendChild(cell);
			}
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Relay";
			cell.colSpan = 4;
			row.appendChild(cell);	
		}
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var k=0;k<2;k++){
			for (var j=0;j<4;j++){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
			}
		}
		var alarmNrShow = 0;
		for (var j=0;j<8;j++) {
			var increaseAlarmNr = true;
			var isUserAlarm = false;
			var row = document.createElement("tr");
			tb.appendChild(row);
			var VU = !factory[nr].commonUl;
			var hideCond = (mode==0) && (( j >= 6) || (nr>0 && j==2)); //se oculta UL PA Fail y AntennaDisconnection de remote
			hideCond = hideCond || ((mode==1) && !VU && (nr==0 && j>3)); //se ocultan las alarmas de master band-specific a partir de quinta fila si 7/8
			hideCond = hideCond || ((mode==1) && VU && (nr==0 && j>4)); //se ocultan las alarmas de master band-specific a partir de sexta fila si V/U
			hideCond = hideCond || ((mode==1) && (nr>0 && j>2)); //Se ocultan las 4 últimas filas de alarmas banda remoto
			hideCond = hideCond || ((mode==0) && VU && (nr==0 && j==2)); //se oculta UL PA Fail y AntennaDisconnectio de master si VU
			row.id = "alarmRow_"+nr+"_"+mode+"_"+j;
			if (hideCond) { 
				row.style.display = "none";
				increaseAlarmNr = false;
			} else if (mode==0 && (j == 4 || j == 5)) {
				isUserAlarm = true;
				increaseAlarmNr = false;
			}
			for (var k=0;k<2;k++){
				var hideCell = ((mode == 0 && j == 6 && k == 1) || (!VU && mode == 1 && j == 3 && k == 1)); // ocultar a partir de door-open, y la última band-specific
				hideCell = hideCell || (VU && nr==0 && mode == 1 && j == 4 && k == 1); //última celda de la quinta fila band master (si V/U)
				// hideCell = hideCell || (nr>0 && mode == 1 && j == 2 && k == 1); //last cell of band-specific alarm of remotes.
				if (nr>0 && mode==1) {
					var miniDASmaster_supports_remote_donor_antenna_alarm = (self.version.compareSw(1,2) > 0); //both 700/800 and V/U
					if (!(config[nr].remoteIsDonnorAntennaCapable && factory[0].masterRxLowAlarm && miniDASmaster_supports_remote_donor_antenna_alarm)) {
						//last cell of band-specific alarm of remotes.
						hideCell = hideCell || (nr>0 && mode == 1 && j == 2 && k == 1);
					}
				}
				var cell = document.createElement("th");
				if ( isUserAlarm ) {
					var userAlarmNr = 2*(j-4) + k + 1;
					if (userAlarmNr==4){
						cell.innerHTML = "EXTERNAL INPUT";
					}else{
						cell.innerHTML = "USER&nbsp;ALARM&nbsp;"+userAlarmNr;
					}
				} else if ( increaseAlarmNr && ! hideCell) {
					alarmNrShow++;
					cell.innerHTML = "ALARM&nbsp;"+alarmNrShow; //Se cambia ordenación (*)
				} else {
					cell.innerHTML = "ALARM&nbsp;"+(k+2*j+1); //Se cambia ordenación (*)
				}
				cell.style.paddingLeft = "5px";
				cell.style.paddingRight = "5px";
				cell.className = "alarmTable";
				cell.id = "alarmCell_"+nr+"_"+mode+"_"+j+"_"+k;
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
				var index = k+2*j;
				if (nr==0 && mode==1){ //Se cambiar orden en alarmas de banda del master para ocultar algunas alarmas
					ord = [1,0,2,3,4,5,6,8,9,7,10,11,12,13,14,15];
					index = ord[k+2*j];
				}
				if (nr>0 && mode==1){ //Order change in band remote alarms to hide Overload DL and Rx Power Low
					ord = [0,2,3,4,6,5,1,7,8,9,10,11,12,13,14,15];
					index = ord[k+2*j];
				}
				var cell = this.createInputText("AlName",index,mode,nr); //Se cambia ordenación (*)
				row.appendChild(cell);
				cell.className = "alarmTable";
				if (hideCell) {
					cell.style.display = "none";
				}
				var cell = this.createEnabledCheckBox(index,mode,0,nr); //Se cambia ordenación (*)
				row.appendChild(cell);
				cell.className = "alarmTable";
				cell.style.textAlign = "center";
				cell.style.minWidth = "70px";
				if (hideCell) {
					cell.style.display = "none";
				}
				if (mode == 0) {
					var cell = this.createPolarityCheckBox(index,nr);
					cell.className = "alarmTable";
					cell.style.textAlign = "center";
					cell.style.minWidth = "70px";
					if (hideCell) {
						cell.style.display = "none";
					}
					row.appendChild(cell);
				}
				for (var i=0;i<4;i++){
					var cell = this.createCheckBox(index,mode,i,nr); //Se cambia ordenación (*)
					row.appendChild(cell);
					cell.className = "alarmTable";
					if (hideCell) {
						cell.style.display = "none";
					}
				}
			}
		}
		return cellb;
	}
	this.createInputText = function(id,num,mode,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.input = "text";
		el.style.fontWeight = "bold";
		el.id = id+"_"+num+"_"+mode+"_"+nr;
		el.size = 30;
		el.maxLength = 30;
		cell.appendChild(el);
		return cell;
	}
	this.createEnabledCheckBox = function(num,mode,enav,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "enabled_"+num+"_"+mode+"_"+enav+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		el.enav = enav;
		cell.appendChild(el);
		return cell;		
	}
	this.createPolarityCheckBox = function(num,nr) {
		var cell = document.createElement("td");
		if (num < 8 || num > 11) {
			return cell;
		}
		var el = document.createElement("input");
		var externalAlarmNr = num - 8;
		el.id = "extAlarmPolarity_"+externalAlarmNr+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;
	}
	this.createCheckBox = function(num,mode,nrelay,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "relay_enabled_"+num+"_"+mode+"_"+nrelay+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";			
		cell.appendChild(el);
		return cell;		
	}
	this.createBandRelayConfig = function(){
		var cell = document.createElement("th");
		cell.innerHTML = "BAND-SPECIFIC&nbsp;RELAY&nbsp;SETTINGS";
		return cell;
	}
	this.createRelayStatusAlarm = function(nr){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "RELAY&nbsp;STATUS&nbsp;ON&nbsp;ALARM";
		cell.className = "cth";
		cell.colSpan = 5;
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var num = 0;num<3;num++){
			var row = this.createRelayStatusCtrl(num,nr);
			tb.appendChild(row);
		}
		return cellb;
	}
	this.createRelayStatusCtrl = function(num,nr){
		var row = cell = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Relay " +(num+1);
		cell.style.width = "80px";
		for (var j=0;j<2;j++){
			var cell = document.createElement("td");
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "radio";
			el.name = "relayStatus_"+num+"_"+nr;
			el.value = j;
			el.className = "contentcell";
			cell.appendChild(el);
			var cell = document.createElement("td");
			cell.innerHTML = j==0?"Closed":"Open";
			row.appendChild(cell);
		}
		return row;
	}
	this.relayStatusCtrlGet = function(num,nr){
		var el = document.getElementsByName("relayStatus_"+num+"_"+nr);
		for (var i=0;i<el.length;i++){
			if(el[i].checked) return el[i].value;
		}
		return true;
	}
	this.relayStatusCtrlSet = function(num,nr,val){
		var el = document.getElementsByName("relayStatus_"+num+"_"+nr);
		el[val?1:0].checked = true;
	}
	this.createRowPowerBand = function(nr){
		var tab = document.createElement("table");
		if (nr>0 || !DAScentric){
			tab.className = "contenttable";
			tab.style.width = "100%";
		}else
			tab.align = "center";
		for (var band=0;band<2;band++){
			var rowb = document.createElement("tr");
			rowb.id = "powbandrow_0_"+band+"_"+nr;
			rowb.style.display = "none";				
			tab.appendChild(rowb);
			var cell = document.createElement("th");
			cell.id = "powbandtitle_"+band+"_"+nr;
			cell.colSpan=3;
			cell.className = "cth";
			rowb.appendChild(cell);	
			var rowb = document.createElement("tr");
			rowb.id = "powbandrow_1_"+band+"_"+nr;
			rowb.style.display = "none";
			tab.appendChild(rowb);
			var cell = document.createElement("th");
			cell.innerHTML = "VSWR&nbsp;METER";
			cell.className = "cth";
			cell.colSpan = 2;
			rowb.appendChild(cell);	
			var cell = document.createElement("th");
			cell.innerHTML = "DONOR&nbsp;ANTENNA&nbsp;FAILURE&nbsp;ADJUSTMENT";
			cell.style.display = nr==0?"table-cell":"none";
			cell.className = "cth";
			rowb.appendChild(cell);		
			var rowb = document.createElement("tr");
			rowb.id = "powbandrow_2_"+band+"_"+nr;
			rowb.style.display = "none";	
			tab.appendChild(rowb);
			var cell = this.createPowerCell(nr,band);
			rowb.appendChild(cell);		
			var cell = this.createVSWRCell(nr,band);
			rowb.appendChild(cell);	
			var cell = this.createDonorAntFailCell(nr,band);
			cell.style.display = nr==0?"table-cell":"none";
			rowb.appendChild(cell);	
			if (band==1){
				var rowb = document.createElement("tr");
				if (nr>0) rowb.style.display = "none";
				tab.appendChild(rowb);
				if (!DAScentric && factory[nr].commonUl){
					var cell = document.createElement("th");
					rowb.appendChild(cell);
				}
				for (var k=0;k<2;k++){
					var cell = document.createElement("th");
					if (k>0) cell.style.display = "none";
					cell.innerHTML = "ANTENNA&nbsp;DISCONNECTION";
					cell.id = "antDisconnTitle_"+k;
					cell.className = "cth";			
					rowb.appendChild(cell);	
				}
				var rowb = document.createElement("tr");
				if (nr>0) rowb.style.display = "none";
				tab.appendChild(rowb);
				if (!DAScentric && factory[nr].commonUl){
					var cell = document.createElement("th");
					rowb.appendChild(cell);
				}
				for (var k=0;k<2;k++){	
					var cell = this.createBroadbandLevelIn(nr,k);
					cell.id = "antDisconnCtrl_"+k;
					if (k>0) cell.style.display = "none";
					if (DAScentric){
						cell.style.paddingLeft = "100px";
						cell.style.paddingRight = "100px";
					}
					rowb.appendChild(cell);
				}
			}
		}
		return tab;
	}
	this.createPowerCell = function(nr,band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.style.width = "70%"
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		RFsettings.max = 40;
		RFsettings.min = -10;
		RFsettings.high_warn = 33;
		RFsettings.high_alarm = 40;
		var row = createMetRow("rfPowFwd_"+band+"_"+nr, RFsettings, "Power&nbsp;Forward", "dBm");
		tb.appendChild(row);
		var row = createMetRow("rfPowRev_"+band+"_"+nr, RFsettings, "Power&nbsp;Reverse", "dBm");
		tb.appendChild(row);
		var row = this.createVSWRMinPower(nr,band);
		tb.appendChild(row);
		var row = this.warnPowerVSWRMessage(nr,band);
		tb.appendChild(row);
		return cellb;
	}
	this.warnPowerVSWRMessage = function(nr,band){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.innerHTML = "TX&nbsp;Power&nbsp;Too&nbsp;Low&nbsp;For VSWR&nbsp;Measurement";
		cell.className = "tabval";
		row.style.height = "30px";
		cell.id = "warnPowerMess_"+band+"_"+nr;
		cell.style.display = "none";
		return row;
	}
	this.createVSWRMinPower = function(nr, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Minimum&nbsp;TX&nbsp;Power<br>for&nbsp;VSWR&nbsp;Detection";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);	
		var el = document.createElement("input");
		el.id = "minPowerVSWR_"+band+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = 30;
		el.min = -10;
		el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var num = parseFloat(target.value);
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.innerHTML = "dBm";
		cell.style.textAlign = "right";
		return row;
	}
	this.VSWRMinPowerSet = function(band, nr, val) {
		try {
			var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toFixed(1);
		} catch (err) { }
	}
	this.VSWRMinPowerGet = function(band, nr) {
		try {
			var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createAlarmSens = function(nr,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Alarm&nbsp;Sensitivity";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "alarmSens_"+band+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = 100;
		el.min = 0;
		el.title = "Min: "+el.min+" sec., Max: "+el.max+" sec.";
		el.onchange = function(ev) {
			var target = this;
			var num = ~~target.value;
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "sec";
		cell.colSpan = 2;
		cell.style.textAlign = "right";
		return row;
	}
	this.AlarmSensSet = function(band, nr, val) {
		try {
			var el = document.getElementById("alarmSens_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.AlarmSensGet = function(band, nr) {
		try {
			var el = document.getElementById("alarmSens_"+band+"_"+nr);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}			
	this.createRetLossTh = function(nr,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Return&nbsp;Loss&nbsp;Threshold";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "retLossTh_"+band+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = 20;
		el.min = 0;
		el.title = "Min: "+el.min+", Max: "+el.max+" dB";
		el.band = band;
		el.nr = nr;
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var nr = target.nr;
			var num = parseFloat(target.value);
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.colSpan = 2;
		cell.style.textAlign = "right";
		return row;
	}
	this.RetLossThSet = function(band, nr, val) {
		try {
			var el = document.getElementById("retLossTh_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toFixed(1);
			setMetLowWarn("returnLoss_"+band+"_"+nr,val);
		} catch (err) { }
	}
	this.RetLossThGet = function(band,nr) {
		try {
			var el = document.getElementById("retLossTh_"+band+"_"+nr);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}		
	this.createVSWRCell = function(nr,band){
		var cellb = document.createElement("td");
		cellb.style.paddingTop = "20px";
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.style.width = "70%"
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("returnLoss_"+band+"_"+nr, VSWRsettings, "Return&nbsp;Loss", "dB");
		tb.appendChild(row);
		var row = this.createRetLossTh(nr,band);
		tb.appendChild(row);
		var row = this.createAlarmSens(nr,band);
		tb.appendChild(row);		
		return cellb;
	}
	this.createDonorAntFailCell = function(nr,band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.style.width = "90%"
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		this.createTimeTrigger(tb,band,nr);
		return cellb;
	}
	this.createTimeTrigger = function(tb,band,nr){
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var cell = document.createElement("th");
		cell.innerHTML = "hours";
		row.appendChild(cell);		
		var cell = document.createElement("th");
		cell.innerHTML = "min";
		row.appendChild(cell);		
		var cell = document.createElement("th");
		cell.innerHTML = "sec";
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Time&nbsp;Limit&nbsp;To&nbsp;Trigger&nbsp;Alarm";
		cell.className = "thdrht";
		for (var j=2;j>=0;j--) row.appendChild( this.createTimeTriggerBox(band,j,nr));
		var cell = document.createElement("th");
		cell.style.width = "40px";
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.id = "altimer_"+band+"_"+nr;
		cell.className = "thdrht";		
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.className = "tabval";
		cell.id = "timeElap_" + band+"_"+nr;
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.className = "tabval";
		cell.style.color = "black";
		cell.id = "alRxPowLow_" + band+"_"+nr;
		
	}
	this.timeElapsedSet = function(band,nr,valH,valL,valLth){
		var times = [0,0,0];
		var res;
		var val = valH>valL?valH:valL;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		var str = "";
		str += times[2] + "h&nbsp;";
		str += ("0"+times[1]).substr(-2,2) + "m&nbsp;";
		str += ("0"+times[0]).substr(-2,2) + "s&nbsp;";
		var el = document.getElementById("timeElap_"+band+"_"+nr);
		el.innerHTML = str;
		el.style.color = (valH>valL || (valH==0 && valL==0)) ?"black":"red";
		var txtbold = false;
		if (valH<=valL) txtbold = valL>=valLth;
		el.style.fontWeight = txtbold?"bold":"normal";
		el = document.getElementById("alRxPowLow_"+band+"_"+nr);
		el.innerHTML = (valH>valL || (valH==0 && valL==0))?"Rx&nbsp;Power&nbsp;OK":"Rx&nbsp;Power&nbsp;Low";
		el.style.color = (valH<=valL && valL>=valLth && !(valH==0 && valL==0))?"red":"black";
		el = document.getElementById("altimer_"+band+"_"+nr);
		el.innerHTML = valH>valL?"":"Alarm&nbsp;Timer";
		
	}
	this.timeTriggerSet = function(band,nr,val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++)
			document.getElementById("timeTrigger_"+band+"_"+k+"_"+nr).value = times[k];
	}
	this.timeTriggerGet = function(band, nr){
		var	res = parseInt(document.getElementById("timeTrigger_"+band+"_0"+"_"+nr).value);
		res +=  60*parseInt(document.getElementById("timeTrigger_"+band+"_1"+"_"+nr).value);
		res +=  3600*parseInt(document.getElementById("timeTrigger_"+band+"_2"+"_"+nr).value);
		return res;
	}
	this.createTimeTriggerBox = function(band,hms,nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "timeTrigger_"+band+"_"+hms+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		el.max = hms==2?1000:59;
		el.min = 0;
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = ~~target.value;
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}		
		cell.appendChild(el);
		return cell;
	}	
	this.createUnitHead = function(title,idt,titleaux,idsubt,nr) {
		var box = document.createElement("div");
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		tab.style.width = "100%";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);			
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.innerHTML = titleaux;
		cell.id = idsubt;
		cell.style.width = "100px";
		cell.style.paddingLeft = "30px";	
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = idt;
		cell.innerHTML = title;
		cell.className = "tag";
		cell.style.width = "50%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.style.width = "100px";	
		cell.style.paddingRight= "30px";
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
	}

	function createMetCell(id, s) {
		var tdNode = document.createElement("td");
		tdNode.id = "met_"+id;
		var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		met.attachTo(tdNode);
		met.valueSet(s.min);
		return tdNode;
	}
	function setTextCell(id, val){
		try {
			var el = document.getElementById("txt_"+id);
			el.innerHTML = val;
		} catch(e) {}
	}
	function createTextCell(id) {
		var tdNode = document.createElement("td");
		tdNode.id = "txt_"+id;
		tdNode.style.minWidth = "43px";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
		return tdNode;
	}

	function createMetRow(id, s, title, units) {
		var trNode = document.createElement("tr");
		var tdNode = document.createElement("th");
		trNode.appendChild(tdNode);
		tdNode.innerHTML = title;
		tdNode.className = "thdrht";
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "met_"+id;
		var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		met.attachTo(tdNode);
		met.valueSet(s.min);
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "txt_"+id;
		tdNode.style.minWidth = "50px";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
		tdNode.innerHTML = "";
		tdNode = document.createElement("td");
		tdNode.innerHTML = units;
		tdNode.style.textAlign = "right";
		trNode.appendChild(tdNode);
		return trNode;
	}
	function setMetLowWarn(id, val) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			met.mLowWarning = val;
		} catch (err) { }
	}
	function setMetValue(id, val, opt) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			if (met) {
				var color;
				if (typeof(opt) !== "undefined") {
					if (opt.toLowerCase() == "normal") {
						color = met.colorNormal;
					} else if (opt.toLowerCase() == "warning") {
						color = met.colorWarn;
					} else if (opt.toLowerCase() == "alarm") {
						color = met.colorAlarm;
					} else {
						color = opt;
					}
				}
				met.valueSet(val, color);
			}
			var txt = document.getElementById("txt_"+id);
			if (txt) {
				if (isNaN(val)) {
					txt.innerHTML = val;
				} else {
					txt.innerHTML = val.toFixed(1);
				}
			}
		} catch (err) { }
	}

	function createLedBox(id) {
		var tdNode = document.createElement("td");
		var led = document.createElement("img");
		led.id = id;
		led.src = "bullet_grey.png";
		led.className = "centered";
		led.align = "center";
		tdNode.appendChild(led);
		return tdNode;
	}

	function ledSetColor(id, color) {
		try {
			var led = document.getElementById(id);
			if (color == "red") {
				led.src = "bullet_red.png";
			} else if (color == "green") {
				led.src = "bullet_green.png";
			} else if (color == "yellow") {
				led.src = "bullet_yellow.png";
			} else if (color == "grey") {
				led.src = "bullet_grey.png";
			} else {
				led.src = "bullet_grey.png";
			}
		} catch (err) {}
	}

	function mMeter(min, max, loA, hiA, loW, hiW) {
		this.mMax = max;
		this.mMin = min;
		this.mVal = max;
		this.mLowAlarm = loA;
		this.mHighAlarm = hiA;
		this.mLowWarning = loW;
		this.mHighWarning = hiW;
		this.colorNormal = "#00a500";
		this.colorWarn = "#f2b200";
		this.colorAlarm = "#e20000";
		this.mDiv = document.createElement("div");
		this.mSpan = document.createElement("span");
		this.mDiv.appendChild(this.mSpan);
		this.mDiv.className = "meter";
		this.mDiv.style.width = "45px";
		this.getDiv = function ()  {
			return this.mDiv;
		}
		this.attachTo = function(parent) {
			try {
				parent.mMeter = this;
				parent.appendChild(this.mDiv);
			} catch (err) {}
		}
		this.valueSet = function(val, color) {
			try {
				var percent;
				if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)) || val <= this.mMin)
					percent = 0;
				else if (val >= this.mMax)
					percent = 100;
				else
					percent = 100*(val - this.mMin)/(this.mMax - this.mMin);
				this.mSpan.style.width = ""+percent.toFixed(0)+"%";
				var bColor;
				if (typeof(color) === 'undefined') {
					if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)))
						bColor = this.colorNormal;
					else if (val < this.mLowAlarm)
						bColor = this.colorAlarm;
					else if (val < this.mLowWarning)
						bColor = this.colorWarn;
					else if (val > this.mHighAlarm)
						bColor = this.colorAlarm;
					else if (val > this.mHighWarning)
						bColor = this.colorWarn;
					else
						bColor = this.colorNormal;
				} else
					bColor = color;
				this.mSpan.style.backgroundColor = bColor;
			} catch (err) {}
		}
	}

	function setMetRange(id, settings) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			if (!met) {
				return;
			}
			met.mMax = settings.max;
			met.mMin = settings.min;
			met.mLowAlarm = settings.loA;
			met.mHighAlarm = settings.hiA;
			met.mLowWarning = settings.loW;
			met.mHighWarning = settings.hiW;
		} catch (err) { }
	}	

	this.alarmThrshElements = [
		{
			lbl: "LOSS&nbsp;OF&nbsp;OPTICAL&nbsp;SIGNAL&nbsp;LINK&nbsp;#1 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los1"
		},
		{
			lbl: "LOSS&nbsp;OF&nbsp;OPTICAL&nbsp;SIGNAL&nbsp;LINK&nbsp;#2 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los2"
		},
		{
			lbl: "OVER&nbsp;TEMPERATURE (&deg;C)",
			lblaux: "",
			sign: ">",
			id: "temp"
		},
		{
			lbl: "DOWNLINK&nbsp;OUTPUT&nbsp;POWER&nbsp;ALARM&nbsp;(Band 1) (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			id: "dlpwr_1"
		},
		{
			lbl: "DOWNLINK&nbsp;OUTPUT&nbsp;POWER&nbsp;ALARM&nbsp;(Band 2) (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			id: "dlpwr_2"
		}
	];
	this.AlarmThrshElementsId = function(k, i, nr) {
		return (this.alarmThrshElements[k].id+"_"+i+"_"+nr);
	}
	this.createAlarmThresholds = function(nr) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		tab.style.backgroundColor = "#e6e6e6";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		// labels
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "THRESHOLD";
		cell.style.minWidth = "100px";
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "HYSTERESIS";
		cell.style.minWidth = "100px";
		row.appendChild(cell);
		// data
		for (var k = 0; k < this.alarmThrshElements.length; ++k) {
			var row = document.createElement("tr");
			var cell = document.createElement("th");
			if (k==3 || k==4) {
				var band = k - 3;
				row.style.display = "none";
				row.id = "althresrow_"+band+"_"+nr;
				cell.id = "althrestitle_"+band+"_"+nr;
			}
			cell.innerHTML = this.alarmThrshElements[k].lbl;
			row.appendChild(cell);
			cell = document.createElement("th");
			cell.innerHTML = this.alarmThrshElements[k].sign;
			row.appendChild(cell);
			for (var i = 0; i < 2; ++i) {
				var cell = document.createElement("td");
				row.appendChild(cell);
				var el = document.createElement("input");
				el.type = "text";
				el.id = el.name = this.AlarmThrshElementsId(k, i, nr);
				el.isHys = (i == 1);
				if (el.isHys) {
					el.min = NFPAcfg[nr].alrmThrshHystLimits.min;
					el.max = NFPAcfg[nr].alrmThrshHystLimits.max;
				} else {
					el.min = NFPAcfg[nr].alarmThrshLimits[k].min;
					el.max = NFPAcfg[nr].alarmThrshLimits[k].max;
				}
				el.onkeypress = function(ev) {
					if (this.isHys) {
						return isKeyDecimalPositive(ev);
					}
					return isKeySignedNumber(ev);
				}
				el.onchange = function(ev) {
					var v;
					if (this.isHys) {
						v = Math.round(parseFloat(this.value)*2)/2;
					} else {
						v = parseInt(this.value);
					}
					if (v < this.min) {
						v = Number(this.min);
					} else if (v > this.max) {
						v = Number(this.max);
					}
					if (this.isHys) {
						this.value = v.toFixed(1);
					} else {
						this.value = v;
					}
				}
				if (el.isHys) {
					el.title = "Min: 0, Max: 10, Resolution: 0.5"
				} else {
					el.title = "Min: "+NFPAcfg[nr].alarmThrshLimits[k].min+
						", Max: "+NFPAcfg[nr].alarmThrshLimits[k].max+", Resolution: 1";
				}
				el.size = 5;
				el.className = "centered";
				el.style.textAlign = "right";
				cell.appendChild(el);
				if (!el.isHys) {
					cell = document.createElement("th");
					cell.innerHTML = "&#177;";
					row.appendChild(cell);
				}
			}
			if (this.alarmThrshElements[k].lblaux.length>0){
				cell = document.createElement("th");
				cell.innerHTML = this.alarmThrshElements[k].lblaux;
				row.appendChild(cell);
			}
			tb.appendChild(row);
		}
		return tab;
	}
}
function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 2000;
	} else {
		return 100;
	}
}