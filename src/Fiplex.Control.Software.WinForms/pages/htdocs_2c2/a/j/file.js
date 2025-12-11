var fileTimerId;
var settings;
var fileNameSave;
var fdata;
var countConf = 0;
var nretr;
var frtoload = [];
var numtoload;
var isFileBusy = false;
var tmrPostDataId;

var saveFileCmd = 
[
	{get: "/global_conf.shtml", post:"nosend" , postReg: "global_req", len: 3174, decode: 0},
	{get: "/update_proj.shtml", post:"nosend" , postReg: "proj_req", len: 1460, decode: 0},
	{get: "/updt_comm.shtml", post:"nosend" , postReg: "", len:  157, decode: 0}
];

var loadFileCmd_2c2 = 
[
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1650, decode: 0},
	{get: "/update_proj.shtml", post:"proj_str" , postReg: "proj_req", len:  1460, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  584, decode: 0},
	{get: "/updt_comm.shtml", post:"np_settings_str" , postReg: "", len:  157, decode: 0}
];

var loadFileCmd_2c1 = 
[
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1618, decode: 0},
	{get: "/update_proj.shtml", post:"proj_str" , postReg: "proj_req", len:  1460, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  532, decode: 0},
	{get: "/updt_comm.shtml", post:"np_settings_str" , postReg: "", len:  157, decode: 0}
];

var loadFileCmd_2c = 
[
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1602, decode: 0},
	{get: "/update_proj.shtml", post:"proj_str" , postReg: "proj_req", len:  1460, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  344, decode: 0},
	{get: "/updt_comm.shtml", post:"np_settings_str" , postReg: "", len:  157, decode: 0}
];

var loadFileCmd_1c7 = 
[
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1554, decode: 0},
	{get: "/update_tags.shtml", post:"ctl_tags_str" , postReg: "tags_req", len:  60, decode: 1},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  344, decode: 0},
	{get: "/updt_comm.shtml", post:"np_settings_str" , postReg: "", len:  157, decode: 0}
];

var loadFileCmd = loadFileCmd_2c2;

var newLoadFileCmd = 
[ //compatibilidad con BDA con fibra. this compatibility needs to be re-analyzed
	{get: "/updt_comm.shtml", post:"np_settings_str" , postReg: "", len:  157, decode: 0},
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1576, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  368, decode: 0},
	{get: "/update_tags.shtml", post:"ctl_tags_str" , postReg: "tags_req", len:  180, decode: 1},
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1576, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  368, decode: 0},
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1576, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  368, decode: 0}
	
];

