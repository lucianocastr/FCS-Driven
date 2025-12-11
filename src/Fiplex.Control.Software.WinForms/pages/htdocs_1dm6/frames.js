<!--
var LIMIT_GAIN = [50, 80];
var sqThrDLLims = [ {min: -50, max: 0}, {min: -90, max: -40}];
var sqThrULLims = {min: -110, max: -40};
var attInLims = {min: 0, max: 30};
var attOutLims = [{min: 0, max: 50} , {min: 0, max: 30}];
var fineGainLims = {min: -40, max: 0};
var delayLims = {min: 0, max: 200};
var swTimeLims = {min: 2, max: 60};
var masterMode;
var masterFpgaAlarm = false;
var reloadAgain = false;
var filtEnabled;
var remPwrRedLims = {min: 0, max: 30};
var simplexAllowedArr, simplexSetArr;
var masterFiltEnabled, masterSqEnabled;

function parseRemotesBitmaskFromConf(serverResponse) {
	mask = parseInt(serverResponse.substr(6,6),16);
	return mask;
}
function parseRemotesBitmaskFromStatus(serverResponse) {
	var statstrs = serverResponse.split("\t");
	mask = parseInt(statstrs[statstrs.length-1].substr(2,6),16);
	return mask;
}
function getRemoteIndex(nr, remotesNr, maxRemotesNr, remotesMask) {
	var index = 0;
	var mask = 1;
	var i;
	for (i = 0; i < nr && i < maxRemotesNr; ++i) {
		while ((mask & remotesMask) == 0) {
			mask <<= 1;
			if (++index >= maxRemotesNr)
				break;
		}
		if (index >= maxRemotesNr)
			break;
		mask <<= 1;
		index++;
	}
	if (index > maxRemotesNr || i != nr)
		index = nr;
	return index
}

function getRemotesNrFromStatus(serverResponse) {
	var statstrs = serverResponse.split("\t");
	var nr;
	var mask;
	var i;
	
	// if (isFpgaAlarm(serverResponse))
	// 	return -1;
	mask = parseInt(statstrs[statstrs.length-1].substr(2,6),16);
	nr=0;
	for (i=0;i<window.top.MaxRemotesNr;i++)
	{
		if ((mask & 0x01)!=0) nr++;
		mask = mask>>1;
	}
	return nr;
}
function getExpansorsNrFromConf(serverResponse){
	var nr = parseInt(serverResponse.substr(4,2),16);
	if (nr > window.top.MaxExpansorNr)
		return -1;	
	return nr;
}
function getExpansorsNrFromStatus(serverResponse){
	// if (isFpgaAlarm(serverResponse))
	// 	return -1;
	var statstrs = serverResponse.split("\t");
	return parseInt(statstrs[statstrs.length-1].substr(0,2),16);
}
function getRemotesNrFromConf(serverResponse,maxRemotesNr) {
	var nr;
	var mask;
	var i;
	mask = parseInt(serverResponse.substr(6,6),16);
	nr=0;
	for (i=0;i<maxRemotesNr;i++)
	{
		if ((mask & 0x01)!=0) nr++;
		mask = mask>>1;
	}
	return nr;
}

function isFpgaAlarm(serverResponse) {
	var statstrs = serverResponse.split("\t");
	var bitmask = parseInt(statstrs[0].substr(6,2),16);
	return (bitmask & 0x02) != 0;
}

function computeRemNrInConf(statRem) {
	var r = -1;
	try {
		var m = parseInt(statRem.substr(0,2), 16);
		if (isNaN(m)) {
			return r;
		}
		cfgarr = window.parent.navi.configArray;
		for (var i = 1; i < cfgarr.length; ++i) {
			var n = parseInt(cfgarr[i].substr(0, 2), 16);
			if (isNaN(n)) {
				continue;
			}
			if (m == n) {
				r = i;
				break;
			}
		}
	} catch(err) {}
	return r;
}

function computeRemNrInStat(nconf) {
	var r = -1;
	var m;
	try {
		var cnf = window.parent.navi.configArray[nconf];
		m = parseInt(cnf.substr(0, 2), 16);
	} catch(err) {}
	if (isNaN(m)) {
		return r;
	}
	var sr = localStorage.getItem("stat_1dm6"+window.location.host);
	try {
		var ne = getExpansorsNrFromStatus(sr);
		var statstrs = sr.split("\t");
		for (var i = 1+ne; i < statstrs.length; ++i) {
			var n = parseInt(statstrs[i].substr(0, 2), 16);
			if (isNaN(n)) {
				continue;
			}
			if (m == n) {
				r = i - ne;
				break;
			}
		}
	} catch(err) {}
	return r;
}

function computeRemNrWithIdx(nr) {
	var r = -1;
	cfgarr = window.parent.navi.configArray;
	try {
		for (var i = 1; i < cfgarr.length; ++i) {
			var n = parseInt(cfgarr[i].substr(0, 2), 16);
			if (isNaN(n)) {
				continue;
			}
			if (nr == n) {
				r = i;
				break;
			}
		}
	} catch(err) {}
	return r;
}

function remoteHasHighestIndex(nr, remotesNr, remotesBitmask) {
	var idx = getRemoteIndex(nr, remotesNr, window.top.MaxRemotesNr, remotesBitmask);
	for (var r = nr+1; r <= remotesNr; ++r) {
		var x = getRemoteIndex(r, remotesNr, window.top.MaxRemotesNr, remotesBitmask);
		if (x > idx) {
			return false;
		}
	}
	return true;
}

function isStatusFrmOk(sr) {
	if (sr.length == 0) {
		return false;
	}
	var statstrs = sr.split("\t");
	var n = statstrs.length;
	if (n < 1) {
		return false;
	}
	for (var i = 0; i < n; ++i) {
		if (!ishex(statstrs[i])) {
			return false;
		}
	}
	if (statstrs[0].length != 392) {
		return false;
	}
	if (n > 1 && statstrs[n-1].length != 8) {
		return false;
	}
	return true;
}

