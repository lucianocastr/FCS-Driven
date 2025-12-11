var timerId;
var maxMngrs = 2;
var frmComm;
var countCheck;

function onloadInit() {
	showResultIcon(ERR_NONE);
	set_callbacks();
	reloadData();
}

function reloadData() {
	showResultIcon(ERR_PENDING);
	commReq();
}

function set_callbacks() {
	try {
		document.getElementById("trapsEnable").onclick = function(ev) {
			document.getElementById("trapsDisable").checked = !this.checked;
		}
		document.getElementById("trapsDisable").onclick = function(ev) {
			document.getElementById("trapsEnable").checked = !this.checked;
		}
	} catch (err) {}
}

function commReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				commShow(this.responseText);
				initFormChangeCheck();
				setTimeout(function() { onUnload(); }, 1500);
				frmComm = this.responseText;
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { commReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { commReq(); }, 100);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/updt_comm.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function getPageElements() {
	var elarr = [];
	var el = document.getElementById("commro");
	elarr.push(el);
	el = document.getElementById("commrw");
	elarr.push(el);
	el = document.getElementById("commtr1");
	elarr.push(el);
	el = document.getElementById("commtr2");
	elarr.push(el);
	el = document.getElementById("portr1");
	elarr.push(el);
	el = document.getElementById("portr2");
	elarr.push(el);
	el = document.getElementById("watchdogPeriod");
	elarr.push(el);
	el = document.getElementById("keepAlivePeriod1");
	elarr.push(el);
	el = document.getElementById("keepAlivePeriod2");
	elarr.push(el);
	el = document.getElementById("trapRep1");
	elarr.push(el);
	el = document.getElementById("trapRep2");
	elarr.push(el);
	el = document.getElementById("mgrEn1");
	elarr.push(el);
	el = document.getElementById("mgrEn2");
	elarr.push(el);
	el = document.getElementById("ethReset");
	elarr.push(el);
	el = document.getElementById("trapsDelete");
	elarr.push(el);
	/*
	el = document.getElementById("trapsEnable");
	elarr.push(el);
	el = document.getElementById("trapsDisable");
	elarr.push(el);
	*/
	return elarr;
}

function commShow(frm) {
	try {
		var comms = frm.split('\t');
		if (comms.length > 2+maxMngrs) {
			for (var i = 2+maxMngrs; i < comms.length; ++i) {
				var n = parseInt(comms[i], 16);
				if (!isNaN(n)) {
					comms[i] = n;
				}
			}
		}
		var elarr = getPageElements();
		for (var i = 0; i < comms.length && i < elarr.length; ++i) {
			if (elarr[i].type == "text") {
				elarr[i].value = comms[i];
			} else if (elarr[i].type == "checkbox") {
				elarr[i].checked = comms[i] != 0;
			}
		}
	} catch(err) {}
}

function commRead() {
	var frm = "";
	try {
		var elarr = getPageElements();
		for (var i = 0; i < 2+maxMngrs; ++i) {
			frm += elarr[i].value;
			frm += '\t';
		}
		for (var i = 2+maxMngrs; i < elarr.length; ++i) {
			if (elarr[i].type == "checkbox") {
				frm += elarr[i].checked ? "01\t" : "00\t";
				continue;
			}
			var num = parseInt(elarr[i].value);
			var sz = 4;
			if (isNaN(num)) {
				frm += frmComm.substr(frm.length, sz);
			} else {
				frm += hexformat(num, sz);
			}
			frm += '\t';
		}
		return frm;
	} catch(err) {return frm;}
}

function submitform() {
	try {
		if (!checkChange()) {
			return;
		}
		guiBlocked(true);
		showResultIcon(ERR_PENDING);
		var frm = commRead();
		document.getElementById("np_commfrm").value = frm;
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				setTimeout(function () { checkresult(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { onUnload(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { onUnload(); }, 1500);
		}
		xhr.open("POST", "/comm.zhtml", true);
		xhr.timeout = 5000;
		np_commfrm = frm;
		xhr.send("np_commfrm="+frm);
		xhr = null;
	} catch(err) {}
}

function onUnload() {
	guiBlocked(false);
	showResultIcon(ERR_NONE);
};

function checkresult() {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++countCheck < 25) {
						setTimeout(function() { check_result(); }, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}
			}
			showResultIcon(error);
			setTimeout(function() { xhrOnEnd(); }, 1500);
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

function xhrOnEnd() {
	showResultIcon(ERR_NONE);
	commReq();
}
