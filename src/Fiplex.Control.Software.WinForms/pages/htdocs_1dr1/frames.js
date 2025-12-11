<!--
var sqThrULLims = {min: -115, max: -70};
var attOutLims = {min: 0, max: 30};
var fineGainLims = {min: -5, max: 5};

function getRemoteIndex(nr, remotesNr, maxRemotesNr, remotesMask) {
	var index = 0;
	var mask = 1;
	for (var i = 0; i < nr && i < maxRemotesNr; ++i) {
		while ((mask & remotesMask) == 0) {
			mask <<= 1;
			if (++index > maxRemotesNr)
				break;
		}
		if (index > maxRemotesNr)
			break;
		mask <<= 1;
		index++;
	}
	if (index > maxRemotesNr || i != nr)
		index = nr;
	return index
}
function parse_status(serverResponse) {
	var shift, shift_ch, num, volt, bias, txpow, rxpow, warning, alarm, temp;
	var signal_downlink, signal_in, signal_ovf, ch_disabled, fpgaAlarm, tempAlarm;
	var ch_nr = window.top.MaxChNr;
	var bitmask;
	bitmask = parseInt(serverResponse.substr(0,2),16);
	
	tempHpaLedSet(1, (bitmask & 0x02)? "red" : "grey");
	enHpaLedSet(1, (bitmask & 0x20)? "green" : "red");
	num = to_float(parseInt(serverResponse.substr(2,4),16));
	boardTempSet(1, num);
	shift_ch += 4;
	num = to_float(parseInt(serverResponse.substr(6,4),16));
	ovfHpaLedSet(1, (num>43)?  "red" : "grey");
	rfOutPowSet(1, num);	
	bitmask = parseInt(serverResponse.substr(32,2),16);
	optFrSyncLedSet(1, (bitmask & 0x08)? "red":"green");
	num  =  parseInt(serverResponse.substr(34,4),16);
	optErrorsSet(1, true, num);
	warning = false;
	alarm = false;
	temp = to_float(parseInt(serverResponse.substr(10,4),16)).toFixed(1);
	if (temp > 75 || temp < -35) {
		if (temp > 85 || temp < -40) {
			alarm = true;
		} else {
			warning = true;
		}
	}
	volt = parseInt(serverResponse.substr(14,4),16) * 1e-4;
	if (volt > 3.5 || volt < 3.1) {
		if (volt > 3.6 || volt < 3.0) {
			alarm = true;
		} else {
			warning = true;
		}
	}
	bias = parseInt(serverResponse.substr(18,4),16) / 500;
	if (bias > 55 || bias < 7) {
		if (bias > 65 || bias < 5) {
			alarm = true;
		} else {
			warning = true;
		}
	}
	txpow = 10 * Math.log(parseInt(serverResponse.substr(22,4),16) + 1e-9) / Math.LN10 - 36;
	if (txpow > 6 || txpow < -5) {
		if (txpow > 7 || txpow < -6) {
			alarm = true;
		} else {
			warning = true;
		}
	}
	rxpow = 10 * Math.log(parseInt(serverResponse.substr(26,4),16) + 1e-9) / Math.LN10 - 40;
	fiberPowerSet(1, true, rxpow);
	sfpalarm = parseInt(serverResponse.substr(30,2),16);
	gtpalarm = parseInt(serverResponse.substr(32,2),16);
	if ((sfpalarm & 0x05) != 0) {
		alarm = true;
	}
	if ((gtpalarm & 0x01) != 0) {
		alarm = true;
	}	
	optStatusLedSet(1, true, alarm? "red" : (warning? "yellow" : "green"));
	warning = false;
	alarm = false;
	
	if ((sfpalarm & 0x02) != 0) {
		alarm = true;
	}
	if ((gtpalarm & 0x06) != 0) {
		alarm = true;
	}
	if (rxpow >= 1.5 || rxpow <= -24.5) {
		if (rxpow >= 3.5 || rxpow <= -29.5) {
			alarm = true;
		} else {
			warning = true;
		}
	}
	optRxLedSet(1, true, alarm? "red": (warning? "yellow" : "green"));
	bitmask = parseInt(serverResponse.substr(38,2),16);
	signal_ovf = bitmask & 0x01;
	color = signal_ovf ? "red" : "grey";
	ovfLedSet(1, color);
	num = to_float(parseInt(serverResponse.substr(40,4),16));
	if (signal_ovf)
		rfInPowSet(1, num, "#df4040");
	else
		rfInPowSet(1, num);	
	fpgaAlarm = bitmask & 0x02;
	tempAlarm = bitmask & 0x04;
	boardTempLedSet(1, tempAlarm ?  "red" : "grey");
	fpgaLedSet(1, fpgaAlarm ?  "red" : "grey");
	num = to_float(parseInt(serverResponse.substr(44,4),16));
	agcSet(num);
	var chEnMask = 0;
	if (typeof(confStr) !== "undefined" && confStr.length == 44*2) {
		chEnMask = parseChannelsEnabled(confStr);
	}
	for (var ch = 1, shift_ch = 48, mask = 1; ch <= ch_nr; ch++) {
		var n=1;
		bitmask = parseInt(serverResponse.substr(shift_ch,2),16);
		shift_ch += 2;
		signal_in = bitmask & 0x80;
		num = to_float(parseInt(serverResponse.substr(shift_ch,4),16));
		shift_ch += 4;
		ch_disabled = !(chEnMask & mask);
		mask <<= 1;
		if (signal_in && !ch_disabled) {
			chSignalLedSet(ch, n, "green");
			chPowerSet(ch, n, num);
		} else {
			chSignalLedSet(ch, n, "grey");
			chPowerSet(ch, n, num, "#bbbbbb");
		}
		num = to_float(parseInt(serverResponse.substr(shift_ch,4),16));
		chAgcSet(ch, n, num);
		shift_ch += 4;	//AGC
	}	
}
function parse_config(serverResponse) {
	var n, shift, shift_n, bitmask, nfr, bw, fr, gain, num, attout_g, attout;
	var ch_nr = window.top.MaxChNr;
	var channel = new Array();
	bitmask = parseInt(serverResponse.substr(2,2),16);
	hpaSwSet(1, bitmask & 0x01);	
	bitmask = parseInt(serverResponse.substr(4,2),16);
	filtEnableSet(1, !(bitmask & 0x02));
	filtSqEnSet(1, bitmask & 0x10);
	gain = 20*Math.log(parseInt(serverResponse.substr(6,2),16) / 128 + 1e-9) / Math.LN10;
	attout = parseInt(serverResponse.substr(8,2),16);
	attout_g = attout - gain + 3-8;
	if (attout_g < 0)
		attout_g = 0;
	outputAttenuatorSet(1, attout_g);
	bitmask = parseInt(serverResponse.substr(10,2),16);
	filtSqThrSet(1, (bitmask < 128) ? bitmask : bitmask - 256);
	for (var ch = 1 , shift = 12; ch <= ch_nr; ++ch) {
		var data = parseInt(serverResponse.substr(shift, 4), 16);
		shift += 4;
		if (!isNaN(data)) {
			fr = parseChFreq(data);
			chFrSet(ch, 1, fr);
			bw = data & 0x07;
			chBwSet(ch, 1, bw)
		}
		gain = 20*Math.log(parseInt(serverResponse.substr(shift,2),16) / 38 + 1e-9) / Math.LN10;
		shift += 2;
		chFineGainSet(ch, 1, gain);
	}
	var stbychannels = parseInt(serverResponse.substr(shift,4),16);
	shift += 4;
	for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
		chEnableSet(ch, 1, !(stbychannels & mask));
		mask <<= 1;
	}
}
function parseChFreq(data) {
	var num = data >> 3;
	if (data & 0x8000)
		num |= 0xE000;
	var nfr = num < 32768 ? num : num - 65536;
	var fr = nfr * factory.data.fstep + factory.data.band[0].fo; 
	return fr;
}
function parseChannelsEnabled(serverResponse, nr) {
	var ch_nr = window.top.MaxChNr;
	var chMask = 0;
	var remoteShift = 42*2;
	var num;
	num = parseInt(serverResponse.substr(remoteShift,4),16);
	for (var i = 0, mask = 1; i < ch_nr; ++i) {
		if (!(num & mask))
			chMask |= mask;
		mask <<= 1;
	}
	return chMask;
}
//argumento reset_nr < 0 o distinto de  1..4 para no hacer reset
function format_config(currentConfigFrm, reset_nr) {
	var configFrm, bitmask, nfr, fr, bw, stby, gain, n, attout_g, attout;
	var channel = new Array();
	bitmask = (reset_nr == 1)? 0x01 : 0;
	configFrm = hexformat(bitmask, 2);
	bitmask = (hpaIsOn(1) ? 0x01 : 0);
	configFrm = configFrm + hexformat(bitmask, 2);	
	bitmask = 0;
	if (!filtEnIsSet(1))
		bitmask = 0x02;
	if (filtSqEnIsSet(1))
		bitmask |= 0x10;
	configFrm = configFrm + hexformat(bitmask, 2);	
	attout_g = outputAttenuatorGet(1);
	if (attout_g < attOutLims.min) {
		attout_g = attOutLims.min;
		outputAttenuatorSet(n, attout_g);
	}
	if (attout_g > attOutLims.max) {
		attout_g = attOutLims.max;
		outputAttenuatorSet(n, attout_g);
	}
	if (attout_g <= 6) {
		attout = 8;
		gain = 3 - attout_g;
	} else if (attout_g <= 29) {
		gain = -3;
		attout = attout_g - 6+8;
	} else {

		attout = 31;
		gain = 34-8 - attout_g;
	}
	gain = Math.round(128 * Math.pow(10, gain/20));
	if (gain > 255)
		gain = 255;
	configFrm = configFrm + hexformat(gain, 2);
	configFrm = configFrm + hexformat(attout, 2);
	num = filtSqThrGet(1);
	if (num > sqThrULLims.max)
		num = sqThrULLims.max;
	else if (num < sqThrULLims.min)
		num = sqThrULLims.min;
	if (num < 0)
		num += 256;
	configFrm = configFrm + hexformat(num, 2);	
	for (var ch = 1; ch <= window.top.MaxChNr; ++ch) {
		fr = chFrGet(ch, 1);
		bw = chBwGet(ch, 1);
		if (isNaN(fr) || fr < factory.data.band[0].fStart) {
			fr = factory.data.band[0].fStart;
			chFrSet(ch,1,fr);
		}
		if (isNaN(fr) || fr > factory.data.band[0].fStop) {
			fr = factory.data.band[0].fStop;
			chFrSet(ch,1,fr);
		}		
		var num = this.computeChNum(fr);
		if (num < 0)
			num += 65536;
		num <<= 3;
		num |= bw;
		configFrm += hexformat(num, 4);
		gain =chFineGainGet(ch, 1);
		if (gain < fineGainLims.min)
			gain = fineGainLims.min;
		else if (gain > fineGainLims.max)
			gain = fineGainLims.max;
		gain = Math.round(38 * Math.pow(10, gain/20));
		if (gain > 255)
			gain = 255;
		configFrm = configFrm + hexformat(gain, 2);
	}
	var stbychannels = 0;
	for (var ch = 1, mask = 1; ch <= window.top.MaxChNr; ++ch) {
		var stby = !chEnableIsSet(ch, 1);
		if (stby) {
			stbychannels |= mask;
		}
		mask <<= 1;
	}
	configFrm += hexformat(stbychannels, 4);
	return configFrm;
}
function computeChNum(fr) {
	if (isNaN(fr)){
		return Number.NaN;
	}
	var num = (fr - factory.data.band[0].fo) / factory.data.fstep;
	num = Math.round(num);
	return ~~num;
}
function parse_tags(serverResponse) {
	var len = serverResponse.length;
	var TAGLEN = window.top.TAGLEN;
	if (len < 2*TAGLEN)
		return;
	var name = tag_read(serverResponse.substr(0, 2*TAGLEN))
	setTag(1, name);
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
// -->