var openFile = function(event) {
	var el = window.parent.navi.document.getElementById("files");
	restoreTagCompatibility();
	if (el.value.length!=0){
		var input = event.target;
		var reader = new FileReader();
		reader.onload = function(){
			var fdata = reader.result;
			var fdatafr = fdata.split('\n');
			if (fdatafr[fdatafr.length-1].length==0) fdatafr=fdatafr.slice(0,-1);
			if (checkNewFileFormat(fdatafr)){
				fdatafr = transformFileFrames(fdatafr);
			}
			forceTagCompatibility(fdatafr);
			if (!checkFile(fdatafr)){
				alert("File not valid");
				return;
			}
			if (typeof window.top.submitLocked === "undefined")
				window.top.submitLocked = false;
			if (window.top.submitLocked) {
				setTimeout(function() { guiBlocked(false); }, 15000);
				return;
			}
			try {
				if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
					clearTimeout(tmrIdStat);
				}
			} catch(err) {}
			showResultIcon(ERR_PENDING);
			guiBlocked(true);
			numtoload = 0;
			postData();
			forceTagCompatibility(fdatafr,false);
		};
		reader.readAsText(input.files[0]);
		el.value = "";
	}
}
function forceTagCompatibility(fdatafr){
	if (fdatafr[1].length == 30){
		loadFileCmd[1].post = "ctl_tags_str";
		loadFileCmd[1].postReg = "tags_req";
		loadFileCmd[1].len = 60;
		loadFileCmd[1].decode = 1;
	}
}
function restoreTagCompatibility(){
	loadFileCmd[1].post = "proj_str";
	loadFileCmd[1].postReg = "proj_req";
	loadFileCmd[1].len = 1460;
	loadFileCmd[1].decode = 0;
}
function transformFileFrames(fdatafr){
	var newfdata = [];
	newfdata.push(fdatafr[1].substring(4,1558));
	newfdata.push(fdatafr[3].substring(0,30));
	newfdata.push(fdatafr[2].substring(4,348));
	newfdata.push(fdatafr[0]);
	return newfdata;
}
function checkNewFileFormat(fdatafr){
	if (newLoadFileCmd.length!=fdatafr.length) return false;
	for (var k=0;k<fdatafr.length;k++){
		if (newLoadFileCmd[k].len!=(fdatafr[k].length*(1+newLoadFileCmd[k].decode))) return false;
	}
	return true;
}
function isLoadfile_2c2(fdatafr) {
	if ((fdatafr[0].length == loadFileCmd_2c2[0].len) && (fdatafr[2].length == loadFileCmd_2c2[2].len)) {
		return true;
	}
	return false;
}
function isLoadfile_2c1(fdatafr) {
	if ((fdatafr[0].length == loadFileCmd_2c1[0].len) && (fdatafr[2].length == loadFileCmd_2c1[2].len)) {
		return true;
	}
	return false;
}
function isLoadfile_2c(fdatafr) {
	if ((fdatafr[0].length == loadFileCmd_2c[0].len) && (fdatafr[2].length == loadFileCmd_2c[2].len)) {
		return true;
	}
	return false;
}
function isLoadfile_1c7(fdatafr) {
	if ((fdatafr[0].length == loadFileCmd_1c7[0].len) && (fdatafr[2].length == loadFileCmd_1c7[2].len)) {
		return true;
	}
	return false;
}
function convertFileAlarmDataToMMSFormat(fdatafr) {
	var conf2c1 = "";
	conf2c1 += fdatafr.slice(0, 64);	// from start up to band alarms, 64 char
	conf2c1 += "FF0FFF07";	// BBU alarms
	// relay assign global and band alarms: delete assingment to relays 5 to 8
	var polarity = 0;
	for (k = 0; k < (16+8); k++) {
		var v = parseInt(fdatafr.slice(64+2*k, 64+2*k+2), 16);
		if (k >= 8 && k < 12) {
			// user alarm, polarity bit
			var p = (0x80 & v) ? 1 : 0;
			polarity += (p << k);
		}
		v &= 0x0F;
		conf2c1 += ("00"+v.toString(16)).slice(-2);
	}
	conf2c1 += "01104020808080808080808080808080";	// relay assing BBU alarms
	conf2c1 += ("00"+polarity.toString(16)).slice(-2);	// polarity
	conf2c1 += "0000015180";	// buzzer
	conf2c1 += fdatafr.slice(112, 224);	// 7 relay timers
	conf2c1 += "0001518000015180";	// 8th relay timers
	conf2c1 += fdatafr.slice(224);	// user alarm names
	conf2c1 += "Annunciator 1                 Annunciator 2                 Annunciator 3                 Annunciator 4                 ";	// annunciator names
	return conf2c1;
}
function convertFileAlarmDataMMSToMVO2Format(fdatafr) {
	var conf2c2 = "";
	conf2c2 += fdatafr.slice(0, 152);	// from start up to end of alarm's relay assign
	conf2c2 += "00015180000151800001";	// 9/10th relay assign
	conf2c2 += fdatafr.slice(152,292);	// from ext. alarm polarity to 8th relay timers
	conf2c2 += "00015180000151800001518000015180";	// 9/10th relay timers
	conf2c2 += fdatafr.slice(292);		// ext. alarm and annunciator tags
	return conf2c2;
}
function fileData2c1To2c2(fdatafr) {
	var conf2c2 = ["","","",""];
	conf2c2[0] = fdatafr[0]+"00015180000151800001518000015180";	// 9/10th relay timers to RF data
	conf2c2[2] = convertFileAlarmDataMMSToMVO2Format(fdatafr[2]); // alarm data
	conf2c2[1] = fdatafr[1];	// tags
	conf2c2[3] = fdatafr[3];	// IP
	return conf2c2;
}
function fileData2cTo2c2(fdatafr) {
	var conf2c2 = ["","","",""];
	conf2c2[0] = fdatafr[0]+"000151800001518000015180000151800001518000015180";	// 8/9/10th relay timers to RF data
	conf2c2[2] = convertFileAlarmDataMMSToMVO2Format(convertFileAlarmDataToMMSFormat(fdatafr[2]));	// alarm data
	conf2c2[1] = fdatafr[1];	// tags
	conf2c2[3] = fdatafr[3];	// IP
	return conf2c2;
}
function fileData1c7To2c2(fdatafr) {
	var conf2c2 = ["","","",""];
	// conf rf
	conf2c2[0] = fdatafr[0].slice(0, 1442);	// RF without relays
	conf2c2[0] += "8DA1A1A1A18DA1A1A1A12B009C002B009C002B009C000050";	// from DH7S improvements
	conf2c2[0] += fdatafr[0].slice(1442);	// 7 relays
	conf2c2[0] += "000151800001518000015180000151800001518000015180";	// 8/9/10th relay timers for MMS
	// conf alarms
	conf2c2[2] = convertFileAlarmDataMMSToMVO2Format(convertFileAlarmDataToMMSFormat(fdatafr[2]));	// alarm data
	// tags & IP conf
	conf2c2[1] = fdatafr[1];	// tags
	conf2c2[3] = fdatafr[3];	// IP
	return conf2c2;
}

