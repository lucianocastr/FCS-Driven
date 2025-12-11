var tags;
var serNr;
var version;
var timerId;
var countCheck;
var maxDevicesToShow = 4;
function onloadInit() {
	tags = new Tags();
	version = new VersionRemotes();
	serNr = new SerialNrRemotes();
	createForm();
	guiBlocked(false);
	reloadData();
}
function reloadData(){
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	// tagsReq();
	globalConfigReq();
}

function globalConfigReq() {
	if (isPCstyle()){
		loadConfigGlobal();
		return;
	}
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
		tagsReq();
		return;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 10) {
		versionReq();
		return;
	}
	//localStorage.setItem("GlobalConfig"+Prjstr+window.location.host, str);
	var srConf = srarr[0] + "\t" + srarr[1];
	var srFact = srarr[2];
	var srEq = srarr[3];
	var srSerNr = srarr[4];
	var srTag = srarr[5];
	var srVersion = srarr[6];
	var srNFPA = srarr[7] + "\t" + srarr[8];

	serNr.parseRawText(srSerNr);
	serNr.render();

	window.parent.navi.versionFrame = srVersion;
	version.parse(srVersion);
	version.render();

	window.parent.navi.tagsFrame = srTag;
	tags.parseRawText(srTag);
	tags.render();
	ctl_tags_str = srTag;
	initFormChangeCheck();
	guiBlocked(false);
	disableSernrAndVersion();
}

function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 300;
	} else {
		return 100;
	}
}

function tagsReq() {
	if (isPCstyle()){
		load_tags();
		return;
	}
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4) {
				if (this.status === 200) {
					setTimeout(function() { load_tags(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { tagsReq(); }, 2000);
				}
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
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("tags_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				window.parent.navi.tagsFrame = this.responseText;
				tags.parse(this.responseText);
				tags.render();
				ctl_tags_str = this.responseText;
				initFormChangeCheck();
				guiBlocked(false);
				disableSernrAndVersion();
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function createForm() {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	// titles row
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	var header = document.createElement("th");
	row.appendChild(header);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "LOCATION&nbsp;TAG";
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "SERIAL&nbsp;NR.";
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "VERSION";

	for ( var n = 0; n < tags.MAXDEVICES; n++ ) {
		var row = document.createElement("tr");
		if (n > maxDevicesToShow) row.style.display = "none";
		rootNode.appendChild(row);
		row.id = "remote"+"_"+n;
		var header = document.createElement("th");
		row.appendChild(header);
		header.style.width = "100px";
		header.style.textAlign = "left";
		header.style.marginRight = "15px";
		header.innerHTML = (n==0? "MASTER": "REMOTE&nbsp;"+n);
		var cell = document.createElement("td");
		cell.style.marginRight = "15px";
		row.appendChild(cell);
		var tag = document.createElement("input");
		tag.type = "text";
		cell.appendChild(tag);
		tag.id = "tagEntry"+"_"+n;
		tag.name = tag.id;
		tag.className = "tag";
		tag.style.fontSize = "11pt";
		tag.size = "33";
		tag.maxLength = "30";
		tag.onkeypress = function(ev) {
			ev = ev || window.event;
			if (ev.keyCode == 13) {
				return false;
			}
		}
		if ( n == 0 ) {
			continue;
		}
		// remote serial nr
		cell = document.createElement("td");
		cell.style.marginRight = "15px";
		row.appendChild(cell);
		var serNr = document.createElement("input");
		serNr.id = "serialNrEntry"+"_"+n;
		serNr.name = serNr.id;
		serNr.type = "text";
		serNr.className = "tag";
		serNr.size = "18";
		serNr.maxLength = "15";
		serNr.style.color = "#000000";
		serNr.style.fontSize = "11pt";
		serNr.style.backgroundColor = "#E0E0E0"
		cell.appendChild(serNr);

		// remote version
		cell = document.createElement("td");
		cell.style.marginRight = "15px";
		row.appendChild(cell);
		var version = document.createElement("input");
		version.id = "versionEntry"+"_"+n;
		version.name = version.id;
		version.type = "text";
		version.className = "tag";
		version.size = "18";
		version.maxLength = "16";
		version.style.color = "#000000";
		version.style.fontSize = "11pt";
		version.style.backgroundColor = "#E0E0E0"
		cell.appendChild(version);
	}
}

function setTag(name, n) {
	try {
		var id = "tagEntry"+"_"+n;
		var tag = document.getElementById(id);
		tag.value = name.trim();
	} catch(err) { }
}

function setSerialNr(name, n) {
	try {
		var id = "serialNrEntry"+"_"+n;
		var el = document.getElementById(id);
		el.value = name.trim();
	} catch(err) { }
}

function setVersion(name, n) {
	try {
		var id = "versionEntry"+"_"+n;
		var el = document.getElementById(id);
		el.value = name.trim();
	} catch(err) { }
}

function disableSernrAndVersion() {
	for ( var n = 1; n < tags.MAXDEVICES; n++ ) {
		try {
			var id = "versionEntry"+"_"+n;
			document.getElementById(id).disabled = true;
			id = "serialNrEntry"+"_"+n;
			document.getElementById(id).disabled = true;
		} catch(err) { alert("NO EXISTE"+n); }
	}
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
	var str = "";
	for ( var n = 0; n < tags.MAXDEVICES; n++ ) {
		var id = "tagEntry"+"_"+n;
		var name = document.getElementById(id).value;
		for ( var i = 0; i < tags.TAGLENDEVICE; i++ ) {
			name += " ";
		}
		str += name.slice(0, tags.TAGLENDEVICE);;
	}
	var tagstr = tags.format(str);
	document.getElementById("ctl_tags_str").value = tagstr;
	doSubmit(tagstr);
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
	tagsReq();
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
