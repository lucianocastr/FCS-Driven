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
var remoteFileConfResponseValid = [true, false, false];
var frameSeparator = "\t\t\t";
var NORMAL = 0;
var CHECKHEADER = 1;
var CHECKSUBTAG = 2;
var saveFileCmd = 
[
	{get: "/updt_comm.shtml", post:"nosend" , postReg: "", len:  157},
	{get: "/global_conf.shtml", post:"nosend" , postReg: "global_req", len: masterGlobalConfigLength}
];

var loadFileCmd = 
[
	//primero info de master
	{post:"np_settings_str" , postReg: "", len:  157, type: NORMAL},
	{post:"ctl_conf_str" , postReg: "conf_req", len: remoteHeaderLength + masterConfigLength, type: CHECKHEADER},
	{post:"nfpa_str" , postReg: "nfpa_req", len:  remoteHeaderLength + masterNfpaConfigLength, type: CHECKHEADER},
	{post:"ctl_tags_str" , postReg: "tags_req", len:  tagLength*(1+nrOfRemotes), type: CHECKSUBTAG}

];
for (var k=0;k<nrOfRemotes;k++){
	loadFileCmd.push({post:"ctl_conf_str" , postReg: "conf_req", len: remoteHeaderLength + remoteConfigLength, type: CHECKHEADER});
	loadFileCmd.push({post:"nfpa_str" , postReg: "nfpa_req", len:  remoteHeaderLength + remoteNfpaConfigLength, type: CHECKHEADER});
}

var openFile = function(event) {
	var el = window.parent.navi.document.getElementById("files");
	if (el.value.length!=0){
		var input = event.target;
		var reader = new FileReader();
		reader.onload = function(){
			var fdata = reader.result;
			var fdatafr = fdata.split('\n');
			if (fdatafr[fdatafr.length-1].length==0) fdatafr=fdatafr.slice(0,-1);
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
		};
		reader.readAsText(input.files[0]);
		el.value = "";
	}
}
function checkFile(fdatafr){
	if (loadFileCmd.length!=fdatafr.length) return false;
	frtoload = [];
	for (var k=0;k<fdatafr.length;k++){
		if (loadFileCmd[k].len!=fdatafr[k].length) return false;
		if (loadFileCmd[k].type==CHECKHEADER){ //config o alarm config
			if ((1 === parseInt(fdatafr[k].substring(2,4),16)))	frtoload.push(loadFileCmd[k].post+"="+fdatafr[k]);
		}else if (loadFileCmd[k].type==CHECKSUBTAG){ //tag
			var str = fdatafr[k].substring(0,tagLength)+frameSeparator;
			for (var n=1;n<=nrOfRemotes;n++){
				str+=hexformat(n,2);
				var subtag = fdatafr[k].substring(tagLength*n,tagLength*(n+1));
				if (subtag==(strRepeat('X',tagLength))){
					str+=hexformat(0,2);
				}else{
					str+=hexformat(1,2);
					str+=subtag;
				}
				if (n<nrOfRemotes) str+=frameSeparator;
			}
			frtoload.push(loadFileCmd[k].post+"="+strToHex(str));
		}else{ //eth
			frtoload.push(loadFileCmd[k].post+"="+fdatafr[k]);
		}
	}
	return true;
}

function postData() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				countConf = 0;
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
		xhr.send(frtoload[numtoload]);
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

function Settings(n) {
	this.config = new Config();
	this.tags = new Tags;
	this.NFPAcfg = new NFPAconf(n); 
	this.ethernetConfig;
	this.serNr = new SerialNrT();
	this.factory = new Factory();
	this.version = new Version();
	this.serNrFrame;
}

