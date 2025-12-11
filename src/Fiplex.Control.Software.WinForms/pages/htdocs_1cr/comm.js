<!--
var timerId;
var maxMngrs = 2;
var frmComm;

function onloadInit() {
	showResultIcon(ERR_NONE);
	reloadData();
}

function reloadData() {
	showResultIcon(ERR_PENDING);
	commReq();
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

function commShow(frm) {
	try {
		var comms = frm.split('\t');
		var elarr = [];
		var el = document.getElementById("commro");
		elarr.push(el);
		var el = document.getElementById("commrw");
		elarr.push(el);
		var el = document.getElementById("commtr1");
		elarr.push(el);
		var el = document.getElementById("commtr2");
		elarr.push(el);
		var el = document.getElementById("portr1");
		elarr.push(el);
		var el = document.getElementById("portr2");
		elarr.push(el);
		if (comms.length >= 2+2*maxMngrs) {
			for (var i = 2+maxMngrs; i < 2+2*maxMngrs; ++i) {
				var n = parseInt(comms[i], 16);
				if (!isNaN(n)) {
					comms[i] = n;
				}
			}
		}
		for (var i = 0; i < comms.length && i < elarr.length; ++i) {
			elarr[i].value = comms[i];
		}
	} catch(err) {}
}

function commRead() {
	var frm = "";
	try {
		var elarr = [];
		var el = document.getElementById("commro");
		elarr.push(el);
		var el = document.getElementById("commrw");
		elarr.push(el);
		var el = document.getElementById("commtr1");
		elarr.push(el);
		var el = document.getElementById("commtr2");
		elarr.push(el);
		var el = document.getElementById("portr1");
		elarr.push(el);
		var el = document.getElementById("portr2");
		elarr.push(el);
		for (var i = 0; i < 2+maxMngrs; ++i) {
			frm += elarr[i].value;
			frm += '\t';
		}
		for (var i = 2+maxMngrs; i < 2+2*maxMngrs; ++i) {
			var num = parseInt(elarr[i].value);
			if (isNaN(num)) {
				frm += frmComm.substr(frm.length, 8);
			} else {
				frm += hexformat(num, 8);
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
				showResultIcon(ERR_OK);
				setTimeout(function() { commReq(); }, 2000 );
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
		xhr.send("np_commfrm="+frm);
		xhr = null;
	} catch(err) {}
}

function onUnload() {
	guiBlocked(false);
	showResultIcon(ERR_NONE);
}

function guiBlocked(doBlock) {
	if (doBlock) {
		window.top.submitLocked = true;
		if (typeof(cliksDisable) !== "undefined")
			clicksDisable(true);
		inputDisable(true);
		cursorWait();
	} else {
		window.top.submitLocked = false;
		if (typeof(cliksDisable) !== "undefined")
			clicksDisable(false);
		inputDisable(false);
		cursorClear();
		showResultIcon(ERR_NONE);
	}
}
// -->