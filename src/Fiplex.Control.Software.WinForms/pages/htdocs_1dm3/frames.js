<!--
var LIMIT_GAIN = [50, 80];
var sqThrDLLims = [ {min: -50, max: 0}, {min: -90, max: -40}];
var sqThrULLims = {min: -115, max: -70};
var attInLims = {min: 0, max: 30};
var attOutLims = [{min: 0, max: 50} , {min: 0, max: 30}];
var fineGainLims = {min: -5, max: 5};

var masterFpgaAlarm = false;
var reloadAgain = false;

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
	
	if (isFpgaAlarm(serverResponse))
		return -1;
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
	if (isFpgaAlarm(serverResponse))
		return -1;
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
function parse_status(serverResponse) {
	var shift, num, volt, bias, txpow, rxpow, warning, alarm, temp;
	var signal_downlink, signal_in, signal_ovf, ch_disabled, fpgaAlarm, tempAlarm;
	var ch_nr = window.top.MaxChNr;
	var remotesNr = window.top.remotesNr;
	var expansorNr = window.top.expansorNr;
	var current_rxloss = window.top.master_rx_loss_alarm.slice(0);
	var changedRxLossMask = 0;
	var bitmask, color;
	var statstrs = serverResponse.split("\t");
	var idx;
	var device;
	
	bitmask = parseInt(statstrs[0].substr(6,2),16);
	fpgaAlarm = bitmask & 0x02;
	tempAlarm = bitmask & 0x04;
	boardTempLedSet(0, tempAlarm ?  "red" : "grey");
	fpgaLedSet(0, fpgaAlarm ?  "red" : "grey");
	if (masterFpgaAlarm && !fpgaAlarm) {
		reloadAgain = true;
	}
	masterFpgaAlarm = fpgaAlarm;
	if (masterFpgaAlarm) {
		return;
	}
	if (typeof(window.top.remotesNr) == "undefined")
		remotesNr = getRemotesNrFromStatus(serverResponse);
	else
		remotesNr = window.top.remotesNr;
		
	if (typeof(window.top.expansorNr) == "undefined")
		expansorNr = getExpansorsNrFromStatus(serverResponse);
	else
		expansorNr = window.top.expansorNr;
	if (typeof(window.top.remotesBitmask) == "undefined")
		window.top.remotesBitmask = parseRemotesBitmaskFromStatus(serverResponse);
		
	if ((expansorNr+remotesNr)!=(statstrs.length-2))
	{
		return;	
	}		
	num = parseInt(statstrs[0].substr(4,2),16);
	num *= 256;
	var boardtemp = to_float(num);
	boardTempSet(0, boardtemp);
	num = to_float(parseInt(statstrs[0].substr(16,4),16));
	agcSet(num, 0);
	for (var n = 1; n <= remotesNr; n++) {
		shift = 42;
		bitmask = parseInt(statstrs[n+expansorNr].substr(shift,2),16);
		signal_ovf = bitmask & 0x01;
		color = signal_ovf ? "red" : "grey";
		ovfLedSet(n, color);
		fpgaAlarm = bitmask & 0x02;
		tempAlarm = bitmask & 0x04;
		boardTempLedSet(n, tempAlarm ?  "red" : "grey");
		num = to_float(parseInt(statstrs[n+expansorNr].substr(shift+2,4),16));
		if (signal_ovf)
			rfInPowSet(n, num, "#df4040");
		else
			rfInPowSet(n, num);
		num = to_float(parseInt(statstrs[n+expansorNr].substr(shift+6,4),16));
		agcSet(num, n);
	}
	signal_downlink = false;
	var chEnMask = 0;
	if (typeof(window.top.fiplexConfStr) !== "undefined") {
		chEnMask = parseChannelsEnabled(window.top.fiplexConfStr, 0);
	}
	for (var ch = 1, shift = 20, mask = 1; ch <= ch_nr; ++ch) {
		bitmask = parseInt(statstrs[0].substr(shift,2),16);
		shift += 2;
		signal_in = bitmask & 0x80;
		num = to_float(parseInt(statstrs[0].substr(shift,4),16));
		shift += 4;
		ch_disabled = !(chEnMask & mask);
		mask <<= 1;
		if (!ch_disabled && signal_in)
			signal_downlink = true;
		if (signal_in) {
			chSignalLedSet(ch, 0, "green");
			chPowerSet(ch, 0, num);
		} else if (ch_disabled) {
			chSignalLedSet(ch, 0, "grey");
			chPowerSet(ch, 0, num, "#bbbbbb");
		} else {
			chSignalLedSet(ch, 0, "yellow");
			chPowerSet(ch, 0, num, "#f1a165");
		}
		num = to_float(parseInt(statstrs[0].substr(shift,4),16));
		shift += 4;
	}
	bitmask = parseInt(statstrs[0].substr(6,2),16);
	signal_ovf = bitmask & 0x01;
	warning_ovf = bitmask & 0x08;
	color = signal_ovf ? "red" : (warning_ovf ? "yellow":"grey");
	ovfLedSet(0, color);
	fpgaAlarm = bitmask & 0x02;
	tempAlarm = bitmask & 0x04;
	boardTempLedSet(0, tempAlarm ?  "red" : "grey");
	fpgaLedSet(0, fpgaAlarm ?  "red" : "grey");
	num = to_float(parseInt(statstrs[0].substr(8,4),16));
	if (signal_ovf)
		rfInPowSet(0, num, "#df4040");
	else if (warning_ovf)
		rfInPowSet(0, num, "#f1a165");
	else if (!signal_downlink)
		rfInPowSet(0, num, "#f1a165");
	else
		rfInPowSet(0, num);
	num = to_float(parseInt(statstrs[0].substr(12,4),16));
	rfOutPowSet(0, num);
	tbsFailLedSet(signal_downlink ? "grey" : "red");
	for (var n = 1; n <= remotesNr; n++) {
		var chEnMask = 0;
		if (typeof(window.top.fiplexConfStr) !== "undefined") {
			chEnMask = parseChannelsEnabled(window.top.fiplexConfStr, n);
		}
		for (var ch = 1, shift = 52,mask = 1; ch <= ch_nr; ch++) {
			bitmask = parseInt(statstrs[n+expansorNr].substr(shift,2),16);
			shift += 2;
			signal_in = bitmask & 0x80;
			num = to_float(parseInt(statstrs[n+expansorNr].substr(shift,4),16));		
			shift += 4;
			ch_disabled = !(chEnMask & mask);
			mask <<= 1;
			if (signal_in && !ch_disabled) {
				chSignalLedSet(ch, n, "green");
				chPowerSet(ch, n, num);
			} else {
				chSignalLedSet(ch, n, "grey");
				chPowerSet(ch, n, num, "#bbbbbb");
			}
			num = to_float(parseInt(statstrs[n+expansorNr].substr(shift,4),16));
			chAgcSet(ch,n,num);
			shift += 4;
		}
	}

	for (var n = 1; n <= remotesNr+expansorNr; n++) { //n de 1 a remotesNr --> remotes, n de remotesNr a remotesNr+expansorNr -->expansores
		var isExpansor = (n>remotesNr);
		var ne = n-remotesNr;
		for (var k = 0; k < 2; k++) {
			var isRemote = (k > 0);
			
			warning = false;
			alarm = false;
			if (!isExpansor) 
			{
				idx = getRemoteIndex(n, remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
				if (k==0){
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
					device=expansorNr+n;
					shift = 14;
				}
			}
			else
			{
				if (k==0)
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
			
			//document.getElementById("dbg").value = document.getElementById("dbg").value + "k=" + k + "idx=" + idx + "device=" + device + "shift=" + shift+"\n";
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
			txpow = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 36;
			if (txpow > 6 || txpow < -5) {
				if (txpow > 7 || txpow < -6) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			shift += 4;
			rxpow = 10 * Math.log(parseInt(statstrs[device].substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
			fiberPowerSet(n, isRemote, rxpow);
			shift += 4;
			sfpalarm = parseInt(statstrs[device].substr(shift,2),16);
			shift += 2;
			gtpalarm = parseInt(statstrs[device].substr(shift,2),16);
			if ((sfpalarm & 0x05) || (gtpalarm & 0x01)) {
				alarm = true;
			}
			if (!isExpansor){
				optStatusLedSet(n, isRemote, alarm? "red" : (warning? "yellow" : "green"));
				if (k==0) optFrSyncLedSet(n, (gtpalarm & 0x08)? "red":"green");
			}
			warning = false;
			alarm = false;
			if ((sfpalarm & 0x02) || (gtpalarm & 0x0e)) {
				alarm = true;
			}
			if (rxpow >= 1.5 || rxpow <= -24.5) {
				if (rxpow >= 3.5 || rxpow <= -29.5) {
					alarm = true;
				} else {
					warning = true;
				}
			}
			
			if (!isRemote && !isExpansor) {
				window.top.master_rx_loss_alarm[n] = alarm;
				fiberLinkLedSet(n, alarm ? "red" : (warning? "yellow" : "green"));
				if (current_rxloss[n] != window.top.master_rx_loss_alarm[n]) {
					if (current_rxloss[n])
						changedRxLossMask = 1;
					else if (changedRxLossMask == 0)
						changedRxLossMask = -1;
				}
			}
			if (!isExpansor)
			{
				optRxLedSet(n, isRemote, alarm? "red": (warning? "yellow" : "green"));
				if (isRemote) {
					if (alarm)
						fiberLinkLedSet(n, "red");
					else if (warning && !window.top.master_rx_loss_alarm[n])
						fiberLinkLedSet(n, "yellow");
				}
				shift += 2;
				num  =  parseInt(statstrs[device].substr(shift,4),16);
				if (isRemote && window.top.master_rx_loss_alarm[n]) {
					optErrorsSet(n, isRemote, "invalid");
				} else {
					optErrorsSet(n, isRemote, num);
				}
			}
			else
				if (k==0) expansorLinkLedSet(ne,alarm? "red":(warning? "yellow" : "green"));
		}
	}
	for (var n = 1; n <= remotesNr; n++) {
		shift = 4;
		bitmask = parseInt(statstrs[n+expansorNr].substr(shift,2),16);
		enHpaLedSet(n, (bitmask & 0x20)? "green" : "red");
		shift += 2;
		num = to_float(parseInt(statstrs[n+expansorNr].substr(shift,4),16));
		boardTempSet(n, num);
		shift += 4;
		num = to_float(parseInt(statstrs[n+expansorNr].substr(shift,4),16));
		rfOutPowSet(n, num);
		ovfHpaLedSet(n, (num>43)?  "red" : "grey");
	}
	for (var n = 1; n <= remotesNr; n++) {
		var k = getRemoteIndex(n, window.top.remotesNr, window.top.MaxRemotesNr, window.top.remotesBitmask);
		if (window.top.master_rx_loss_alarm[n]) {
			setTag(n, tags[k+window.top.MaxExpansorNr]+"&nbsp;DISCONNECTED");
			optFrSyncLedSet(n, "grey");
			ovfLedSet(n, "grey") ;
			rfInPowSet(n, '---');
			for (ch = 1; ch <= ch_nr; ch++) {
				chPowerSet(ch, n, '---');
				chSignalLedSet(ch, n, "grey");
			}
			ovfHpaLedSet(n, "grey");
			enHpaLedSet(n, "grey");
			rfOutPowSet(n, '');
			optStatusLedSet(n, true, "grey");
			optRxLedSet(n, true, "grey");
			fiberPowerSet(n, true, '---', "#bbbbbb");
			fiberPowerSet(n, false, '---', "#bbbbbb");
			optFrSyncLedSet(n, "grey");
			boardTempSet(n, "---");
			remoteInputsDisableStateSet(n, true);
		} else {
			setTag(n, tags[k+window.top.MaxExpansorNr]);
		}
	}
	return changedRxLossMask;
}

function parse_config(serverResponse) {
	var n, shift, bitmask, nfr, bw, stby, fr, gain, num, attout_g, attout;
	var attin_down, attout_up, attout_down;
	var remotesNr = window.top.remotesNr;
	var ch_nr = window.top.MaxChNr;
	var channel = new Array();
	var confstrs = serverResponse.split("\t");
	//Master
	shift = 14;
	bitmask = parseInt(confstrs[0].substr(shift,2),16); //Filtering Enable, SQ Enable
	filtEnableSet(0, !(bitmask & 0x02));
	filtSqEnSet(0, bitmask & 0x10);
	shift += 2;
	gain = 20*Math.log(parseInt(confstrs[0].substr(shift,2),16) / 128 + 1e-9) / Math.LN10; //Main Gain
	shift += 2;
	attin_down = parseInt(confstrs[0].substr(shift,2),16);
	inputAttenuatorSet(0, attin_down);
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
		gain = 20*Math.log(parseInt(confstrs[0].substr(shift,2),16) / 38 + 1e-9) / Math.LN10;
		shift += 2;
		chFineGainSet(ch, 0, gain);
	}
	var stbychannels = parseInt(confstrs[0].substr(shift,4),16);
	for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
		chEnableSet(ch, 0, !(stbychannels & mask));
		mask <<= 1;
	}
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
		if (!window.top.master_rx_loss_alarm[n] && valid) filtEnableSet(n, !(bitmask & 0x02));
		if (!window.top.master_rx_loss_alarm[n] && valid) filtSqEnSet(n, bitmask & 0x10);
		shift += 2;
		gain = 20*Math.log(parseInt(confstrs[n].substr(shift,2),16) / 128 + 1e-9) / Math.LN10;
		shift += 2;
		attout = parseInt(confstrs[n].substr(shift,2),16);
		attout_g = attout - gain + 3 - 8;
		if (attout_g < 0)
			attout_g = 0;
		if (!window.top.master_rx_loss_alarm[n] && valid) outputAttenuatorSet(n, attout_g);
		attout_down = attout_g;
		var k = factory.data.uplinkCoupling == 1 ? 1 : 0;
		var limit_gain = LIMIT_GAIN[k];
		if (!window.top.master_rx_loss_alarm[n] && valid) gainULSet(n, limit_gain - attout_up);
		if (!window.top.master_rx_loss_alarm[n] && valid) gainDLSet(n, limit_gain - attin_down - attout_down);
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
				if (!window.top.master_rx_loss_alarm[n] && valid) chFrAlert(ch, n, true);
			} else {
				if (!window.top.master_rx_loss_alarm[n] && valid) chFrAlert(ch, n, false);
			}
			gain = 20*Math.log(parseInt(confstrs[n].substr(shift,2),16) / 38 + 1e-9) / Math.LN10;
			if (!window.top.master_rx_loss_alarm[n] && valid) chFineGainSet(ch, n, gain);
			shift += 2;
			filtEnAlert(n);
		}
		var stbychannels = parseInt(confstrs[n].substr(shift,4),16);
		shift += 4;
		for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
			if (valid) {
				chEnableSet(ch, n, !(stbychannels & mask));
				chEnableAlert(ch, n);
			}
			mask <<= 1;
			if (!chEnableIsSet(ch, n))
				chFrAlert(ch, n, false);
		}
	}
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
function parseChannelsEnabled(serverResponse, nr) {
	var confstrs = serverResponse.split("\t");
	var ch_nr = window.top.MaxChNr;
	var chMask = 0;
	var num ;
	if (confstrs.length<2) return 0;
	if (nr>confstrs.length-2) return 0;
	if (nr == 0) {
		num = parseInt(confstrs[0].substr(-6,4).substr(0,4),16);
		for (var i = 0, mask = 1; i < ch_nr; ++i) {
			if (!(num & mask))
				chMask |= mask;
			mask <<= 1;
		}
		return chMask;
	}
	
	var valid = parseInt(confstrs[nr].substr(-2,2),16) != 0;
	if (window.top.master_rx_loss_alarm.length < nr) {
		return 0;
	}
	if (window.top.master_rx_loss_alarm[nr] || !valid) {
		return 0;
	}
	num = parseInt(confstrs[nr].substr(-6,4).substr(0,4),16);
	for (var i = 0, mask = 1; i < ch_nr; ++i) {
		if (!(num & mask))
			chMask |= mask;
		mask <<= 1;
	}
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
		var subframe = format_unit(currentConfigFrm, channel, keepCh, n);
		if (compare_unit_conf(currentConfigFrm, subframe, n))
			continue;
		confFrames.push(subframe);
	}
}
function format_reset(currentConfigFrm, n) {
	var confstrs = currentConfigFrm.split("\t");
	if (n==0)
		subframe = confstrs[0].substr(0,12) + "01" + confstrs[0].substr(-88,88);
	else
		subframe = confstrs[n].substr(0,4) + "01" + confstrs[n].substr(-88,88);
	return subframe;
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
	configFrm += "00";
	if (getHiddenUnitState(n) || (n > 0 && window.top.master_rx_loss_alarm[n])) {
		configFrm += currSubfrm.substr(configFrm.length, currSubfrm.length - configFrm.length);
		return configFrm;
	}
	var bitmask=0, attout_g, attout, gain;
	if (n > 0) {
		if (hpaIsOn(n))
			bitmask = 0x01;
		configFrm += hexformat(bitmask, 2);
	}
	bitmask = 0x04;
	if (!filtEnIsSet(n))
		bitmask |= 0x02;
	if (filtSqEnIsSet(n))
		bitmask |= 0x10;
	configFrm += hexformat(bitmask, 2);
	attout_g = outputAttenuatorGet(n);
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
	var d = n == 0 ? 0 : 8;
	if (attout_g <= 6 ) {
		attout = d;
		gain = 3 - attout_g;
	} else if (attout_g <= 37 - d) {
		gain = -3;
		attout = attout_g - 6 + d;
	} else {
		if (attout_g > limit_gain) {
			attout_g = limit_gain;
			outputAttenuatorSet(n, attout_g);
		}
		attout = 31;
		gain = 34 - attout_g - d;
	}
	gain = Math.round(128 * Math.pow(10, gain/20));
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
		if (n == 0) {
			if (!(window.top.showChannelsBitmask & (1 << (ch-1)))) {
				keepCh[ch] = true;
				configFrm += currSubfrm.substr(configFrm.length, 6);
				continue;
			}
			var fr = chFrGet(ch, 0);
			if (isNaN(fr) || fr < factory.data.band[0].fStartDL || fr > factory.data.band[0].fStopDL) {
				keepCh[ch] = true;
				configFrm += currSubfrm.substr(configFrm.length, 6);
				continue;
			}
			num = this.computeChNum(fr, false);
			var c;
			/*for (c = 1; c < ch; ++c) {
				if (typeof(channel[c]) != "undefined" && num == channel[c])
					break;
			}*/
			if (c < ch && ch > 1) {
				keepCh[ch] = true;
				configFrm += currSubfrm.substr(configFrm.length, 6);
				continue;
			}
			keepCh[ch] = false;
			channel[ch] = num;
		} else {
			if (keepCh[ch]) {
				configFrm += currSubfrm.substr(configFrm.length, 6);
				continue;
			}
			num = computeChNrOtherBand(channel[ch], false);
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
		gain = Math.round(38 * Math.pow(10, gain/20));
		if (gain > 255)
			gain = 255;
		configFrm += hexformat(gain, 2);
	}
	var stbychannels = 0xF000;
	var currentStbyCh = parseInt(currSubfrm.substr(configFrm.length, 4), 16);
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
	configFrm += hexformat(stbychannels, 4);
	configFrm += currSubfrm.slice(-2);
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
	var TAGLEN = window.top.TAGLEN;
	var tagstrs;
	var n;
	tagstrs=tag_read(serverResponse);
	tagstrs = tagstrs.split("\t");
	//master
	//document.getElementById("dbg").value = tagstrs;
	tags[0] = (tagstrs[0].substr(-TAGLEN,TAGLEN));
	//expansores
	for (n=1; n<=window.top.expansorNr; ++n)
	{
		//if (parseInt(tagstrs[n].substr(2,2),16)==n)
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
}
function tag_read(hextag) {
	var tag = '';
	var pos = 0;
	for (var i = 0; i < hextag.length; i += 2) {
		var hexnum = hextag.substr(i, 2);
		var num = parseInt(hexnum, 16);
		if (isNaN(num))
			continue;
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
// -->