var timerId;
var maxMngrs = 2;
var frmComm;
var countCheck;
var community_sz = 8;
var IPLEN = 4;
var IPNR = 5;
var isReload = false;
var IPFRMLEN = 157;

function onloadInit() {
	showResultIcon(ERR_NONE);
	set_callbacks();
	reloadData();
}

function reloadData() {
	showResultIcon(ERR_PENDING);
	isReload = true;
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
				frmComm = this.responseText;
				if (frmComm.length < 8) {//blocked
					window.parent.navi.document.getElementById("start").click();
					return;
				}
				commShow(frmComm);
				ipAddrShow(frmComm);
				initFormChangeCheck();
				setTimeout(function() { onUnload(); }, 1500);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { onUnload(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { onUnload(); }, 100);
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
		var start_el = 1;
		// var nr_el = 2+maxMngrs+maxMngrs+1+maxMngrs+maxMngrs+maxMngrs+4+3;
		if (comms.length > start_el+2+maxMngrs) {
			for (var i = start_el; i < start_el+2+maxMngrs; i++) {
				comms[i] = comms[i].trim();
			}
			for (var i = start_el+2+maxMngrs; i < comms.length; ++i) {
				var n = parseInt(comms[i], 16);
				if (!isNaN(n)) {
					comms[i] = n;
				}
			}
		}
		var elarr = getPageElements();
		for (var i = 0; i < comms.length && i < elarr.length; ++i) {
			var n = start_el + i;
			if (elarr[i].type == "text") {
				elarr[i].value = comms[n];
			} else if (elarr[i].type == "checkbox") {
				elarr[i].checked = comms[n] != 0;
			}
		}
	} catch(err) {}
}

function commRead() {
	var frm = "";
	try {
		var elarr = getPageElements();
		var current = frmComm.split('\t');

		// IP address
		frm += ipAddrRead();
		frm += '\t';

		// snmp config
		var start_el = 1;
		for (var i = 0; i < 2+maxMngrs; ++i) {
			var n = start_el + i;
			if (typeof(elarr[i].value.length) === "undefined"
				|| elarr[i].value.length == 0)
			{
				frm += current[n];
			} else {
				var tmp = elarr[i].value.trim();
				//tmp += ' '.repeat(community_sz);
				tmp += "        ";
				frm += tmp.slice(0, community_sz);
			}
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
				if (num > 0xFFFF) {
					num = 0xFFFF;
				}
				frm += hexformat(num, sz);
			}
			frm += '\t';
		}
		frm += frmComm.substr(frm.length);
		return frm;
	} catch(err) { return frm;}
}

function ipAddrShow(frm) {
	try {
		var comms = frm.split('\t');
		var ipAddrFrm = comms[0];
		if (ipAddrFrm.length != 2*IPLEN*IPNR) {
			// alert("Error: Configuration unknown!");
		} else {
			var i = 0;
			for (var j = 0; j < IPNR; j++){
				for (var k = 0; k < IPLEN; k++) {
					try {
						var num = parseInt(ipAddrFrm.substr(i, 2), 16);
						if (isNaN(num))
							num = '';
					} catch (err) { num = ''; }
					i += 2;
					var el = document.getElementById("ip_"+j+k);
					el.value = ''+num;
					if (isReload) {
						el.style.backgroundColor = "#FFFFFF";
					}
				}
			}
		}
		if (isReload) {
			isReload = false;
		}
	} catch(err){}
}

function ipAddrRead() {
	var frm = "";
	try {
		var current = frmComm.split('\t');
		var currentIpStr = current[0];
		var newipaddr = "";
		var ipstr = "";
		var binip, binnm, bingw;
		var error = false;
		for (var j = 0; j < IPNR; j++) {
			var ipbin = "";
			for (var k = 0; k < IPLEN; k++) {
				var obj = document.getElementById("ip_"+j+k);
				if (obj.value === "undefined") {
					obj.style.backgroundColor = "#FF5555";
					error = true;
					break;
				}
				var num = parseInt(obj.value);
				if (isNaN(num) || num > 255 || num < 0) {
					obj.style.backgroundColor = "#FF5555";
					error = true;
					break;
				}
				obj.style.backgroundColor = "#FFFFFF";
				var tmp = num.toString(16);
				tmp = ("00" + num.toString(16)).slice(-2);
				ipstr += tmp;
				tmp = ("00000000" + num.toString(2)).slice(-8);
				ipbin += tmp;
				if (j == 0) {
					newipaddr += obj.value;
					if (k < IPLEN - 1) {
						newipaddr += '.';
					}
				}
			}
			if (error) {
				break;
			}
			if (j == 0)
				binip = ipbin;
			else if (j == 1)
				binnm = ipbin;
			else if (j == 2)
				bingw = ipbin;
		}
		if (error) {
			frm = currentIpStr;
		} else if (checkip(binip, binnm, bingw) < 0) {
			frm = currentIpStr;
		} else {
			frm = ipstr;
		}
	} catch(err) {
		frm = currentIpStr;
	}
	return frm;
}

function checkip(binip, binnm, bingw) {
	var idx = binnm.indexOf('0');
	if (idx == -1)
		return -1;
	if (binnm.indexOf('1', idx) != -1)
		return -1;
	if (binip.substr(0, idx-1) != bingw.substr(0, idx-1))
		return -1;
	return 0;
}

function submitform() {
	try {
		if (!checkChange()) {
			return;
		}
		guiBlocked(true);
		showResultIcon(ERR_PENDING);
		var frm = commRead();
		if (frm == frmComm || frm.length != IPFRMLEN) {
			xhrOnEnd();
			return;
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				setTimeout(function () { checkresult(); }, 1500);
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
		np_settings_str = frm;
		document.getElementById("np_settings_str").value = frm;
		xhr.send("np_settings_str="+frm);
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
						setTimeout(function() { checkresult(); }, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}
				showResultIcon(error);
				clearReset();
				commReq();
			}
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
	guiBlocked(false);
	showResultIcon(ERR_NONE);
}

function clearReset() {
	try {
		var el = document.getElementById("ethReset");
		el.checked = false;
	} catch(err) {}
	try {
		var el = document.getElementById("trapsDelete");
		el.checked = false;
	} catch(err) {}
}
