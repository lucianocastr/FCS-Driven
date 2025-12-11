<!--
var linkNr, remotesNr, MaxRemotesNr, remotesMask,ne;
function optOnLoadFunc() {
	var q = param();
	if (q['linkNr'])
		linkNr = entify(q['linkNr']);
	if (q['remotesNr'])
		remotesNr = entify(q['remotesNr']);
	if (q['MaxRemotesNr'])
		MaxRemotesNr = entify(q['MaxRemotesNr']);
	if (q['remotesMask'])
		remotesMask = entify(q['remotesMask']);
	if (q['ne'])
		ne = entify(q['ne']);
	var header = document.getElementById("header");
	var idx = getRemoteIndex(linkNr, remotesNr, MaxRemotesNr, remotesMask);
	if (ne==0)
	{
		header.innerHTML = "REMOTE&nbsp;LINK "+idx;
		document.getElementById("colM1").innerHTML = (idx<=6) ? "Master":"Expan."+Math.floor((idx-1)/6);
		document.getElementById("colM2").innerHTML = (idx<=6) ? "Master":"Expan."+Math.floor((idx-1)/6);		
	}
	else
	{
		header.innerHTML = "EXPANSION&nbsp;LINK "+ne;
		document.getElementById("colR1").innerHTML = "Expan."+ne;
		document.getElementById("colR2").innerHTML = "Expan."+ne;
		document.getElementById("colM1").innerHTML = (ne==1) ? "Master" : "Expan."+(ne-1);
		document.getElementById("colM2").innerHTML = (ne==1) ? "Master" : "Expan."+(ne-1);
	}
	
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
	/*try {
		if (typeof(tmrIdOptStat) !== "undefined" && tmrIdOptStat)
			clearTimeout(tmrIdOptStat);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					var nr = getRemotesNrFromStatus(serverResponse);
					if (nr >= 1 && nr <= window.top.MaxRemotesNr) {
						optParseStatus(serverResponse, linkNr);
					}
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
	} catch (err) {}*/
	var serverResponse = localStorage.getItem("stat_1dm3");
	optParseStatus(serverResponse, linkNr);
	tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 2000);
}
function optParseStatus(serverResponse, link_nr) {
	var shift, dir, num, rxloss;
	var idx,device;
	var remotesNr = window.top.remotesNr;
	var statstrs = serverResponse.split("\t");
	if (typeof (window.top.remotesBitmask) == "undefined")
		window.top.remotesBitmask = parseRemotesBitmaskFromStatus(serverResponse);
	if (typeof (window.top.expansorNr) == "undefined")
		window.top.expansorNr = getExpansorsNrFromStatus(serverResponse);
	var expansorNr = window.top.expansorNr;	
	idx = getRemoteIndex(link_nr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
	rx_loss = false;
	for (var side = 0; side < 2; side++) {	//0 local, 1 remote
		if (ne==0)
		{
			if (side==0)
			{
				if (idx<=6)
				{
					device=0;
					shift = 70*2 + (idx-1)*28;
				}
				else
				{
					device=Math.floor((idx-1)/6);
					shift = 4*2 + (((idx-1) % 6)-1)*28 + 28;
				}		
			}
			else
			{
				device=expansorNr+parseInt(link_nr);
				shift = 14;
			}
		}
		else
		{
			if (side==0)
			{
				device = ne-1;
				shift = (ne==1) ? 336 : 204;			
			}
			else
			{
				device = ne;
				shift = 176;		
			}
		}
		if (typeof (statstrs[device]) == "undefined")
			return; 
		num = to_float(parseInt(statstrs[device].substr(shift,4),16));
		shift += 4;
		document.getElementById("temperat_"+side).innerHTML = num.toFixed(1);
		num = parseInt(statstrs[device].substr(shift,4),16) * 1e-4;
		shift += 4;
		document.getElementById("voltage_"+side).innerHTML = num.toFixed(1);
		num = parseInt(statstrs[device].substr(shift,4),16) / 500;
		shift += 4;
		document.getElementById("bias_"+side).innerHTML = num.toFixed(1);
		num = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 36;
		shift += 4;
		document.getElementById("txpower_"+side).innerHTML = num.toFixed(1);
		num = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		shift += 4;
		document.getElementById("rxPowTxt_"+side).innerHTML = num.toFixed(1);
		var td = document.getElementById("rxPowMet_"+side);
		td.mMeter.valueSet(num);
		if (side == 0 && num <= -29.5)
			rxloss = true;
		num = parseInt(statstrs[device].substr(shift,2),16);
		shift += 2;
		if (num & 0x01) {
			document.getElementById("optTxErr_"+side).src = "/bullet_red.png";
		} else {
			document.getElementById("optTxErr_"+side).src = "/bullet_green.png";
		}
		if (num & 0x02) {
			document.getElementById("optRxErr_"+side).src = "/bullet_red.png";
		} else {
			document.getElementById("optRxErr_"+side).src = "/bullet_green.png";
		}
		if (num & 0x04) {
			document.getElementById("optModKO_"+side).src = "/bullet_red.png";
		} else {
			document.getElementById("optModKO_"+side).src = "/bullet_green.png";
		}
		if (side == 0 && (num & 0x06))
			rxloss = true;
		num = parseInt(statstrs[device].substr(shift,2),16);
		shift += 2;
		if (num & 0x01) {
			document.getElementById("txrxStat_"+side).src = "/bullet_red.png";
		} else {
			document.getElementById("txrxStat_"+side).src = "/bullet_green.png";
		}
		if (num & 0x02) {
			document.getElementById("dataLock_"+side).src = "/bullet_red.png";
		} else {
			document.getElementById("dataLock_"+side).src = "/bullet_green.png";
		}
		if (num & 0x04) {
			document.getElementById("dataSync_"+side).src = "/bullet_red.png";
		} else {
			document.getElementById("dataSync_"+side).src = "/bullet_green.png";
		}
		if (side==0)
			document.getElementById("optFrSync").src = ((num & 0x08) != 0) ? "/bullet_red.png" : "/bullet_green.png";
		
		if (side == 0 && (num & 0x07))
			rxloss = true;
		num = parseInt(statstrs[device].substr(shift,4),16);
		document.getElementById("errors_"+side).innerHTML = num;
	}
	if (rxloss) {
		document.getElementById("optFrSync").src = "/bullet_grey.png";
		document.getElementById("temperat_1").innerHTML = "---";
		document.getElementById("voltage_1").innerHTML = "---";
		document.getElementById("bias_1").innerHTML = "---";
		document.getElementById("txpower_1").innerHTML = "---";
		document.getElementById("rxPowTxt_1").innerHTML = "---";
		document.getElementById("rxPowMet_1").value = -40;
		document.getElementById("optTxErr_1").src = "/bullet_grey.png";
		document.getElementById("optRxErr_1").src = "/bullet_grey.png";
		document.getElementById("optModKO_1").src = "/bullet_grey.png";
		document.getElementById("txrxStat_1").src = "/bullet_grey.png";
		document.getElementById("dataLock_1").src = "/bullet_grey.png";
		document.getElementById("dataSync_1").src = "/bullet_grey.png";
		document.getElementById("errors_1").innerHTML = "---";
		var td = document.getElementById("rxPowMet_1");
		td.mMeter.valueSet();
	}
}
// -->