function checkFile(fdatafr){
	var tagFile = new Tags(window.top.MaxChNr, window.top.TAGLEN);
	if (loadFileCmd.length!=fdatafr.length) return false;
	if (!isLoadfile_2c2(fdatafr)) {
		if (isLoadfile_2c1(fdatafr)) {
			fdatafr = fileData2c1To2c2(fdatafr);
		} else if (isLoadfile_2c(fdatafr)) {
			fdatafr = fileData2cTo2c2(fdatafr);
		} else if (isLoadfile_1c7(fdatafr)) {
			fdatafr = fileData1c7To2c2(fdatafr);
		} else {
			return false;
		}
	}
	loadFileCmd = loadFileCmd_2c2;
	frtoload = [];
	for (var k=0;k<fdatafr.length;k++){
		if (loadFileCmd[k].decode!=0)
			frtoload.push((tagFile.format(fdatafr[k])).substr(0,60));
		else
			frtoload.push(fdatafr[k]);
		if (loadFileCmd[k].len!=frtoload[k].length) return false;
	}
	return true;
}

function postData() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countConf = 0;
				// alert("postData "+numtoload);
				setTimeout(function() { check_result_file(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			postDataError();
		}
		xhr.ontimeout = function(ev) {
			postDataError();
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send(loadFileCmd[numtoload].post+"="+frtoload[numtoload]);
		xhr = null;
		isFileBusy = true;
	} catch (err) {
		alert("error postData");
		postDataError();
	}
}

function check_result_file() {
	if (typeof countConf === "undefined")
		countConf = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4 && this.status === 200) {
				// alert("check result");
				var error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++countConf < 60) {
						setTimeout(function() { check_result_file(); }, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}

				if (error == ERR_OK){
					if (typeof(tmrPostDataId) !== "undefined" && tmrPostDataId) {
						clearTimeout(tmrPostDataId);
					}
					if (numtoload<frtoload.length-1){
						// alert("ok "+numtoload);
						numtoload++
						postData();
					}else{
						isFileBusy = false;
						showResultIcon(ERR_OK);
						// alert("ok "+numtoload);
						if (!document.getElementById("config_form")) {
							// alert("volver a start");
							setTimeout(function() { postDataEnd(); }, 1500);
						} else {
							// alert("recargar");
							setTimeout(function(){ postDataReload(); }, 1500);
						}
					}
				} else {
					alert("Error applying configuration");
					postDataError();
				}
			}
		}
		xhr.onerror = function(ev) {
			postDataError();
		}
		xhr.ontimeout = function(ev) {
			postDataError();
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function postDataReload() {
	isFileBusy = false;
	showResultIcon(ERR_NONE);
	guiBlocked(false);
	reloadData();
}

function postDataEnd() {
	isFileBusy = false;
	showResultIcon(ERR_NONE);
	guiBlocked(false);
	window.top.firstLoad = true;
	window.parent.navi.document.getElementById("start").click();
}

function postDataError() {
	if (typeof(tmrPostDataId) !== "undefined" && tmrPostDataId) {
		clearTimeout(tmrPostDataId);
	}
	showResultIcon(ERR_FAIL);
	tmrPostDataId = setTimeout(function() { postDataEnd(); }, 1500);
}

function isFileOpBusy() {
	return isFileBusy;
}

function Settings() {
	this.config = new ConfigBDA();
	this.tags = new Tags();
	this.NFPAcfg = new NFPAconf(); 
	this.ethernetConfig;
	this.serNr = new SerialNrT();
	this.factory = new Factory();
	this.serNrFrame;
	this.version = new Version();
}

function savecfg(format) {
	isFileBusy = true;
	showResultIcon(ERR_PENDING);
	guiBlocked(true);

	settings = new Settings();
	fdata = [];
	nretr = 0;
	getData(0,0,format);
}

function getData(num,postget,format) {
	try {
		if (typeof(fileTimerId) !== "undefined" && fileTimerId) {
			clearTimeout(fileTimerId);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					if (postget==0){
						fileTimerId = setTimeout(function() { getData(num,1,format); }, 1000); //revisar si el tiempo entre post/get es suficiente para rabbit
						return;
					}else{
						var serverResponse = this.responseText;
						if ((serverResponse.length!=saveFileCmd[num].len) && (nretr<10)){
							nretr++;
							fileTimerId = setTimeout(function() { getData(num,postget,format); }, 2000);
							return;
						}
						if (serverResponse.length!=saveFileCmd[num].len){
							alert("Error generating CFG File");
							showResultIcon(ERR_NONE);
							return;
						}
						if (num == 0) { //after globalconfig (step0) only config field is written to the file
							if ( fileParseGlobalConfig(this.responseText) < 0 ) {
								alert("Error generating CFG File");
								showResultIcon(ERR_NONE);
								return;
							}
							fdata.push(settings.config.frm+'\n');
							//fdata.push(settings.tags.getTag()+'\n'); 
							//fdata.push(settings.NFPAcfg.frm+'\n');
						}else if (num == 1){ //after projectrelated+tag (step1), projectrelated+tag and NFPAconfig is written to the file, to keep same order
							fdata.push(serverResponse+'\n');
							fdata.push(settings.NFPAcfg.frm+'\n');
						} else {
							fdata.push(serverResponse+'\n');
						}
						if (num<(saveFileCmd.length-1)){
							num++;
							nretr = 0;
							getData(num,(saveFileCmd[num].postReg).length!=0?0:1,format);
						} else {
							fileNameSave = "config_"+settings.serNr.sernr+(format==0?".cfgr":".txt");
							if (format==0)
								downloadFile(fileNameSave, fdata);
							else{
								var strFile = overallConfigToTextFile(settings.config,
																	  settings.NFPAcfg,
																	  settings.factory,
																	  settings.tags.getTag(),
																	  fdata[3],
																	  settings.serNr.sernr,
																	  settings.version);
								fdata = strFile.split("\n");
								for (var k=0;k<fdata.length;k++) fdata[k]+="\n";
								downloadFile(fileNameSave, fdata);
							}
								
						}
					}
				} else {
					if (typeof(fileTimerId) !== "undefined" && fileTimerId)
						clearTimeout(fileTimerId);
					fileTimerId = setTimeout(function() { getData(num,postget,format); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(fileTimerId) !== "undefined" && fileTimerId)
				clearTimeout(fileTimerId);
			// fileTimerId = setTimeout(function() { getData(num,postget,format); }, 2000);
			getDataEnd();
		}
		xhr.ontimeout = function(ev) {
			if (typeof(fileTimerId) !== "undefined" && fileTimerId)
				clearTimeout(fileTimerId);
			// fileTimerId = setTimeout(function() { getData(num,postget,format); }, 2000);
			getDataEnd();
		}
		if (postget==0){
			xhr.open("POST", "/start.zhtml", true);
			xhr.send(saveFileCmd[num].postReg+"="+1);
		}else{
			Date.now = Date.now || function() { return +new Date; }; 				
			xhr.open("GET", saveFileCmd[num].get+"?co="+Date.now(), true);			
			xhr.send(null);
		}
		xhr.timeout = 10000;
		xhr = null;
	} catch (err) {};
}

function fileParseGlobalConfig(str) {
	if ( typeof(str) === 'undefined' || str === null ) {
		return -1;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		return -1;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srEq = srarr[2];
	var srSerNr = srarr[3];
	var srTag = srarr[4];
	var srVersion = srarr[5];
	var srNFPA = srarr[6]; 

	settings.serNr.parse(srSerNr);
	// serNr.render();
	settings.serNrFrame = srSerNr;

	// window.parent.navi.versionFrame = srVersion;
	// version.parse(srVersion);
	// version.store(this.responseText);
	// version.render();
	settings.version.parse(srVersion);

	// window.parent.navi.tagsFrame = srTag;
	settings.tags.parseRawText(srTag);

	// window.parent.navi.factoryFrame = srFact;
	// factory.parse(srFact);
	// localStorage.setItem("Factory"+Prjstr+window.location.host, srFact);
	settings.factory.parse(srFact);
	
	// window.parent.navi.confFrame = srConf;
	settings.config.parse(srConf);
	// config.saveFrameStr(srConf);
	// window.parent.navi.confNfpaFrame = srNFPA;
	settings.NFPAcfg.parse(srNFPA);

	// return ok
	return 0;
}

function downloadFile(filename, fdata) {
	if (!filename) {
		getDataEnd();
		return;
	}
	var blob = new Blob(fdata, {type: 'text/plain'});
	if(window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveBlob(blob, filename);
	} else {
		var elem = window.document.createElement('a');
		elem.href = window.URL.createObjectURL(blob);
		elem.download = filename;        
		document.body.appendChild(elem);
		elem.click();        
		document.body.removeChild(elem);
	}
	getDataEnd();
}

function fileComputeTimeoutReqMs() {
	if (!window.parent.navi.isPCstyle()) {
		return 500;
	} else {
		return 10;
	}
}

function getDataEnd() {
	isFileBusy = false;
	showResultIcon(ERR_NONE);
	guiBlocked(false);
}
