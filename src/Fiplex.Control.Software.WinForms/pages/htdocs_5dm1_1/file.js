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
var fibInfo;
var fileSave = [false,false];
var fileLoad = false;
var ETH = 0;
var CONFIGTAG = 1;
var saveFileCmd = 
[
	{get: "/updt_comm.shtml", postReg: "undefined", len:  157, numframes: 0, index:0},
	{get: "/update_conf.shtml", postReg: "gconf_str=!0000", len: masterConfigLength+remoteHeaderLength, numframes: 7, index:0}
];
var loadFileCmd = 
[
	{post:"np_settings_str" , len:  157, type: ETH, index:0},
	{post:"ctl_conf_str" , len: masterConfigLength+remoteHeaderLength, type: CONFIGTAG, index:0},
];
for (var k=0;k<8;k++){ //Expansion
	var unitIndex = (k+1)<<8;
	var unitHeader = hexformat(unitIndex,4);
	saveFileCmd.push({get: "/update_conf.shtml", postReg: "gconf_str=!"+unitHeader, len: expConfigLength+remoteHeaderLength, numframes: 6, index: unitIndex});
	loadFileCmd.push({post:"ctl_conf_str" , len: expConfigLength+remoteHeaderLength, type: CONFIGTAG, index: unitIndex});
}
for (var k=0;k<8;k++){ //Remotes connected to master
	var unitIndex = (k+1);
	var unitHeader = hexformat(unitIndex,4);
	saveFileCmd.push({get: "/update_conf.shtml", postReg: "gconf_str=!"+unitHeader, len: remoteConfigLength+remoteHeaderLength, numframes: 5, index: unitIndex});
	loadFileCmd.push({post:"ctl_conf_str" , len: remoteConfigLength+remoteHeaderLength, type: CONFIGTAG, index: unitIndex});
}
for (var j=0;j<8;j++){
	for (var k=0;k<7;k++){ //Remotes connected to each expansion
		var unitIndex = ((j+1)<<8) | (k+1);
		var unitHeader = hexformat(unitIndex,4);
		saveFileCmd.push({get: "/update_conf.shtml", postReg: "gconf_str=!"+unitHeader, len: remoteConfigLength+remoteHeaderLength, numframes: 5, index: unitIndex});
		loadFileCmd.push({post:"ctl_conf_str" , len: remoteConfigLength+remoteHeaderLength, type: CONFIGTAG, index: unitIndex});
	}
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
			showResultIcon(ERR_PENDING);
			guiBlocked(true);
			numtoload = 0;
			loadConfig();
		};
		reader.readAsText(input.files[0]);
		el.value = "";
	}
}
function checkFile(fdatafr){
	if (loadFileCmd.length!=fdatafr.length) return false;
	frtoload = [];
	for (var k=0;k<fdatafr.length;k++){
		if (loadFileCmd[k].type==ETH){
			// do not apply IP configuration in case of rabbit board because it may change IP address whithout user awareness, producing ethernet disconnection
			if (window.parent.navi.isEthernetMode) {
				continue;
			}
			if (loadFileCmd[k].len!=fdatafr[k].length) return false; //exact length is required
			frtoload.push({frame:loadFileCmd[k].post+"="+fdatafr[k],index:loadFileCmd[k].index, type:ETH, response:"ACK"});
		}else{ //type = CONFIGTAG
			var sarr = fdatafr[k].split('\t');
			if (sarr.length!=2){
				if (sarr.length==1 && sarr[0].length==remoteHeaderLength && (0 === parseInt(sarr[0].substring(4,6),16))) continue; //Array of 2 subframes is required. If not, only header with frame valid is allowed
				return false; 
			}
			if (sarr[0].length!=loadFileCmd[k].len) return false; //exact length is required (config)
			if (sarr[1].length!=tagLength) return false; //exact length is required (tag)
			frtoload.push({frame:loadFileCmd[k].post+"=*"+fdatafr[k],index:loadFileCmd[k].index, type:CONFIGTAG, response:"ACK"});
		}
	}
	return true;
}
function loadConfig(){
	if (!document.getElementById("config_form")) { //file operation is aborted if pages is not DAS overview, Adv settings, Device List
		alert("Go to DAS Overview to load config file");
		showResultIcon(ERR_NONE);
		guiBlocked(false);
	}else{
		fileLoad = true;
	}
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
			console.log("postData onerror");
			postData();
		}
		xhr.ontimeout = function(ev) {
			console.log("postData ontimeout");
			postData();
		}
		showResultIcon(ERR_PENDING);
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		var nr = frtoload[numtoload].index;
		var i1 = nr & 0xff; var i2 = nr>>8 & 0xff;
		if (nr>=0) window.parent.navi.document.getElementById("cfgprog").innerHTML = nr==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1);
		if (nr==0) nretr = 0;
		xhr.send(frtoload[numtoload].frame);
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
					if (++countConf < 10) {
						setTimeout(function() { check_result_file(); }, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}
				if (error == ERR_FAIL) {
					if (nretr<3){
						console.log("check_result_file NACK"+nretr);
						nretr++;
						postData();
						return;
					}else{
						frtoload[numtoload].response = "NACK";
					}

				}
				if (typeof(tmrPostDataId) !== "undefined" && tmrPostDataId) {
					clearTimeout(tmrPostDataId);
				}
				if (numtoload<frtoload.length-1){
					numtoload++;
					nretr=0;
					postData();
					return;
				}
				isFileBusy = false;
				var isNACK = false;
				for (var i=0;i<frtoload.length;i++){
					if (frtoload[i].response == "NACK"){
						isNACK = true;
						break;
					}
				}
				showResultIcon(isNACK?ERR_FAIL:ERR_OK);
				if (isNACK){
					var errormessage = "Error loading configuration. The following devices have failed: ";
					for (var i=0;i<frtoload.length;i++){
						if (frtoload[i].response == "NACK"){
							if (frtoload[i].type==ETH){
								errormessage += "IP configuration";
							} else {
								var nr = frtoload[i].index;
								var i1 = nr & 0xff; var i2 = nr>>8 & 0xff;
								errormessage += (nr==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1));
							}
							errormessage += ", ";
						}
					}
					errormessage = errormessage.substring(0,errormessage.length-2);
					alert(errormessage);
					postDataError();
				} else {
					if (!document.getElementById("config_form")) {
						setTimeout(function() { fileOpEnd(); }, 1500);
					} else {
						setTimeout(function(){ postDataReload(); }, (window.parent.navi.isEthernetMode?4000:1500));
					}
				}
			}
		}
		xhr.onerror = function(ev) {
			console.log("check_result_file onerror");
			postData();
		}
		xhr.ontimeout = function(ev) {
			console.log("check_result_file ontimeout");
			postData();
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function postDataError() {
	if (typeof(tmrPostDataId) !== "undefined" && tmrPostDataId) {
		clearTimeout(tmrPostDataId);
	}
	showResultIcon(ERR_FAIL);
	tmrPostDataId = setTimeout(function() { postDataReload(); }, (window.parent.navi.isEthernetMode?4000:1500));
}

function isFileOpBusy() {
	return isFileBusy;
}

function Settings(n) {
	this.config = new Config(n);
	this.tags = new Tags();
	this.ethernetConfig;
	this.serNr = new SerialNrT();
	this.factory = new Factory();
	this.version = new Version();
	this.serNrFrame;
}
function savecfg(format){
	if (!document.getElementById("config_form")) { //file operation is aborted if page is not DAS overview, Adv settings, Device List
		alert("Go to DAS Overview to save config file");
	}else{
		fileSave[format] = true;
	}
}
function initSaveCfg(format) {
	isFileBusy = true;
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	settings = [];
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
						fileTimerId = setTimeout(function() { getData(num,1,format); }, computeTimeoutReqMs());
						return;
					}else{
						var str = this.responseText;
						if (str.indexOf("BUSY") >= 0) {
							fileTimerId = setTimeout(function() { getData(num,0,format); }, Math.floor(100+Math.random()*1000));
							return;
						}
						if (num >= 1) { //RF CONFIG AND TAG
							var deviceStr = str.split('\t');
							if ((deviceStr[0].length<saveFileCmd[num].len || deviceStr.length<saveFileCmd[num].numframes) && (nretr<20)){
								nretr++;
								fileTimerId = setTimeout(function() { getData(num,0,format); }, 100);
								return;
							}
							if (deviceStr[0].length<saveFileCmd[num].len || deviceStr[3].length<saveFileCmd[num].tagLength || deviceStr.length<saveFileCmd[num].numframes){
								fdata.push(hexformat(saveFileCmd[num].index,4)+"00"+'\n'); //only header with frame valid = false
								if (num<(saveFileCmd.length-1)){
									num++;
									nretr = 0;
									getData(num,0,format);
									return;
								}
							}
							//Header verification
							var nr = saveFileCmd[num].index;
							var dev = parseInt(deviceStr[0].substring(0,4),16);
							if (dev != nr){
								console.log("Error conf: received["+hexformat(dev,4)+"] expected["+hexformat(nr,4)+"]");
								fileTimerId = setTimeout(function() { getData(num,0,format); }, Math.floor(100+Math.random()*1000));
								return;
							}
							settings[saveFileCmd[num].index] = new Settings(saveFileCmd[num].index);
							fileParseGlobalConfig(deviceStr,saveFileCmd[num].index);
							if (saveFileCmd[num].index==0){
								fibInfo = new fiberInfo(0);
								fibInfo.parse(deviceStr[5]); //to know connected device
							}
							fdata.push(deviceStr[0]+'\t'+deviceStr[3]+'\n'); //each line contains config + tab + tag, except first line with eth configs
						} else { //ETHERNET DATA
							if (str.length!=saveFileCmd[num].len){
								alert("Error generating CFG File (1)");
								fileOpEnd();
								return;
							}
							fdata.push(str+'\n'); //eth config
						}
						if (num<(saveFileCmd.length-1)){
							num++;
							nretr = 0;
							getData(num,0,format);
						} else {
							saveToFile(format);
						}
					}
				} else {
					if (typeof(fileTimerId) !== "undefined" && fileTimerId)
						clearTimeout(fileTimerId);
					fileTimerId = setTimeout(function() { getData(num,0,format); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(fileTimerId) !== "undefined" && fileTimerId)
				clearTimeout(fileTimerId);
				console.log("xhr.onerror");
				fileTimerId = setTimeout(function() { getData(num,0,format); }, 2000);
				//fileOpEnd();
		}
		xhr.ontimeout = function(ev) {
			if (typeof(fileTimerId) !== "undefined" && fileTimerId)
				clearTimeout(fileTimerId);
				console.log("xhr.ontimeout");
				fileTimerId = setTimeout(function() { getData(num,0,format); }, 2000);
				//fileOpEnd();
		}
		var nr = saveFileCmd[num].index;
		var i1 = nr & 0xff; var i2 = nr>>8 & 0xff;
		if (nr>=0) window.parent.navi.document.getElementById("cfgprog").innerHTML = nr==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1);
		if (nr>0){ //global config request to remote or expansion
			if (!fibInfo.FOmoduleConnected[nr] || fibInfo.FOlossCommunication[nr]){
				num++;
				nretr = 0;
				fdata.push(hexformat(nr,4)+"00"+'\n'); //only header with frame valid = false
				if (num<saveFileCmd.length){
					getData(num,0,format);
					return;
				}else{
					saveToFile(format);
				}
			}
		}
		if (postget==0){
			xhr.open("POST", "/start.zhtml", true);
			xhr.send(saveFileCmd[num].postReg);
		}else{
			Date.now = Date.now || function() { return +new Date; }; 				
			xhr.open("GET", saveFileCmd[num].get+"?co="+Date.now(), true);			
			xhr.send(null);
		}
		xhr.timeout = 10000;
		xhr = null;
	} catch (err) {};
}
function saveToFile(format){
	var fileNameSave = "config_"+settings[0].serNr.sernr+(format==0?".cfgr":".txt");
	if (format==0)
		downloadFile(fileNameSave, fdata);
	else{
		var auxdata = [];
		var cond = false;
		for (var j=0;j<2;j++){ //1st iteration master and expansion with cond = false, 2nd iteration remotes with cond = true
			for (var n in settings) {
				var i1 = n & 0xff; var i2 = n>>8 & 0xff;
				if ((i1==0)==cond) continue;
				auxdata.push((n==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1))+"\n");
				auxdata.push("\n");
				var strFile = overallConfigToTextFile(settings[n].config,settings[n].factory,settings[n].tags.getTag(),
				fdata[0],settings[n].serNr.sernr,settings[n].version,n);
				var strdata = strFile.split("\n");
				for (var k=0;k<strdata.length;k++) auxdata.push("\t"+strdata[k]+"\n");
				auxdata.push("\n");
			}
			cond = true;
		}
		fdata = auxdata;
		downloadFile(fileNameSave, fdata);
	}	
}
function fileParseGlobalConfig(srarr,n) {
	var srConf = srarr[0].substr(remoteHeaderLength);//remove header
	var srFact = srarr[1];
	var srSerNr = srarr[2];
	var srTag = srarr[3];
	var srVersion = srarr[4];

	settings[n].serNr.parse(srSerNr);
	settings[n].serNrFrame = srSerNr;
	settings[n].tags.parseRawText(srTag);
	settings[n].factory.parse(srFact);
	settings[n].config.parse(srConf,settings[n].factory);
	settings[n].version.parse(srVersion);
	
	return 0;
}

function downloadFile(filename, fdata) {
	if (!filename) {
		fileOpEnd();
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
	fileOpEnd();
}

function fileComputeTimeoutReqMs() {
	if (!window.parent.navi.isPCstyle()) {
		return 500;
	} else {
		return 10;
	}
}

function fileOpEnd() {
	window.parent.navi.document.getElementById("cfgprog").innerHTML  = "";
	isFileBusy = false;
	showResultIcon(ERR_NONE);
	guiBlocked(false);
	if (typeof(nextRequest) !== "undefined") nextRequest();
}

function postDataReload() {
	window.parent.navi.document.getElementById("cfgprog").innerHTML  = "";
	isFileBusy = false;
	showResultIcon(ERR_NONE);
	guiBlocked(false);
	reloadData();
	if (typeof(nextRequest) !== "undefined") nextRequest();

}
function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 1000;
	} else {
		return 100;
	}
}
