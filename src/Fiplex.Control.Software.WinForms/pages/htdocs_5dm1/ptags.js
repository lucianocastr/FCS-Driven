var tags;
var config;
var serNr;
var version;
var timerId;
var countCheck;
var remoteConfResponseValid = [false, false];
var frameSeparator = "\t\t\t";

function onloadInit() {
	config = new Config();
	tags = [];
	serNr = [];
	version = [];
	for ( var n = 0; n <= nrOfRemotes; n++ ) {
		tags.push(new Tags());
		serNr.push(new SerialNrT());
		version.push(new Version());
	}
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	globalConfigReq();
}
function reloadData(){
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
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
				createForm();
				showInfo();
				guiBlocked(false);
				disableSernrAndVersion();
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

function disableSernrAndVersion() {
	for ( var n = 0; n <= nrOfRemotes; n++ ) {
		try {
			var id = "versionEntry_"+n;
			document.getElementById(id).disabled = true;
			id = "serialNrEntry_"+n;
			document.getElementById(id).disabled = true;
		} catch(err) { alert("NO EXISTE"+n); }
	}
}

function parseGlobalConfig(str) {
	if ( typeof(str) === 'undefined' || str === null ) {
		globalConfigReq();
		return;
	}
	str = correctASCII(str);
	var deviceStr = str.split(frameSeparator);
	if (deviceStr.length < (1+nrOfRemotes)) {
		//alert("Error retrieving info. Global conf error subframes nr="+deviceStr.length);	// debug
		globalConfigReq();
		return;
	}
	if (deviceStr[0].length < masterGlobalConfigLength) {
		//alert("Error retrieving info. Global conf master length="+deviceStr[0].length);	// debug
	}
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		if (deviceStr[remoteNr].length < remoteGlobalConfigLength+remoteHeaderLength) {
			remoteConfResponseValid[n] = false;
		}else{
			remoteConfResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
		}
	}
	// master
	parseGlobalConfigUnit(deviceStr[0], 0);
	// remotes
	for (var n = 0; n < nrOfRemotes; n++) {
		var remoteNr = n+1;
		if (!remoteConfResponseValid[n]) {
			continue;
		}
		parseGlobalConfigUnit(deviceStr[remoteNr].substr(remoteHeaderLength), remoteNr);
	}

}
function parseGlobalConfigUnit(str, n) {
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		return;
	}
	var srConf = srarr[0];
	var srSerNr = srarr[3];
	var srTag = srarr[4];
	var srVersion = srarr[5];
	
	if (n==0){
		config.parse(srConf,new Factory(),0);
	}
	version[n].parse(srVersion);
	serNr[n].parse(srSerNr);
	tags[n].parseRawText(srTag);
}

function createForm() {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	var header = document.createElement("th");
	row.appendChild(header);
	var header = document.createElement("th");
	header.innerHTML = "TAG";
	row.appendChild(header);
	var header = document.createElement("th");
	header.innerHTML = "SERIAL NUMBER";
	row.appendChild(header);
	var header = document.createElement("th");
	header.innerHTML = "VERSION";
	row.appendChild(header);

	for ( var n = 0; n <= nrOfRemotes; n++ ) {
		var row = document.createElement("tr");
		rootNode.appendChild(row);
		row.id = "remote";
		var header = document.createElement("th");
		row.appendChild(header);
		header.style.width = "100px";
		header.style.textAlign = "left";
		if (n==0)
			header.innerHTML ="MASTER";
		else
			header.innerHTML ="REMOTE " + n;
		if (n>0 && !remoteConfResponseValid[n-1]) header.style.display = "none";
		//tag
		var cell = document.createElement("td");
		row.appendChild(cell);
		var tag = document.createElement("input");
		tag.type = "text";
		cell.appendChild(tag);
		tag.id = "tagEntry_"+n;
		tag.name = tag.id;
		tag.className = "tag";
		tag.size = "30";
		tag.maxLength = "30";
		tag.onkeypress = function(ev) {
			ev = ev || window.event;
			if (ev.keyCode == 13)
				return false;
		}
		if (n>0 && !remoteConfResponseValid[n-1]) cell.style.display = "none";
		// remote serial nr
		cell = document.createElement("td");
		cell.style.marginRight = "15px";
		row.appendChild(cell);
		var serNr = document.createElement("input");
		serNr.id = "serialNrEntry_"+n;
		serNr.name = serNr.id;
		serNr.type = "text";
		serNr.className = "tag";
		serNr.size = "15";
		serNr.maxLength = "15";
		serNr.style.color = "#000000";
		serNr.style.fontSize = "11pt";
		serNr.style.backgroundColor = "#E0E0E0"
		cell.appendChild(serNr);
		if (n>0 && !remoteConfResponseValid[n-1]) cell.style.display = "none";
		// remote version
		cell = document.createElement("td");
		cell.style.marginRight = "15px";
		row.appendChild(cell);
		var version = document.createElement("input");
		version.id = "versionEntry_"+n;
		version.name = version.id;
		version.type = "text";
		version.className = "tag";
		version.size = "35";
		version.maxLength = "35";
		version.style.color = "#000000";
		version.style.fontSize = "11pt";
		version.style.backgroundColor = "#E0E0E0"
		cell.appendChild(version);
		if (n>0 && !remoteConfResponseValid[n-1]) cell.style.display = "none";
	}
}
function showInfo() {
	try {
		for (var n=0;n<=nrOfRemotes;n++){
			var el = document.getElementById("tagEntry_"+n);
			el.value = tags[n].tag.trim();
			var el = document.getElementById("serialNrEntry_"+n);
			el.value = serNr[n].sernr.trim();
			var el = document.getElementById("versionEntry_"+n);
			el.value = "FPGA:"+version[n].fwStr+" uC:"+version[n].swStr+" ETH:"+version[n].ethStr;
		}

	} catch(err) { }
}

function submitform() {
	if (!checkChange())
		return;
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	var str = document.getElementById("tagEntry_0").value;
	var tagstr = tags[0].format(str);

	for (var i = 0; i < nrOfRemotes; i++) {
		var remoteHeader = hexformat(i+1, 2);
		var remoteFrame = "";
		if ( !remoteConfResponseValid[i] )
		{
			// indicar trama de remoto inválida si no hay módulo de fibra 
			// o si la configuración recibida no es válida
			remoteHeader += hexformat(0, 2);	// revisar uso de "valid" en submit
		} else {
			// ATENCIÓN pendiente lectura de gui de remoto
			var str = document.getElementById("tagEntry_"+(i+1)).value;
			remoteFrame = tags[i+1].format(str);
			// trama válida
			remoteHeader += hexformat(1, 2);
		}
		tagstr += strToHex(frameSeparator)+strToHex(remoteHeader)+remoteFrame;
	}

	document.getElementById("ctl_tags_str").value = tagstr;
	doSubmit(tagstr);
}

function strToHex(str) {
	var hexStr = '';
	for (var j = 0; j < str.length; ++j) {
		var num = str.charCodeAt(j);
		var hexnum;
		if (!isNaN(num)) {
			hexnum = '00' + num.toString(16);
		} else {
			hexnum =  '20';
		}
		hexStr += hexnum.slice(-2);
	}
	return hexStr;
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
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("ctl_tags_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
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
				showResultIcon(error);
				setTimeout(function() { xhrOnEnd(); }, 1500);
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
function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 4000;
	} else {
		return 100;
	}
}