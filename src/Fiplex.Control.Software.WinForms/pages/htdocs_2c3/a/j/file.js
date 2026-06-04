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
var saveFileCmd;

var saveFileCmdDefault = 
[
	{get: "/global_conf.shtml", post:"nosend" , postReg: "global_req", len: 3470, decode: 0},
	{get: "/update_proj.shtml", post:"nosend" , postReg: "proj_req", len: 1460, decode: 0},
	{get: "/updt_comm.shtml", post:"nosend" , postReg: "", len:  157, decode: 0}
];

var loadFileCmd = 
[
	{get: "/update_conf.shtml", post:"ctl_conf_str" , postReg: "conf_req", len: 1946, decode: 0},
	{get: "/update_proj.shtml", post:"proj_str" , postReg: "proj_req", len:  1460, decode: 0},
	{get: "/update_nfpa.shtml", post:"nfpa_str" , postReg: "nfpa_req", len:  584, decode: 0},
	{get: "/updt_comm.shtml", post:"np_settings_str" , postReg: "", len:  157, decode: 0}
];


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
	var tagFile = new Tags(window.top.MaxChNr, window.top.TAGLEN);
	if (loadFileCmd.length!=fdatafr.length) return false;
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
	//reset saveFileCmd data
	saveFileCmd = [];
	for (var k=0;k<saveFileCmdDefault.length;k++) {
		saveFileCmd.push(saveFileCmdDefault[k]);
	}
	if (format==1){ //pdf report
		saveFileCmd.pop(); //remove last entry (comm settings)
		saveFileCmd.push({get: "/update.shtml", post:"nosend" , postReg: "global_req", len: 1892, decode: 0});
		saveFileCmd.push({get: "/update_log.shtml", post:"nosend" , postReg: "global_req", len: 0, decode: 0});
	}
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
						if ((saveFileCmd[num].len>0) && (serverResponse.length!=saveFileCmd[num].len) && (nretr<10)){
							nretr++;
							fileTimerId = setTimeout(function() { getData(num,postget,format); }, 2000);
							return;
						}
						if ((saveFileCmd[num].len>0) && serverResponse.length!=saveFileCmd[num].len){
							alert((format==0 ? "Error generating CFG File": "Error generating PDF Report"));
							getDataEnd();
							return;
						}
						if (num == 0) { //after globalconfig (step0) only config field is written to the file
							if ( fileParseGlobalConfig(this.responseText) < 0 ) {
								alert((format==0 ? "Error generating CFG File": "Error generating PDF Report"));
								getDataEnd();
								return;
							}
							fdata.push(settings.config.frm+'\n');

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
								if (typeof genReport === 'undefined') {
									// Load the JS file and wait for it to load
									var script = document.createElement('script');
									script.src = 'a/j/pdfreport.js';
									script.onload = function() {
										// Script loaded, now call genReport
										if (typeof genReport !== 'undefined') {
											genReport(1, settings, fdata[3], fdata[4]);
										} else {
											alert('Error loading pdf library');
										}
										getDataEnd();
									};
									script.onerror = function() {
										alert('Error loading pdf library');
										getDataEnd();
									};
									document.head.appendChild(script);
								} else {
									// genReport already exists, call it directly
									genReport(1, settings, fdata[3], fdata[4]);
									getDataEnd();
								}
								return;
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