function parse_status(serverResponse, autoUpdt) {
	var shift, num, volt, bias, txpow, rxpow, warning, alarm, temp;
	var signal_downlink, signal_in, signal_ovf,signal_ovf2, ch_disabled, fpgaAlarm, tempAlarm;
	var ch_nr = window.top.MaxChNr;
	var remotesNr = window.top.remotesNr;
	var expansorNr = window.top.expansorNr;
	var current_rxloss = window.top.master_rx_loss_alarm.slice(0);
	var changedRxLossMask = 0;
	var bitmask, color;
	var statstrs = serverResponse.split("\t");
	var idx;
	var device;
	var bsAlarmCapable, bsSignalIn, powerInput,powerInput2;
	window.top.NumFiberRemote = parseNumFiberRemote(serverResponse);
	bitmask = parseInt(statstrs[0].substr(6,2),16);
	fpgaAlarm = bitmask & 0x02;
	tempAlarm = bitmask & 0x04;
	statHpaLedSet(0, (bitmask & 0x40)?  "red" : "grey");
	txLowHpaLedSet(0, (bitmask & 0x80)?  "red" : "grey");
	boardTempLedSet(0, tempAlarm ?  "red" : "grey");
	fpgaLedSet(0, fpgaAlarm ?  "red" : "grey");
	setPLLstate(bitmask & 0x10, bitmask & 0x20);
	if (masterFpgaAlarm && !fpgaAlarm) {
		reloadAgain = true;
	}
	masterFpgaAlarm = fpgaAlarm;
	if (masterFpgaAlarm) {
		return;
	}
	if (typeof(window.top.remotesNr) == "undefined") {
		remotesNr = getRemotesNrFromStatus(serverResponse);
	} else if (!autoUpdt) {
		remotesNr = getRemotesNrFromStatus(serverResponse);
	} else {
		remotesNr = window.top.remotesNr;
	}
		
	if (typeof(window.top.expansorNr) == "undefined") {
		expansorNr = getExpansorsNrFromStatus(serverResponse);
	} else if (!autoUpdt) {
		expansorNr = getExpansorsNrFromStatus(serverResponse);
	} else {
		expansorNr = window.top.expansorNr;
	}
	if (typeof(window.top.remotesBitmask) == "undefined") {
		window.top.remotesBitmask = parseRemotesBitmaskFromStatus(serverResponse);
	}
		
	if (autoUpdt && (expansorNr+remotesNr)!=(statstrs.length-2))
	{
		return;	
	}		
	if (!autoUpdt && (expansorNr > window.top.expansorNr)) {
		window.top.expansorNr = expansorNr;
		redrawExpansionLinks(expansorNr);
	}
	if (typeof(window.top.remotesStatMask) == "undefined") {
		window.top.remotesStatMask = parseRemotesBitmaskFromStatus(serverResponse);
	} else {
		window.top.remotesStatMask |= parseRemotesBitmaskFromStatus(serverResponse);
	}
	if (!autoUpdt && ((remotesNr > window.top.remotesNr))) {
		var remotesMask = window.top.remotesStatMask;
		for (var i = 1; i <= remotesNr; ++i) {
			if (masterFiberPopupLinkExists(i, remotesMask)) {
				continue;
			}
			var isHiIdx = remoteHasHighestIndex(i, window.top.remotesNr, remotesMask);
			appendFiberNotif(i, remotesNr, remotesMask, isHiIdx);
		}
	}
	num = parseInt(statstrs[0].substr(4,2),16);
	num *= 256;
	var boardtemp = to_float(num);
	boardTempSet(0, boardtemp);
	num = to_float(parseInt(statstrs[0].substr(16,4),16));
	var rfOutPower = to_float(parseInt(statstrs[0].substr(12,4),16));
	if (rfOutPower == -128) {
		agcSet("---", 0);
	} else {
		agcSet(num, 0);
	}
	for (var n = 1; n <= remotesNr; n++) {
		var r = autoUpdt ? n : computeRemNrInConf(statstrs[n+expansorNr]);
		shift = 74;
		bitmask = parseInt(statstrs[n+expansorNr].substr(shift,2),16);
		shift += 2;
		signal_ovf = bitmask & 0x01;
		color = signal_ovf ? "red" : "grey";
		ovfLedSet(r, color);
		fpgaAlarm = bitmask & 0x02;
		tempAlarm = bitmask & 0x04;
		boardTempLedSet(r, tempAlarm ?  "red" : "grey");
		num = cSignedByte(parseInt(statstrs[n+expansorNr].substr(shift,2),16));
		shift += 2;
		if (signal_ovf)
			rfInPowSet(r, num, "#df4040");
		else
			rfInPowSet(r, num);
		num = cSignedByte(parseInt(statstrs[n+expansorNr].substr(shift,2),16));
		shift += 2;
		var rfOutPower = to_float(parseInt(statstrs[n+expansorNr].substr(10,4),16));
		if (rfOutPower == -128) {
			agcSet("---", r);
		} else {
			agcSet(num, r);
		}
	}
	signal_downlink = false;
	var chEnMask = 0;
	var sqEn = 0;
	if (typeof(window.top.fiplexConfStr) !== "undefined") {
		chEnMask = parseChannelsEnabled(window.top.fiplexConfStr, 0);
		sqEn = parseSQEnabled(window.top.fiplexConfStr, 0);
	}
	for (var ch = 1, shift = 20, mask = 1; ch <= ch_nr; ++ch) {
		bitmask = parseInt(statstrs[0].substr(shift,2),16);
		shift += 2;
		signal_in = bitmask & 0x80;
		num = cSignedByte(parseInt(statstrs[0].substr(shift,2),16));
		shift += 2;
		ch_disabled = !(chEnMask & mask);
		mask <<= 1;
		if (!ch_disabled && signal_in)
			signal_downlink = true;
		if (ch_disabled) {
			chSignalLedSet(ch, 0, "grey");
			chPowerSet(ch, 0, num, "#bbbbbb");
		} else if (signal_in) {
			chSignalLedSet(ch, 0, "green");
			chPowerSet(ch, 0, num);
		} else {
			chSignalLedSet(ch, 0, "yellow");
			chPowerSet(ch, 0, num, "#f1a165");
		}
		num = cSignedByte(parseInt(statstrs[0].substr(shift,2),16));
		shift += 2;
		if (filtEnabled && !filtEnabled[0] || ch_disabled) {
			chAgcSet(ch,0,"--", "#bbbbbb");
		} else {
			chAgcSet(ch,0,!signal_in&&sqEn?0:num);
		}
	}
	bitmask = parseInt(statstrs[0].substr(6,2),16);
	signal_ovf = bitmask & 0x01;
	var warning_ovf = bitmask & 0x08;
	color = signal_ovf ? "red" : (warning_ovf ? "yellow":"grey");
	ovfLedSet(0, color);
	fpgaAlarm = bitmask & 0x02;
	tempAlarm = bitmask & 0x04;
	boardTempLedSet(0, tempAlarm ?  "red" : "grey");
	fpgaLedSet(0, fpgaAlarm ?  "red" : "grey");
	powerInput = to_float(parseInt(statstrs[0].substr(8,4),16));
	num = to_float(parseInt(statstrs[0].substr(12,4),16));
	rfOutPowSet(0, num);
	for (var n = 1; n <= remotesNr; n++) {
		var r = autoUpdt ? n : computeRemNrInConf(statstrs[n+expansorNr]);
		var chEnMask = 0;
		try {
			chEnMask = parseChannelsEnabled(window.top.fiplexConfStr, r, n);
			sqEn = parseSQEnabled(window.top.fiplexConfStr, r);
		} catch(err) {}
		var cfg = new ConfigRemote();
		var hasPersistAlarm = false;
		try {
			cfg.parse(window.parent.navi.configArray[r]);
			hasPersistAlarm = cfg.isPersistAlarmEn();
		} catch(err) {}
		for (var ch = 1, shift = 80,mask = 1; ch <= ch_nr; ch++) {
			bitmask = parseInt(statstrs[n+expansorNr].substr(shift,2),16);
			shift += 2;
			signal_in = bitmask & 0x80;
			var persistAlarm = hasPersistAlarm ? (bitmask & 0x40) : false;
			num = cSignedByte(parseInt(statstrs[n+expansorNr].substr(shift,2),16));		
			shift += 2;
			ch_disabled = !(chEnMask & mask);
			mask <<= 1;
			if (signal_in && !ch_disabled) {
				chSignalLedSet(ch, r, persistAlarm ? "red" : "green");
				chPowerSet(ch, r, num);
			} else {
				chSignalLedSet(ch, r, "grey");
				chPowerSet(ch, r, num, "#bbbbbb");
			}
			num = cSignedByte(parseInt(statstrs[n+expansorNr].substr(shift,2),16));
			try {
				if (filtEnabled && !filtEnabled[r] || ch_disabled) {
					chAgcSet(ch,r,"--", "#bbbbbb");
				} else {
					chAgcSet(ch,r,!signal_in&&sqEn?0:num);
				}
			} catch(err) {}
			shift += 2;
		}
	}
	fiberPorts = [];
	var expansor_rx_loss_alarm = [];
	for (var n = 1; n <= remotesNr+expansorNr; n++) { //n de 1 a remotesNr --> remotes, n de remotesNr a remotesNr+expansorNr -->expansores
		var isExpansor = (n>remotesNr);
		var ne = n-remotesNr;
		var kmax = (isExpansor)?2:((window.top.FiberMask[n]==0x03)?3:2);
		var r;
		if (isExpansor) {
			r = 0;
		} else {
			if (autoUpdt) {
				r = n;
			} else {
				r = computeRemNrInConf(statstrs[n+expansorNr]);
			}
		}
		for (var k = 0; k < kmax; k++) {
			var isRemote = (k > 0);
			warning = false;
			alarm = false;
			if (!isExpansor) 
			{
				idx = getRemoteIndex(n, remotesNr, window.top.MaxRemotesNr, window.top.remotesStatMask);
				setFiberNum(n,window.top.NumFiberRemote[idx]);
				fiberPorts[n-1] = {x: idx, nf: window.top.NumFiberRemote[idx]-1};
				if (k==0){
					if (idx<=6)
					{
						device=0;
						shift = 82*2 + (idx-1)*28;
					}
					else
					{
						device=Math.floor((idx-1)/6);
						shift = 4*2 + (((idx-1) % 6)-1)*28 + 28;
					}		
				}
				else
				{
					device=expansorNr+n;
					shift = 18+(k-1)*28;
				}
			}
			else
			{
				if (k==0)
				{
					device = ne-1;
					shift = (ne==1) ? 360 : 204;			
				}
				else
				{
					device = ne;
					shift = 176;		
				}
			}

			temp = to_float(parseInt(statstrs[device].substr(shift,4),16)).toFixed(1);
			if (temp > 75 || temp < -35) {
				if (temp > 85 || temp < -40) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			shift += 4;
			volt = parseInt(statstrs[device].substr(shift,4),16) * 1e-4;
			if (volt > 3.5 || volt < 3.1) {
				if (volt > 3.6 || volt < 3.0) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			shift += 4;
			bias = parseInt(statstrs[device].substr(shift,4),16) / 500;
			if (bias > 55 || bias < 7) {
				if (bias > 65 || bias < 5) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			shift += 4;
			txpow = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
			if (txpow > 7 || txpow < -5) {
				if (txpow > 8 || txpow < -6) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			shift += 4;
			rxpow = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
			fiberPowerSet(r, k, rxpow);
			shift += 4;
			sfpalarm = parseInt(statstrs[device].substr(shift,2),16);
			shift += 2;
			gtpalarm = parseInt(statstrs[device].substr(shift,2),16);
			if ((sfpalarm & 0x05) || (gtpalarm & 0x01)) {
				alarm = true;
			}
			if (!isExpansor){
				optStatusLedSet(r, k, alarm? "red" : (warning? "yellow" : "green"));
				if (k==0) optFrSyncLedSet(r, (gtpalarm & 0x08)? "red":"green");
			}
			warning = false;
			alarm = false;
			if ((sfpalarm & 0x02) || (gtpalarm & 0x06)) {
				alarm = true;
			}
			if (rxpow >= 2.5 || rxpow <= -24.5) {
				if (rxpow >= 4.5 || rxpow <= -29.5) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			
			if (!isRemote && !isExpansor) {
				window.top.master_rx_loss_alarm[n] = alarm;
				fiberLinkLedSet(n, alarm ? "red" : (warning? "yellow" : "green"));
				if (current_rxloss[n] != window.top.master_rx_loss_alarm[n]) {
					if (current_rxloss[n]) {
						changedRxLossMask = 1;
					} else if (changedRxLossMask == 0) {
						changedRxLossMask = -1;
					} else if (!autoUpdt) {
						changedRxLossMask = -1;
					}
				}
			}
			if (!isExpansor)
			{
				optRxLedSet(r, k, alarm? "red": (warning? "yellow" : "green"));
				if (isRemote) {
					if (k==window.top.NumFiberRemote[idx]){
						if (alarm)
							 fiberLinkLedSet(r, "red");
						else if (warning && !window.top.master_rx_loss_alarm[n])
							fiberLinkLedSet(r, "yellow");
					}
					bitmask = parseInt(statstrs[device].substr(16,2),16);
					if (bitmask==0) {
						optActiveLinkSet(r,"green","grey");
					} else {
						optActiveLinkSet(r,"grey","green");
					}
					var redunded = isFiberRedunded(r);
					var rx_alarm = window.top.master_rx_loss_alarm[n] || true;
				}
				shift += 2;
				num  =  parseInt(statstrs[device].substr(shift,4),16);
				if (isRemote && window.top.master_rx_loss_alarm[n]) {
					optErrorsSet(r, k, "invalid");
				} else {
					optErrorsSet(r, k, num);
				}
			}
			else {
				if (k==0)  {
					expansorLinkLedSet(ne,alarm? "red":(warning? "yellow" : "green"));
					expansor_rx_loss_alarm.push(alarm ? true : false);
				}
			}
		}
	}
	var rembitmask = parseRemotesBitmaskFromConf(window.top.fiplexConfStr);
	for (var n = expansorNr+1; n <= window.top.expansorNr; ++n) {
		expansorLinkLedSet(n, "grey");
		for (var i = 0; i < 6; ++i) {
			var m = n*6 + i;
			if (!(rembitmask & (1 << m))) {
				continue;
			}
			var r = computeRemNrWithIdx(m+1);
			fiberLinkLedSet(r, "grey");
		}
	}
	for (var k = 0, s = ""; k < fiberPorts.length; ++k) {
		s += "["+k+", ("+fiberPorts[k].x+", "+fiberPorts[k].nf+")] ";
	}
	gdRender(delays, fiberPorts);
	gtpalarm = parseInt(statstrs[0].substr(354,2),16);
	if (masterMode == 2) {
		setMasterModeStatus((gtpalarm & 0x10) ? "SECONDARY" : "PRIMARY");
	} else {
		setMasterModeStatus("");
	}
	bsAlarmCapable = (gtpalarm & 0x20) != 0;
	bsSignalIn = bsAlarmCapable && ((gtpalarm & 0x40) != 0);
	var rxlow = bsAlarmCapable ? !bsSignalIn : !signal_downlink;
	tbsFailLedSet(rxlow ? "red" : "grey");
	var paCurrentAlarm = (gtpalarm & 0x80) != 0;
	paCurrentLedSet(paCurrentAlarm ? "red" : "grey");
	if (signal_ovf)
		rfInPowSet(0, powerInput, "#df4040");
	else if (warning_ovf)
		rfInPowSet(0, powerInput, "#f1a165");
	/*else if (rxlow)
		rfInPowSet(0, powerInput, "#f1a165");*/
	else
		rfInPowSet(0, powerInput);

	bitmask = parseInt(statstrs[0].substr(352,2),16);
	signal_ovf2 = bitmask & 0x01;
	var warning_ovf2 = bitmask & 0x02;
	setActiveInput(bitmask & 0x04);
	var limit_gain = LIMIT_GAIN[factory.data.uplinkCoupling == 1 ? 1 : 0];
	for (var n = 1; n <= remotesNr; n++){
		var r = autoUpdt ? n : computeRemNrInConf(statstrs[n+expansorNr]);
		if (!window.top.master_rx_loss_alarm[n]) {
			gainDLSet(r, limit_gain - window.top.attin[bitmask & 0x04?1:0] - window.top.attout[r]);
		}
	}
	powerInput2 = to_float(parseInt(statstrs[0].substr(356,4),16));
	color = signal_ovf2 ? "red" : (warning_ovf2 ? "yellow":"grey");
	ovfLedSet("01", color);
	if (signal_ovf2)
		rfInPowSet("01", powerInput2, "#df4040");
	else if (warning_ovf2)
		rfInPowSet("01", powerInput2, "#f1a165");
	/*else if (rxlow)
		rfInPowSet("01", powerInput2, "#f1a165");*/
	else
		rfInPowSet("01", powerInput2);
	
	for (var n = 1; n <= remotesNr; n++) {
		var r = autoUpdt ? n : computeRemNrInConf(statstrs[n+expansorNr]);
		shift = 4;
		bitmask = parseInt(statstrs[n+expansorNr].substr(shift,2),16);
		enHpaLedSet(r, (bitmask & 0x20)? "green" : "red");
		ovfHpaLedSet(r, (bitmask & 0x01)?  "red" : "grey");
		
		vswrHpaLedSet(r, (bitmask & 0x04)?  "red" : "grey");
		statHpaLedSet(r, (bitmask & 0x10)?  "red" : "grey");
		txLowHpaLedSet(r, (bitmask & 0x08)?  "red" : "grey");
		
		shift += 2;
		num = to_float(parseInt(statstrs[n+expansorNr].substr(shift,4),16));
		boardTempSet(r, num);
		shift += 4;
		num = to_float(parseInt(statstrs[n+expansorNr].substr(shift,4),16));
		rfOutPowSet(r, num);
	}
	for (var n = 1; n <= remotesNr; n++) {
		var r = autoUpdt ? n : computeRemNrInConf(statstrs[n+expansorNr]);
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		var v = window.top.master_valid_conf;
		var valid = (typeof(v[k]) !== 'undefined') && v[k] === true;
		if (window.top.master_rx_loss_alarm[n] || (!autoUpdt && !valid)) {
			setTag(r, tags[k+window.top.MaxExpansorNr]+"&nbsp;DISCONNECTED");
			showStatusInvalid(r);
			remoteInputsDisableStateSet(r, true);
		} else {
			setTag(r, tags[k+window.top.MaxExpansorNr]);
			remoteInputsDisableStateSet(r, false);
		}
	}
	var rembitmask = parseRemotesBitmaskFromConf(window.top.fiplexConfStr);
	for (var ne = window.top.expansorNr; ne > 0; --ne) {
		for (var i = 0; i < 6; ++i) {
			var n = ne*6 + i;
			if (!(rembitmask & (1 << n))) {
				continue;
			}
			var r = computeRemNrWithIdx(n+1);
			var m = n+1+window.top.MaxExpansorNr;
			if (expansor_rx_loss_alarm[ne-1] || (n+1 > (expansorNr+1)*6)) {
				setTag(r, tags[m]+"&nbsp;DISCONNECTED");
				showStatusInvalid(r);
				remoteInputsDisableStateSet(r, true);
			}
		}
	}
	if (autoUpdt) {
		showUnitDivs(remotesNr);
	}
	return changedRxLossMask;
}

function showStatusInvalid(r) {
	optActiveLinkSet(r,"grey","grey");
	optFrSyncLedSet(r, "grey");
	ovfLedSet(r, "grey") ;
	rfInPowSet(r, '---');
	for (var ch = 1; ch <= window.top.MaxChNr; ch++) {
		chPowerSet(ch, r, '---');
		chSignalLedSet(ch, r, "grey");
	}
	ovfHpaLedSet(r, "grey");
	vswrHpaLedSet(r, "grey");
	statHpaLedSet(r, "grey");
	txLowHpaLedSet(r, "grey");
	enHpaLedSet(r, "grey");
	rfOutPowSet(r, '');
	optStatusLedSet(r, 1, "grey");optStatusLedSet(r, 2, "grey");
	optRxLedSet(r, 1, "grey");optRxLedSet(r, 2, "grey");
	fiberPowerSet(r, 1, '---', "#bbbbbb");fiberPowerSet(r, 2, '---', "#bbbbbb");
	optFrSyncLedSet(r, "grey");
	boardTempSet(r, "---");
}

function parse_config(serverResponse) {
	var n, shift, bitmask, nfr, bw, stby, fr, gain, num, attout_g, attout;
	var attin_down,attin_down2, attout_up, attout_down;
	var remotesNr = window.top.remotesNr;
	var ch_nr = window.top.MaxChNr;
	var channel = new Array();
	var confstrs = serverResponse.split("\t");
	//Master
	shift = 14;
	bitmask = parseInt(confstrs[0].substr(shift,2),16);
	hpaSwSet(0, !(bitmask & 0x01));
	enHpaLedSet(0, !(bitmask & 0x01) ? "green" : "grey");
	filtEnableSet(0, !(bitmask & 0x02));
	filtEnabled = [];
	filtEnabled.push(!(bitmask & 0x02));
	masterFiltEnabled = !(bitmask & 0x02);
	filtSqEnSet(0, bitmask & 0x10);
	masterSqEnabled = (bitmask & 0x10) != 0;
	simplexEnSet(0, bitmask & 0x04);
	simplexAllowedArr = [];
	simplexAllowedArr.push(factory.isSimplexAllowed());
	simplexSetArr = [];
	simplexSetArr.push((bitmask & 0x04) != 0);
	var mode = (bitmask & 0x08) ? 2 : (bitmask & 0x20) ? 1 : 0
	setMasterMode(mode);
	masterMode = mode;
	setLinkedFreq(window.top.LinkedFreq);
	shift += 2;
	gain = parseInt(confstrs[0].substr(shift,2),16); //Main Gain
	if (isNaN(gain)) {
		gain = 0;
	} 
	gain = cSignedByte(gain);
	shift += 2;
	attin_down2 = parseInt(confstrs[0].substr(174,2),16);
	inputAttenuatorSet(1, attin_down2 & 0x1f);
	setInputSelMode((attin_down2&0x40)>>6,0);
	viewAutoMode((attin_down2&0x40)>>6);
	setInputSelMode((attin_down2&0x20)>>5,1);
	attin_down = parseInt(confstrs[0].substr(shift,2),16);
	inputAttenuatorSet(0, attin_down);
	if (attin_down2 & 0x80) attin_down=attin_down2& 0x1f;
	window.top.attin[0] = attin_down;
	window.top.attin[1] = attin_down2& 0x1f;
	attin_down = window.top.attin[(attin_down2 & 0x80)?1:0];
	//setActiveInput(attin_down2 & 0x80);
	shift += 2;
	attout = parseInt(confstrs[0].substr(shift,2),16);
	attout_g = attout - gain + 3;
	if (attout_g < 0)
		attout_g = 0;
	outputAttenuatorSet(0, attout_g);
	attout_up = attout_g;
	shift += 2;
	num = parseInt(confstrs[0].substr(shift,2),16);
	num = num < 128 ? num : num - 256;
	filtSqThrSet(0, num);
	shift += 2;
	for (var ch = 1; ch <= ch_nr; ++ch) {
		var data = parseInt(confstrs[0].substr(shift, 4), 16);
		shift += 4;
		if (!isNaN(data)) {
			fr = parseChFreq(data, false);
			channel[ch] = fr;
			chFrSet(ch, 0, fr);
			bw = data & 0x07;
			chBwSet(ch, 0, bw)
		}
		gain = parseInt(confstrs[0].substr(shift,2),16);
		if (isNaN(gain)) {
			gain = 0;
		}
		gain = cSignedByte(gain);
		shift += 2;
		chFineGainSet(ch, 0, gain);
	}
	var stbychannels = parseInt(confstrs[0].substr(shift,6),16);
	for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
		chEnableSet(ch, 0, !(stbychannels & mask));
		mask <<= 1;
	}
	shift+=8;
	for (var ch = 0; ch < 2; ch++) {
		num = parseInt(confstrs[0].substr(shift,4),16);
		DLDelaySet(ch,num/10);
		shift+=4;
	}
	for (var ch = 0; ch < 2; ch++) {
		num = parseInt(confstrs[0].substr(shift,2),16);
		swTimeSet(ch,num & 0xfe);
		shift+=2;
	}	
	num = parseInt(confstrs[0].substr(shift,2),16);
	num = num < 128 ? num : num - 256;
	filtSqThrSet("01", num);
	shift += 2;
	num = parseInt(confstrs[0].substr(shift,2),16);
	num = num < 128 ? num : num - 256;
	remotePwrReductionSet(num);
	//Remotes
	if (masterFpgaAlarm)
		return;
	for (var n = 1; n <= remotesNr && n < confstrs.length; ++n) {
		
		var valid = parseInt(confstrs[n].substr(-2, 2), 16) != 0;
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		window.top.master_valid_conf[k] = valid;
		shift = 6;
		bitmask = parseInt(confstrs[n].substr(shift,2),16);
		if (!window.top.master_rx_loss_alarm[n] && valid) hpaSwSet(n, bitmask & 0x01);
		shift += 2;
		bitmask = parseInt(confstrs[n].substr(shift,2),16);
		var delayEnabled = false;
		delayEnabled = (bitmask & 0x20)!=0;
		if (!window.top.master_rx_loss_alarm[n] && valid) filtEnableSet(n, !(bitmask & 0x02));
		filtEnabled.push(!(bitmask & 0x02));
		if (!window.top.master_rx_loss_alarm[n] && valid) filtSqEnSet(n, bitmask & 0x10);
		if (!window.top.master_rx_loss_alarm[n] && valid) gdEnSet(delayEnabled, n);
		if (!window.top.master_rx_loss_alarm[n] && valid) {
			var simplexAllowed = (bitmask & 0x80) != 0;
			var simplex = (bitmask & 0x40) != 0;
			simplexEnShow(n, simplexAllowed);
			simplexEnSet(n, simplex);
			simplexAllowedArr.push(simplexAllowed);
			simplexSetArr.push(simplex);
		}
		shift += 2;
		gain = parseInt(confstrs[n].substr(shift,2),16);
		if (isNaN(gain)) {
			gain = 0;
		}
		gain = cSignedByte(gain);
		shift += 2;
		attout = parseInt(confstrs[n].substr(shift,2),16);
		attout_g = attout - gain + 3;
		if (attout_g < 0)
			attout_g = 0;
		if (!window.top.master_rx_loss_alarm[n] && valid) outputAttenuatorSet(n, attout_g);
		attout_down = attout_g;
		window.top.attout[n]=attout_down;
		var k = factory.data.uplinkCoupling == 1 ? 1 : 0; 
		var limit_gain = LIMIT_GAIN[k];
		if (!window.top.master_rx_loss_alarm[n] && valid) gainULSet(n, limit_gain - attout_up);
		if (!window.top.master_rx_loss_alarm[n] && valid) gainDLSet(n, limit_gain - attin_down - window.top.attout[n]);
		shift += 2;
		num = parseInt(confstrs[n].substr(shift,2),16);
		num = (num < 128) ? num : num - 256;
		if (!window.top.master_rx_loss_alarm[n] && valid) filtSqThrSet(n, num);
	}
	for (n = 1; n <= remotesNr && n < confstrs.length; ++n) {
		var valid = parseInt(confstrs[n].substr(-2,2), 16) != 0;
		remoteInputsDisableStateSet(n, window.top.master_rx_loss_alarm[n] || !valid);
		shift = 16;
		for (var ch = 1; ch <= ch_nr; ++ch) {
			var data = parseInt(confstrs[n].substr(shift, 4), 16);
			shift += 4;
			if (!isNaN(data)) {
				fr = parseChFreq(data, true);
				bw = data & 0x07;
				if (!window.top.master_rx_loss_alarm[n] && valid) {
					chFrSet(ch, n, fr);
					chBwSet(ch, n, bw);
				}
			}
			if ((fr - factory.data.band[0].fStartUL) != (channel[ch] - factory.data.band[0].fStartDL) && filtEnIsSet(n)) {
				if (!window.top.master_rx_loss_alarm[n] && valid && window.top.LinkedFreq)  chFrAlert(ch, n, true);
			} else {
				if (!window.top.master_rx_loss_alarm[n] && valid) chFrAlert(ch, n, false);
			}
			gain = parseInt(confstrs[n].substr(shift,2),16);
			if (isNaN(gain)) {
				gain = 0;
			}
			gain = cSignedByte(gain);
			if (!window.top.master_rx_loss_alarm[n] && valid) chFineGainSet(ch, n, gain);
			shift += 2;
			filtEnAlert(n);
		}
		var stbychannels = parseInt(confstrs[n].substr(shift,6),16);
		shift += 6;
		for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
			if (valid) {
				chEnableSet(ch, n, !(stbychannels & mask));
				chEnableAlert(ch, n);
			}
			mask <<= 1;
			if (!chEnableIsSet(ch, n))
				chFrAlert(ch, n, false);
		}
		for (ch=0;ch<4;ch++) {
			num = parseInt(confstrs[n].substr(shift,4),16);
			shift += 4;
			delaySet(n,(ch % 2), Math.floor(ch/2), num/10);
		}
		var persistTime = parseInt(confstrs[n].substr(shift, 4), 16);
		shift += 4;
		persistTimeSet(n, persistTime);
	}
}

function isRemoteSimplexSet() {
	var remoteSimplexSet = false;
	var nr = 0;
	for (var n = 1; n <= window.top.remotesNr; ++n) {
		if (!simplexAllowedArr[n]) {
			continue;
		}
		if (window.top.master_rx_loss_alarm[n]) {
			continue;
		}
		nr++;
		if (simplexSetArr[n]) {
			remoteSimplexSet = true;
			break;
		}
	}
	return (remoteSimplexSet && nr > 0);
}

function isSimplexConfErr() {
	if (!simplexAllowedArr[0]) {
		return false;
	}
	return (!simplexSetArr[0] && isRemoteSimplexSet());
}

function isSimplexFactErr() {
	if (simplexAllowedArr[0]) {
		return false;
	}
	if (!isRemoteSimplexSet()) {
		return false;
	}
	if (masterFiltEnabled && masterSqEnabled) {
		return false;
	}
	return true;
}

function simplexErrorMessage() {
	return "SIMPLEX MODE CONFIGURATION ERROR";
}

function simplexRemotesArr() {
	var remoteSimplexErr = [];
	for (var n = 1; n <= window.top.remotesNr; ++n) {
		if (!simplexAllowedArr[n]) {
			continue;
		}
		if (simplexSetArr[n]) {
			remoteSimplexErr.push(n);
		}
	}
	return remoteSimplexErr;
}

function isAllRemoteConfValid() {
	for (var n = 1; n <= window.top.remotesNr; ++n) {
		if (window.top.master_rx_loss_alarm[n])
			continue;
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		if (!window.top.master_valid_conf[k])
			return false;
	}
	return true;
}
function parseChFreq(data, isUL) {
	var num = data >> 3;
	if (data & 0x8000)
		num |= 0xE000;
	var nfr = num < 32768 ? num : num - 65536;
	var fo = isUL ? factory.data.band[0].foUL : factory.data.band[0].foDL;
	var fr = nfr * factory.data.fstep + fo; 
	return fr;
}
function parseSQEnabled(serverResponse,nr){
	var confstrs = serverResponse.split("\t");
	try{
		var num = parseInt(confstrs[nr].substr(nr==0?14:8,2),16);
		return (num&0x10?1:0);
	}catch (err) {
		return 0;
	}
}
function parseChannelsEnabled(serverResponse, nr, nstat) {
	var confstrs = serverResponse.split("\t");
	var ch_nr = window.top.MaxChNr;
	var chMask = 0;
	var num ;
	if (confstrs.length<2) return 0;
	if (nr>confstrs.length-2) return 0;
	if (nr == 0) {
		num = parseInt(confstrs[0].substr(-26,6).substr(0,6),16); //-26: al alargar la trama se ha pasado de -24 a -26
		for (var i = 0, mask = 1; i < ch_nr; ++i) {
			if (!(num & mask))
				chMask |= mask;
			mask <<= 1;
		}
		return chMask;
	}
	if (nr < 0) return 0;
	try {
		var valid = parseInt(confstrs[nr].substr(-2,2),16) != 0;
		if (window.top.master_rx_loss_alarm.length < nstat) {
			return 0;
		}
		if (window.top.master_rx_loss_alarm[nstat] || !valid) {
			return 0;
		}
		num = parseInt(confstrs[nr].substr(160,6),16);
		for (var i = 0, mask = 1; i < ch_nr; ++i) {
			if (!(num & mask))
				chMask |= mask;
			mask <<= 1;
		}
	} catch(err) {}
	return chMask;
}

function format_config(currentConfigFrm, reset_nr) {
	confFrames.length = 0;
	if (reset_nr >= 0 && reset_nr <= window.top.remotesNr) {
		var subframe = format_reset(currentConfigFrm, reset_nr);
		confFrames.push(subframe);
		return;
	}
	var channel = new Array();
	var keepCh = new Array();
	for (var n = 0; n <= window.top.remotesNr; ++n) {
		if (n > 0 && isFiberRedunded(n) && n != linkActiveRedunded(n)) {
			continue;
		}
		try {
			var subframe = format_unit(currentConfigFrm, channel, keepCh, n);
		} catch(e) {
			continue;
		}
		if (compare_unit_conf(currentConfigFrm, subframe, n))
			continue;
		confFrames.push(subframe);
	}
}
function format_reset(currentConfigFrm, n) {
	var confstrs = currentConfigFrm.split("\t");
	var subframe;
	if (n==0)
		subframe = confstrs[0].substr(0,12) + "01" + confstrs[0].substr(-180,180);
	else
		subframe = confstrs[n].substr(0,4) + "01" + confstrs[n].substr(-194,194);
	return subframe;
}
function formatClearCounters(currentConfigFrm) {
	confFrames.length = 0;
	var confstrs = currentConfigFrm.split("\t");
	for (var n = 0; n <= window.top.remotesNr; ++n) {
		if (n > 0 && isFiberRedunded(n) && n != linkActiveRedunded(n)) {
			continue;
		}
		var subframe;
		if (n == 0) {
			subframe = confstrs[n].substr(0,12) + "20" + confstrs[n].substr(14);
		} else {
			subframe = confstrs[n].substr(0,4) + "20" + confstrs[n].substr(6);
		}
		confFrames.push(subframe);
	}
}
function compare_unit_conf(currentConfigFrm, frm, n) {
	var confstrs = currentConfigFrm.split("\t");
	return confstrs[n] == frm;
}
function format_unit(currentConfigFrm, channel, keepCh, n) {
	var confstrs = currentConfigFrm.split("\t");
	var ch_nr = window.top.MaxChNr;
	var currSubfrm = confstrs[n];
	var configFrm = currSubfrm.substr(0, n == 0 ? 12 : 4);
	try {
	configFrm += "00";
	if (getHiddenUnitState(n) || (n > 0 && window.top.master_rx_loss_alarm[n])) {
		configFrm += currSubfrm.substr(configFrm.length, currSubfrm.length - configFrm.length);
		return configFrm;
	}
	var bitmask = parseInt(currSubfrm.substr(configFrm.length,2),16) & 0xfe;
	var attout_g, attout, gain;
	if (n > 0) {
		if (hpaIsOn(n))
			bitmask |= 0x01;
		configFrm += hexformat(bitmask, 2);
	}
	bitmask = parseInt(currSubfrm.substr(configFrm.length,2),16);
	if (n == 0) {
		if (factory.isSimplexAllowed()) {
			bitmask &= 0x80;
		} else {
			bitmask &= 0x84;
		}
	} else {
		bitmask &= 0x81;
	}
	if (n > 0) {
		bitmask |= 0x04;
	}
	if (n == 0) {
		var paMaster = hpaIsOn(0);
		if (paMaster != -1) {
			if (!paMaster) {
				bitmask |= 0x01;
			}
		}
	}
	if (!filtEnIsSet(n)) bitmask |= 0x02;
	if (filtSqEnIsSet(n)) bitmask |= 0x10;
	if (simplexIsSet(n)) {
		if (n == 0 && factory.isSimplexAllowed()) {
			bitmask |= 0x04;
		} else {
			bitmask |= 0x40;
		}
	}
	simplexSetArr[n] = simplexIsSet(n);
	if (n == 0) {
		masterFiltEnabled = filtEnIsSet(0);
		masterSqEnabled = filtSqEnIsSet(0);
	}
	if (n==0){
		var mode = getMasterMode();
		switch (mode) {
		case 0: default: break;		//main
		case 1: bitmask |= 0x20; break;	//redundant
		}
		if (!getLinkedFreq()) bitmask |= 0x40;
	}
	else{
		//if (getRemoteMode(n)) bitmask |= 0x08;
		if (gdIsEnabled(n)) bitmask |= 0x20;
	}
	
	configFrm += hexformat(bitmask, 2);
	attout_g = outputAttenuatorGet(n);
	if (attout_g == null || isNaN(attout_g)) {
		configFrm += currSubfrm.substr(configFrm.length, currSubfrm.length - configFrm.length - 2);
		configFrm += "00";
		return configFrm;		
	}
	var k = factory.data.uplinkCoupling == 1 ? 1 : 0;
	var limit_gain = LIMIT_GAIN[k];
	k = (n==0) ? (factory.data.uplinkCoupling == 0 ? 0 : 1) : 1;
	if (attout_g < attOutLims[k].min) {
		attout_g = attOutLims[k].min;
		outputAttenuatorSet(n, attout_g);
	}
	if (attout_g > attOutLims[k].max) {
		attout_g = attOutLims[k].max;
		outputAttenuatorSet(n, attout_g);
	}	
	if (attout_g <= 6) {
		attout = 0;
		gain = 3 - attout_g;
	} else if (attout_g <= 37) {
		gain = -3;
		attout = attout_g - 6;
	} else {
		if (attout_g > limit_gain) {
			attout_g = limit_gain;
			outputAttenuatorSet(n, attout_g);
		}
		attout = 31;
		gain = 34 - attout_g;
	}
	gain = rSignedByte(gain);
	if (gain > 255)
		gain = 255;
	configFrm += hexformat(gain, 2);
	if (n == 0)
	{
		attout_g=inputAttenuatorGet(0);
		if (attout_g < attInLims.min) {
			attout_g = attInLims.min;
			inputAttenuatorSet(0, attout_g);
		}
		if (attout_g > attInLims.max) {
			attout_g = attInLims.max;
			inputAttenuatorSet(0, attout_g);
		}
		configFrm += hexformat(attout_g, 2);
	}
	configFrm += hexformat(attout, 2);
	var num =  filtSqThrGet(n);
	if (n == 0) {
		if (num > sqThrDLLims[k].max)
			num = sqThrDLLims[k].max;
		else if (num < sqThrDLLims[k].min)
			num = sqThrDLLims[k].min;
	}
	else{
		if (num > sqThrULLims.max)
			num = sqThrULLims.max;
		else if (num < sqThrULLims.min)
			num = sqThrULLims.min;
	}
	if (num < 0)
		num += 256;
	configFrm += hexformat(num, 2);
	for (var ch = 1; ch <= ch_nr; ++ch) {
		var num;
		var fr;
		if (!(window.top.showChannelsBitmask & (1 << (ch-1)))) {
			keepCh[ch] = true;
			configFrm += currSubfrm.substr(configFrm.length, 6);
			continue;
		}
		keepCh[ch] = false;
		if (n == 0) {
			fr = chFrGet(ch, 0);
			if (isNaN(fr) || fr < factory.data.band[0].fStartDL) {
				fr = factory.data.band[0].fStartDL;
				chFrSet(ch, 0, fr);
			}
			if (isNaN(fr) || fr > factory.data.band[0].fStopDL) {
				fr = factory.data.band[0].fStopDL;
				chFrSet(ch, 0, fr);
			}			
			num = this.computeChNum(fr, false);
			channel[ch] = num;
		} else {
			if (!window.top.LinkedFreq){
				fr = chFrGet(ch, n);
				if (isNaN(fr) || fr < factory.data.band[0].fStartUL) {
					fr = factory.data.band[0].fStartUL;
					chFrSet(ch, 0, fr);
				}
				if (isNaN(fr) || fr > factory.data.band[0].fStopUL) {
					fr = factory.data.band[0].fStopUL;
					chFrSet(ch, 0, fr);
				}				
				num = this.computeChNum(fr, true);
			} else {
				if (getHiddenUnitState(0)) {
					var data = parseInt(currSubfrm.substr(configFrm.length,4),16);
					var num = data >> 3;
					if (data & 0x8000)
						num |= 0xE000;
					var nfr = num < 32768 ? num : num - 65536;
					channel[ch] = nfr;
				}
				num = computeChNrOtherBand(channel[ch], false);
				var nmax = ~~Math.round((factory.data.band[0].fStopUL - factory.data.band[0].foUL) / factory.data.fstep);
				var nmin = ~~Math.round((factory.data.band[0].fStartUL - factory.data.band[0].foUL) / factory.data.fstep);
				if (num>nmax) num=nmax;
				if (num<nmin) num=nmin;
			}
				
		}
		if (num < 0)
			num += 65536;
		num <<= 3;
		bw = chBwGet(ch, n);
		num |= bw;
		configFrm += hexformat(num, 4);
		gain = chFineGainGet(ch, n);
		if (gain < fineGainLims.min)
			gain = fineGainLims.min;
		else if (gain > fineGainLims.max)
			gain = fineGainLims.max;
		gain = rSignedByte(gain);
		if (gain > 255)
			gain = 255;
		configFrm += hexformat(gain, 2);
	}
	var stbychannels = 0;
	var currentStbyCh = parseInt(currSubfrm.substr(configFrm.length, 6), 16);
	for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
		var stby;
		if (keepCh[ch]) {
			stby = (currentStbyCh & mask) != 0;
		} else {
			stby = !chEnableIsSet(ch, n);
		}
		if (stby) {
			stbychannels |= mask;
		}
		mask <<= 1;
	}
	configFrm += hexformat(stbychannels, 6);
	if (n == 0)
	{
		attout_g=inputAttenuatorGet(1);
		if (attout_g < attInLims.min) {
			attout_g = attInLims.min;
			inputAttenuatorSet(1, attout_g);
		}
		if (attout_g > attInLims.max) {
			attout_g = attInLims.max;
			inputAttenuatorSet(1, attout_g);
		}
		if (getInputSelMode(0)) attout_g|=0x40;
		if (getInputSelMode(1)) attout_g|=0x20;
		var insel = parseInt(currSubfrm.substr(configFrm.length, 2), 16);
		if (insel) {
			insel &= 0x80;
		} else {
			insel = 0;
		}
		attout_g |= insel;
		configFrm += hexformat(attout_g, 2);
		for (var ch = 0; ch < 2; ch++) {
			var delay = DLDelayGet(ch);
			if (delay<0){
				configFrm += currSubfrm.substr(configFrm.length, 4);
			}else{
				if (delay < delayLims.min) delay=delayLims.min;
				if (delay > delayLims.max) delay=delayLims.max;
				DLDelaySet(ch, delay);
				configFrm += hexformat(Math.round(delay*10),4);					
			}

		}	
		for (var ch = 0; ch < 2; ch++) {
			var delay = swTimeGet(ch);
			if (delay<0){
				configFrm += currSubfrm.substr(configFrm.length, 2);
			}else{
				if (delay < swTimeLims.min) delay=swTimeLims.min;
				if (delay > swTimeLims.max) delay=swTimeLims.max;
				delay &= 0xfe;
				swTimeSet(ch, delay);
				configFrm += hexformat(delay,2);	
			}
		}		
		num =  filtSqThrGet("01");
		if (num > sqThrDLLims[k].max)
			num = sqThrDLLims[k].max;
		else if (num < sqThrDLLims[k].min)
			num = sqThrDLLims[k].min;
		if (num < 0) num += 256;
		configFrm += hexformat(num, 2);
		num = remotePwrReductionGet();
		if (num > remPwrRedLims.max) {
			num = remPwrRedLims.max;
		} else if (num < remPwrRedLims.min) {
			num = remPwrRedLims.min;
		}
		if (num < 0) num += 256;
		configFrm += hexformat(num, 2);
	}
	if (n > 0){
		for (ch=0;ch<4;ch++) {
			var delay = delayGet(n, (ch % 2), Math.floor(ch/2));
			if (delay < delayLims.min) delay=delayLims.min;
			if (delay > delayLims.max) delay=delayLims.max;
			configFrm += hexformat(Math.round(delay*10),4);
		}
		var t = persistTimeGet(n);
		if (t >= 0) {
			configFrm += hexformat(t, 4);
			configFrm += currSubfrm.substr(configFrm.length, 12);
		} else {
			configFrm += currSubfrm.substr(configFrm.length, 16);
		}
	}
	configFrm += currSubfrm.slice(-2);
	} catch(e) {}
	return configFrm;
}
function computeChNum(fr, isUL) {
	if (isNaN(fr)){
		return Number.NaN;
	}
	var fo = isUL ? factory.data.band[0].foUL : factory.data.band[0].foDL;
	var num = (fr - fo) / factory.data.fstep;
	return ~~Math.round(num);
}
function computeChNrOtherBand(chNr, isUL) {
	var fo = isUL ? factory.data.band[0].foUL : factory.data.band[0].foDL;
	var fstart = isUL ? factory.data.band[0].fStartUL : factory.data.band[0].fStartDL;
	var fr = chNr * factory.data.fstep + fo;
	var diff = fr - fstart;
	fstart = isUL ? factory.data.band[0].fStartDL : factory.data.band[0].fStartUL;
	fr = fstart + diff;
	var num = computeChNum(fr, !isUL);
	return num;
}
function parse_tags(serverResponse) {
	try {
		var TAGLEN = window.top.TAGLEN;
		var str = tag_read(serverResponse);
		var strlen = str.length;
		var len = TAGLEN + 4;
		var tagstrs = [];
		for (var p = 0; p < strlen; p += len + 1) {
			if (strlen - p < len) {
				break;
			}
			try {
				tagstrs.push(str.substr(p, len));
			} catch(e) {}
		}
		var n;
		//master
		tags[0] = (tagstrs[0].substr(-TAGLEN,TAGLEN));
		//expansores
		for (n=1; n<=window.top.expansorNr; ++n)
		{
			if (typeof(tagstrs[n]) !== "undefined")
				tags[n] =  (tagstrs[n].substr(-TAGLEN,TAGLEN));
		}
		//remotos
		for (n=1; n<=window.top.remotesNr; ++n)
		{
			var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
			
			if (!isNaN(n) && !(n < 0 || n > (window.top.MaxRemotesNr+window.top.MaxExpansorNr)))
			{
				//if (parseInt(tagstrs[n+window.top.expansorNr].substr(0,2),16)==k)
				if (typeof(tagstrs[n+window.top.expansorNr]) !== "undefined")
					tags[k+window.top.MaxExpansorNr] = (tagstrs[n+window.top.expansorNr].substr(-TAGLEN,TAGLEN));
			}
		}
	} catch(e) {}
}
function tag_read(hextag) {
	var tag = '';
	var pos = 0;
	for (var i = 0; i < hextag.length; i += 2) {
		try {
			var hexnum = hextag.substr(i, 2);
			var num = parseInt(hexnum, 16);
			if (isNaN(num)) {
				num = 0x20;
			}
		} catch(e){}
		tag += String.fromCharCode(num);
	}
	return tag;
}
function tagRender(n) {
	
	if (n < 0 || n > (window.top.remotesNr+window.top.expansorNr))
		return;
	if (n==0)
		setTag(0, tags[0]);
	else 
	{
		if (n<=window.top.expansorNr)
		{
			//representar tag expansores
		}
		else
		{
			var k = getRemoteIndex(n-window.top.expansorNr, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
			
			if (window.top.master_rx_loss_alarm[n-window.top.expansorNr]) {
				setTag(n-window.top.expansorNr, tags[k+window.top.MaxExpansorNr]+"&nbsp;DISCONNECTED");
			} else {
				setTag(n-window.top.expansorNr, tags[k+window.top.MaxExpansorNr]);
			}
		}
	}
}
function tagsRender() {
	for (var n = 0; n <= (window.top.remotesNr+window.top.expansorNr); ++n) {
		tagRender(n);
	}
}

function parseFiberMask(serverResponse){
	var fmask = new Array();
	var confstrs = serverResponse.split("\t");
	var k;
	for (k=1;k<confstrs.length-1;k++)
		fmask[k]=parseInt(confstrs[k].substr(-6, 2).substr(0,2),16);
	return fmask;
}

function parseMode(serverResponse){
	var fmode = new Array();
	var confstrs = serverResponse.split("\t");
	var k;
	for (k=1;k<confstrs.length-1;k++)
		fmode[k]=parseInt(confstrs[k].substr(8, 2),16) & 0x8;
	return fmode;
}

function parseNFPAMonitor(serverResponse){
	var nfpa = new Array();
	var confstrs = serverResponse.split("\t");
	var k;
	nfpa[0]=parseInt(confstrs[0].substr(14, 2),16) & 0x80;
	for (k=1;k<confstrs.length-1;k++)
		nfpa[k]=parseInt(confstrs[k].substr(6, 2),16) & 0x2;
	return nfpa;	
}
function parseAllowDisFilt(serverResponse) {
	var adf = [];
	var confstrs = serverResponse.split("\t");
	for (var k=1; k < confstrs.length-1; k++) {
		var allow = (parseInt(confstrs[k].substr(6, 2),16) & 0x4) == 0;
		adf.push(allow);
	}
	return adf;
}
function parseLinkedFreq(serverResponse){
	var confstrs = serverResponse.split("\t");
	if (parseInt(confstrs[0].substr(14, 2),16) & 0x40)
		return false;
	else
		return true;
}
function parseNumFiberRemote(serverResponse){
	var nfiber = new Array();
	var statstrs = serverResponse.split("\t");
	var k;
	var num;
	try {
	num = parseInt(statstrs[0].substr(388, 2),16) & 0x3f;
	for (k=0;k<window.top.expansorNr;k++)
		num += (parseInt(statstrs[1+k].substr(232, 2),16) & 0x3f)<<(6*(k+1));
	for (k=1;k<=window.top.MaxRemotesNr;k++)
		nfiber[k]=((num & (1<<(k-1)))==0)?1:2;
	return nfiber;
	} catch (err) {
		return nfiber;
	}
}
function isFiberRedunded(nr){
	try{
		var	nremote = (window.top.redundedFiberRemotes[nr].toString()).split("-");
		if (nremote.length==1)
			return false;
		else
			return true;
	} catch (err) {}
}

function linkActiveRedunded(nr){
	var rxloss = window.top.master_rx_loss_alarm.slice(0);
	var	nremote = (window.top.redundedFiberRemotes[nr].toString()).split("-");
	if (isFiberRedunded(nr)){
		if ((rxloss[nremote[0]]) && (!rxloss[nremote[1]]))
			return nremote[1];
		else
			return nremote[0];
	}
	else
		return nr;
	
}
function getRedundedFiberRemotes(isIndex){
	var ne = getExpansorsNrFromConf(window.top.fiplexConfStr);
	var nr = getRemotesNrFromConf(window.top.fiplexConfStr,window.top.MaxRemotesNr);
	var n,idx,i,sercomp,icomp;
	var serialstrs = (window.top.fiplexSerialStr).split("\t");
	var serials = new Array();
	var redundedFiberRemotes = new Array();
	window.top.remotesBitmask = parseRemotesBitmaskFromConf(window.top.fiplexConfStr);
	for (n=1;n<=nr;n++){
		if ((n+ne)<serialstrs.length)
			serials[n]=serialstrs[n+ne].substr(4,serialstrs[n+ne].length-4);
		else
			serials[n]="";
	}
	for (n=1;n<=nr;n++)
	{
		idx = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		if (serials[n].trim().length==0)
			redundedFiberRemotes[n]=(isIndex)?idx:n;
		else{
			sercomp = serials[n];
			icomp=0;
			for (i=1;i<=nr;i++){ 
				if (i!=n){
					if ((serials[i]==sercomp)&&((serials[i].length*sercomp.length)!=0)) icomp = i;
				}
			}
			if (icomp>0){
				if (isIndex){
					icomp = getRemoteIndex(icomp, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
					redundedFiberRemotes[n]=(icomp<idx)?icomp+"-"+idx:idx+"-"+icomp;
				}
				else
					redundedFiberRemotes[n]=(icomp<n)?icomp+"-"+n:n+"-"+icomp;
			}
			else
				redundedFiberRemotes[n]=(isIndex)?idx:n;
		}		
	}
	return redundedFiberRemotes;
}

function Delays() {
	this.parse = function(sr) {
		var arr;
		try {
			arr = sr.split('\t');
			if (arr.length < window.top.MaxRemotesNr) {
				this.isCapable = false;
				return;
			}
		} catch(err) { this.isCapable = false; }
		this.isCapable = true;
		this.delays = [];
		for (var i = 0; i < arr.length && i < window.top.MaxRemotesNr; ++i) {
			try {
				if (arr[i].length != 8) {
					this.delays.push({
						nr: i,
						isCapable: false, 
						isTimeout: false,
						value: 0 });
					continue;
				}
				var val = parseInt(arr[i].substr(-4), 16);
				var cap = (val != 0xFFFF);
				var tm = (val >= 0x1FFF);
				this.delays.push({
					nr: i,
					isCapable: cap, 
					isTimeout: tm,
					value: val });
			} catch(err) {
				this.delays.push({
					nr: i,
					isCapable: false, 
					isTimeout: false,
					value: 0 });
			}
		}
	}
	this.isMasterCapable = function() {
		try {
			return this.isCapable;
		} catch(e) { return false; }
	}
	this.isRemoteCapable = function(n) {
		try {
			return this.delays[n].isCapable;
		} catch(e) { return false; }
	}
	this.isRemoteTimeout = function(n) {
		try {
			return this.delays[n].isTimeout;
		} catch(e) { return false; }
	}
	this.getValue = function(nr) {
		try {
			var c = this.delays[nr].value - this.MINCOUNT;
			if (c < 0) {
				c = 0;
			}
			var res = 2.0e6 / (factory.data.fstep * factory.data.fmodulo);
			var del = c * res / 2;
			return del.toFixed(2);
		} catch(err) {return 0;}
	}
	this.isCapable = false;
	this.frame = "";
	this.delays = [];
	this.MINCOUNT = 11;
}
// -->