<!--
var remotesNr, MaxRemotesNr, remotesMask;
function optOnLoadFunc() {
	var q = param();
	if (q['remotesNr'])
		remotesNr = entify(q['remotesNr']);
	if (q['MaxRemotesNr'])
		MaxRemotesNr = entify(q['MaxRemotesNr']);
	if (q['remotesMask'])
		remotesMask = entify(q['remotesMask']);
	var header = document.getElementById("header");
	renderMeters();
	optLoadStatus();
}
function renderMeters() {
	for (var i = 0; i < 2; ++i) {
		var td = document.getElementById("rxPowMet_"+i);
		var s = optRxPow_settings;
		var el = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		el.attachTo(td);
		el.valueSet(s.min);
	}
}
var tmrIdOptStat;
function optLoadStatus() {
	try {
		if (typeof(tmrIdOptStat) !== "undefined" && tmrIdOptStat)
			clearTimeout(tmrIdOptStat);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					optParseStatus(serverResponse);
				}
				tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdOptStat) !== "undefined" && tmrIdOptStat)
				clearTimeout(tmrIdOptStat);
			tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdOptStat) !== "undefined" && tmrIdOptStat)
				clearTimeout(tmrIdOptStat);
			tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function optParseStatus(serverResponse, link_nr) {
	var bitmask, num, warning, alarm, temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm;
	bitmask = parseInt(serverResponse.substr(32,2),16);
	document.getElementById("optFrSync").src = (bitmask & 0x08)? "/bullet_red.png" : "/bullet_green.png";
	num  =  parseInt(serverResponse.substr(34,4),16);
	document.getElementById("errors_"+1).innerHTML = num;
	warning = false;
	alarm = false;
	temp = to_float(parseInt(serverResponse.substr(10,4),16));
	document.getElementById("temperat_"+1).innerHTML = temp.toFixed(1);
	volt = parseInt(serverResponse.substr(14,4),16) * 1e-4;
	document.getElementById("voltage_"+1).innerHTML = volt.toFixed(1);
	bias = parseInt(serverResponse.substr(18,4),16) / 500;
	document.getElementById("bias_"+1).innerHTML = bias.toFixed(1);
	txpow = 10 * Math.log(parseInt(serverResponse.substr(22,4),16) + 1e-9) / Math.LN10 - 36;
	document.getElementById("txpower_"+1).innerHTML = txpow.toFixed(1);
	rxpow = 10 * Math.log(parseInt(serverResponse.substr(26,4),16) + 1e-9) / Math.LN10 - 40;
	document.getElementById("rxPowTxt_"+1).innerHTML = rxpow.toFixed(1);
	document.getElementById("rxPowMet_"+1).mMeter.valueSet(rxpow);
	sfpalarm = parseInt(serverResponse.substr(30,2),16);
	gtpalarm = parseInt(serverResponse.substr(32,2),16);
	if (sfpalarm & 0x01) {
		document.getElementById("optTxErr_"+1).src = "/bullet_red.png";
	} else {
		document.getElementById("optTxErr_"+1).src = "/bullet_green.png";
	}
	if (sfpalarm & 0x02) {
		document.getElementById("optRxErr_"+1).src = "/bullet_red.png";
	} else {
		document.getElementById("optRxErr_"+1).src = "/bullet_green.png";
	}
	if (sfpalarm & 0x04) {
		document.getElementById("optModKO_"+1).src = "/bullet_red.png";
	} else {
		document.getElementById("optModKO_"+1).src = "/bullet_green.png";
	}
	if (gtpalarm & 0x01) {
		document.getElementById("txrxStat_"+1).src = "/bullet_red.png";
	} else {
		document.getElementById("txrxStat_"+1).src = "/bullet_green.png";
	}
	if (gtpalarm & 0x02) {
		document.getElementById("dataLock_"+1).src = "/bullet_red.png";
	} else {
		document.getElementById("dataLock_"+1).src = "/bullet_green.png";
	}
	if (gtpalarm & 0x04) {
		document.getElementById("dataSync_"+1).src = "/bullet_red.png";
	} else {
		document.getElementById("dataSync_"+1).src = "/bullet_green.png";
	}
}
// -->