function savecfg(format) {
	isFileBusy = true;
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	settings = [];
	for (var nr=0;nr<=nrOfRemotes;nr++)
		settings.push(new Settings(nr));
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
						var str = this.responseText;
						if (num == 1) {
							var deviceStr = str.split(frameSeparator);

							if (deviceStr.length != 1+nrOfRemotes) {
								alert("Error generating CFG File (1)");
								getDataEnd();
								return;
							}
							for (var n = 1; n <= nrOfRemotes; n++ ) {
								if (deviceStr[n].length < remoteGlobalConfigLength+remoteHeaderLength) {
									remoteFileConfResponseValid[n] = false;
								}else{
									remoteFileConfResponseValid[n] = (1 === parseInt(deviceStr[n].substring(2,4),16));
									deviceStr[n] = deviceStr[n].substr(remoteHeaderLength);
								}
							}
							if ((deviceStr[0].length!=saveFileCmd[num].len) && (nretr<10)){
								nretr++;
								fileTimerId = setTimeout(function() { getData(num,postget,format); }, 2000);
								return;
							}
							if (deviceStr[0].length!=saveFileCmd[num].len){
								alert("Error generating CFG File (2)");
								getDataEnd();
								return;
							}
							for (var n = 0; n <= nrOfRemotes; n++ ) {
								if (remoteFileConfResponseValid[n]){
									if ( fileParseGlobalConfig(deviceStr[n],n) < 0 ) {
										alert("Error generating CFG File (3)");
										getDataEnd();
										return;
									}
								}
							}
							for (var n = 0; n <= nrOfRemotes; n++ ) {
								var header = hexformat(n,2);
								if (remoteFileConfResponseValid[n]){
									header+=hexformat(1,2);
									fdata.push(header+settings[n].config.frm+'\n');
									fdata.push(header+settings[n].NFPAcfg.frm+'\n');
								}else{
									header+=hexformat(0,2);
									fdata.push(header+strRepeat('0',remoteConfigLength)+'\n');
									fdata.push(header+strRepeat('0',remoteNfpaConfigLength)+'\n');
								}
								if (n==0){
									//tag (se ponen los 3tags concatenador, para guardar una información de longitud constante)
									var strtag = settings[0].tags.getTag();
									for (var i = 1; i <= nrOfRemotes; i++ ) {
										if (remoteFileConfResponseValid[i]){
											strtag += settings[i].tags.getTag();
										}else{
											strtag += strRepeat('X',tagLength); //indicador de remoto no conectado
										}
									}
									fdata.push(strtag+'\n');
								}
							}
						} else {
							if (str.length!=saveFileCmd[num].len){
								alert("Error generating CFG File (4)");
								getDataEnd();
								return;
							}
							fdata.push(str+'\n');
						}
						if (num<(saveFileCmd.length-1)){
							num++;
							nretr = 0;
							getData(num,(saveFileCmd[num].postReg).length!=0?0:1,format);
						} else {
							fileNameSave = "config_"+settings[0].serNr.sernr+(format==0?".cfgr":".txt");
							if (format==0)
								downloadFile(fileNameSave, fdata);
							else{
								var auxdata = [];
								for (var n = 0; n <= nrOfRemotes; n++ ) {
									if (remoteFileConfResponseValid[n]){
										auxdata.push((n==0?"MASTER":"REMOTE "+n)+"\n");
										auxdata.push("\n");
										var strFile = overallConfigToTextFile(settings[n].config,settings[n].NFPAcfg,settings[n].factory,settings[n].tags.getTag(),
										fdata[0],settings[n].serNr.sernr,settings[n].version,n);
										var strdata = strFile.split("\n");
										for (var k=0;k<strdata.length;k++) auxdata.push("\t"+strdata[k]+"\n");
										auxdata.push("\n");
									}
								}
								fdata = auxdata;
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
			xhr.send(saveFileCmd[num].postReq+"="+1);
		}else{
			Date.now = Date.now || function() { return +new Date; }; 				
			xhr.open("GET", saveFileCmd[num].get+"?co="+Date.now(), true);			
			xhr.send(null);
		}
		xhr.timeout = 10000;
		xhr = null;
	} catch (err) {};
}

function fileParseGlobalConfig(str,n) {
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

	settings[n].serNr.parse(srSerNr);
	settings[n].serNrFrame = srSerNr;
	settings[n].tags.parseRawText(srTag);
	settings[n].factory.parse(srFact);
	settings[n].config.parse(srConf,settings[n].factory,n);
	settings[n].NFPAcfg.parse(srNFPA,n);
	settings[n].version.parse(srVersion);
	
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
