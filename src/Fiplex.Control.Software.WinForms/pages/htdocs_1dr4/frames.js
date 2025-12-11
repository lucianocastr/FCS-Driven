var outputAttenuator = 0;
var sqThrULLims = {min: -110, max: -40};
var attOutLims = {min: 0, max: 30};
var fineGainLims = {min: -40, max: 0};
var delayLims = {min: 0, max: 200};
var filtEnabled;
var foDataLimitsAlarm = {
	temperature: 	{min: -45,	max: 90	},
	voltage: 	{min: 2.7, 	max: 3.8},
	bias: 		{min: 0, 	max: 100},
	txpow: 		{min: -6, 	max: 8	},
	rxpow: 		{min: -29.5, 	max: 4.5}
}
var foDataLimitsWarning = {
	temperature: 	{min: -40,	max: 85	},
	voltage: 	{min: 2.8, 	max: 3.7},
	bias: 		{min: 0.1, 	max: 90	},
	txpow: 		{min: -5, 	max: 7	},
	rxpow: 		{min: -24.5, 	max: 2.5}
}

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
	var nfib;
	var bitmask;
	shift=0;
	bitmask = parseInt(serverResponse.substr(shift,2),16);
	ovfHpaLedSet(1, (bitmask & 0x01)?  "red" : "grey");
	tempHpaLedSet(1, (bitmask & 0x02)? "red" : "grey");
	enHpaLedSet(1, (bitmask & 0x20)? "green" : "red");
	if (window.top.NFPAMonitor==0) bitmask &= 0x03;
	vswrHpaLedSet(1, (bitmask & 0x04)?  "red" : "grey");
	statHpaLedSet(1, (bitmask & 0x10)?  "red" : "grey");
	statPAFailLedSet(1, (bitmask & 0x80)?  "red" : "grey");
	txLowHpaLedSet(1, (bitmask & 0x08)?  "red" : "grey");
	var fipCommErr = (bitmask & 0x10) != 0;
	shift+=2;
	shift+=4;
	num = parseInt(serverResponse.substr(12,2),16);
	if ((window.top.FiberMask==3) ){//&& (window.top.Mode==0)
		var lnk = (num & 0x01);
		if (lnk == 0) {
			optActiveLinkSet("green","grey");
		} else {
			optActiveLinkSet("grey","green");
		}
	}
	var doorOpenAlarm = (num & 0x04) != 0;
	var doorOpenCapable = (num & 0x08) != 0;
	var nfpa = (window.top.NFPAMonitor != 0);
	doorOpenLedSet(nfpa, fipCommErr, doorOpenCapable, doorOpenAlarm);
	shift=36;
	for (nfib=1;nfib<=2;nfib++)
	{
		bitmask = parseInt(serverResponse.substr(shift,2),16);
		shift+=2;
		num  =  parseInt(serverResponse.substr(shift,4),16);
		optErrorsSet(nfib, num);
		warning = false;
		alarm = false;
		shift-=24;
		temp = to_float(parseInt(serverResponse.substr(shift,4),16));
		if ((temp < foDataLimitsAlarm.temperature.min) 
			|| (temp > foDataLimitsAlarm.temperature.max))
		{
			alarm = true;
		} else 	if ((temp < foDataLimitsWarning.temperature.min) 
			|| (temp > foDataLimitsWarning.temperature.max))
		{
			warning = true;
 		}
		shift+=4;
		volt = parseInt(serverResponse.substr(shift,4),16) / 10000;
		if ((volt < foDataLimitsAlarm.voltage.min) 
			|| (volt > foDataLimitsAlarm.voltage.max))
		{
			alarm = true;
		} else if ((volt < foDataLimitsWarning.voltage.min) 
			|| (volt > foDataLimitsWarning.voltage.max))
		{
			warning = true;
 		}
		shift+=4;
		bias = parseInt(serverResponse.substr(shift,4),16) / 500;
		if ((bias < foDataLimitsAlarm.bias.min) 
			|| (bias > foDataLimitsAlarm.bias.max))
		{
			alarm = true;
		} else if ((bias < foDataLimitsWarning.bias.min) 
			|| (bias > foDataLimitsWarning.bias.max))
		{
			warning = true;
 		}
		shift+=4;
		txpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		if ((txpow < foDataLimitsAlarm.txpow.min) 
			|| (txpow > foDataLimitsAlarm.txpow.max))
		{
			alarm = true;
		} else if ((txpow < foDataLimitsWarning.txpow.min) 
			|| (txpow > foDataLimitsWarning.txpow.max))
		{
			warning = true;
 		}
		//fiberPowerOutSet(nfib, txpow);
		shift+=4;
		rxpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		if (rxpow > foDataLimitsAlarm.rxpow.max) {
			alarm = true;
		}
		fiberPowerSet(nfib, rxpow);
		shift+=4;
		sfpalarm = parseInt(serverResponse.substr(shift,2),16);
		shift+=2;
		gtpalarm = parseInt(serverResponse.substr(shift,2),16);
		if ((sfpalarm & 0x01) != 0) {
			alarm = true;
		}
		if ((gtpalarm & 0x01) != 0) {
			alarm = true;
		}
		optStatusLedSet(nfib, alarm? "red" : (warning? "yellow" : "green"));
		warning = false;
		alarm = false;
		
		var s = (nfib == 1 ? 36 : 64);
		var v = parseInt(serverResponse.substr(s, 2), 16);
		alarm  = ((v & 0x10) != 0);
		optRxLedSet(nfib, alarm? "red": "green");
		alarm = ((v & 0x0E) != 0);
		optRxCommLedSet(nfib, alarm? "red": "green");
		shift+=28;
	}
	shift=70;
	bitmask = parseInt(serverResponse.substr(shift,2),16);
	signal_ovf = bitmask & 0x01;
	color = signal_ovf ? "red" : "grey";
	ovfLedSet(1, color);
	shift+=2;
	num = cSignedByte(parseInt(serverResponse.substr(shift,2),16));
	if (signal_ovf)
		rfInPowSet(1, num, "#df4040");
	else
		rfInPowSet(1, num);	
	fpgaAlarm = bitmask & 0x02;
	fpgaLedSet(1, fpgaAlarm ?  "red" : "grey");
	tempAlarm = bitmask & 0x04;
	boardTempLedSet(1, tempAlarm ?  "red" : "grey");
	num = to_float(parseInt(serverResponse.substr(2,4),16));
	boardTempSet(1, num, tempAlarm);
	var dlPwrAlarm = (bitmask & 0x08) != 0;
	dlPwrAlrmLedSet(dlPwrAlarm);
	var rfOutPower = to_float(parseInt(serverResponse.substr(6,4),16));
	rfOutPowSet(1, rfOutPower, dlPwrAlarm);
	shift+=2;
	num = cSignedByte(parseInt(serverResponse.substr(74,2),16));
	if (rfOutPower == -128) {
		agcSet("---");
	} else {
		agcSet(num);
	}
	var chEnMask = 0;
	var sqEn = 0;
	if (typeof(confStr) !== "undefined" && confStr.length == 97*2) {
		chEnMask = parseChannelsEnabled(confStr);
		sqEn = parseSQEnabled(confStr);
	}
	for (var ch = 1, shift_ch = 76, mask = 1; ch <= ch_nr; ch++) {
		var n=1;
		bitmask = parseInt(serverResponse.substr(shift_ch,2),16);
		shift_ch += 2;
		signal_in = (bitmask & 0x80) != 0;
		var persistAlarm = (bitmask & 0x40) != 0;
		var ch_ovl = bitmask & 0x01;
		num = cSignedByte(parseInt(serverResponse.substr(shift_ch,2),16));
		shift_ch += 2;
		ch_disabled = !(chEnMask & mask);
		mask <<= 1;
		if (signal_in && !ch_disabled) {
			chSignalLedSet(ch, n, persistAlarm ? "red" : "green");
			if (ch_ovl) {
				chPowerSet(ch, n, num, "#df4040");
			} else {
				chPowerSet(ch, n, num);
			}
		} else {
			chSignalLedSet(ch, n, "grey");
			chPowerSet(ch, n, num, "#bbbbbb");
		}
		num = cSignedByte(parseInt(serverResponse.substr(shift_ch,2),16));
		if (!filtEnabled || ch_disabled) {
			chAgcSet(ch, n, "--", "#bbbbbb");
		} else {
			chAgcSet(ch,n,!signal_in&&sqEn?0:num);
		}
		shift_ch += 2;	//AGC
	}
	bitmask = parseInt(serverResponse.substr(70, 2), 16);
	for (var i = 0, mask = 0x40; i < 2; ++i, mask <<= 1) {
		try {
			var sr = serverResponse.substr(220 + i*4, 4);
			var pla = to_float(parseInt(sr, 16));
			var alrm = (bitmask & mask) != 0;
			plaSet(i, pla, alrm);
		} catch(e) {}
	}
	var tdif = 0;
	try {
		tdif = parseInt(serverResponse.substr(228, 4), 16);
	} catch(e) {}
	plaTimeSet(tdif);
}

function parse_config(serverResponse) {
	var n, shift, shift_n, bitmask, nfr, bw, fr, gain, num, attout_g, attout;
	var ch_nr = window.top.MaxChNr;
	var channel = new Array();
	bitmask = parseInt(serverResponse.substr(2,2),16);
	hpaSwSet(1, bitmask & 0x01);
	var mb = (bitmask & 0x40) != 0;
	var forceBackup = (bitmask & 0x80) != 0;
	setMainBackupCtrl(mb);
	setForceBackup(forceBackup);
	bitmask = parseInt(serverResponse.substr(4,2),16);
	var delayEnabled = false;
	delayEnabled = (bitmask & 0x20)!=0;
	gdEnSet(delayEnabled);
	filtEnableSet(1, !(bitmask & 0x02));
	plaEnableSet(bitmask & 0x04);
	filtEnabled = !(bitmask & 0x02);
	filtSqEnSet(1, bitmask & 0x10);
	simplexEnSet(bitmask & 0x40);
	//setRemoteMode(window.top.Mode);
	gain = parseInt(serverResponse.substr(6,2),16);
	if (isNaN(gain)) {
		gain = 0;
	} 
	gain = cSignedByte(gain);
	attout = parseInt(serverResponse.substr(8,2),16);
	if (isNaN(attout)) {
		attout = 0;
	}
	outputAttenuator = attout;
	attout_g = attout - gain + 3;
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
		gain = parseInt(serverResponse.substr(shift,2),16);
		if (isNaN(gain)) {
			gain = 0;
		}
		gain = cSignedByte(gain);
		shift += 2;
		chFineGainSet(ch, 1, gain);
	}
	var stbychannels = parseInt(serverResponse.substr(shift,6),16);
	shift += 6;
	for (var ch = 1, mask = 1; ch <= ch_nr; ++ch) {
		chEnableSet(ch, 1, !(stbychannels & mask));
		mask <<= 1;
	}
	for (ch=0;ch<4;ch++)
	{
		num = parseInt(serverResponse.substr(shift,4),16);
		shift += 4;
		delaySet((ch % 2), Math.floor(ch/2), num/10);
	}
	var persistTime = parseInt(serverResponse.substr(shift, 4), 16);
	shift += 4;
	persistTimeSet(1, persistTime);
	var plaPeriod = parseInt(serverResponse.substr(shift, 4), 16);
	shift += 4;
	setPlaPeriod(plaPeriod);
}
function parseChFreq(data) {
	var num = data >> 3;
	if (data & 0x8000)
		num |= 0xE000;
	var nfr = num < 32768 ? num : num - 65536;
	var fr = nfr * factory.data.fstep + factory.data.band[0].fo; 
	return fr;
}
function parseFiberMask(serverResponse){
	return parseInt(serverResponse.substr(190,2),16);
}

function parseMode(serverResponse){
	return (parseInt(serverResponse.substr(4,2),16) & 0x08);
}

function parseNFPAMonitor(serverResponse){
	return (parseInt(serverResponse.substr(2,2),16) & 0x02);
}

function parseSQEnabled(serverResponse){
	try{
		var num = parseInt(serverResponse.substr(4,2),16);
		return (num&0x10?1:0);
	}catch (err) {
		return 0;
	}
}
function parseChannelsEnabled(serverResponse) {
	var ch_nr = window.top.MaxChNr;
	var chMask = 0;
	var remoteShift = 78*2;
	var num;
	num = parseInt(serverResponse.substr(remoteShift,6),16);
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
	var currBitmask = parseInt(currentConfigFrm.substr(configFrm.length, 2), 16);
	var mbCtrl = readMainBackupCtrl();
	if (mbCtrl < 0) {
		bitmask |= currBitmask & 0x40;
	} else if (mbCtrl == 1) {
		bitmask |= 0x40;
	}
	var fbak = readForceBackup();
	if (fbak === -1) {
		bitmask |= currBitmask & 0x80;
	} else if (fbak) {
		bitmask |= 0x80;
	}
	bitmask |= currBitmask & 0x3E;
	configFrm = configFrm + hexformat(bitmask, 2);

	var currBitmask = parseInt(currentConfigFrm.substr(configFrm.length, 2), 16);
	bitmask = currBitmask & 0x81;
	if (!filtEnIsSet(1)) bitmask = 0x02;
	if (isPlaEnableSet()) bitmask |= 0x04;
	if (filtSqEnIsSet(1)) bitmask |= 0x10;
	//if (getRemoteMode()) bitmask |= 0x08;
	if (gdIsEnabled(n)) bitmask |= 0x20;
	if (simplexIsSet()) bitmask |= 0x40;
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
		attout = 0;
		gain = 3 - attout_g;
	} else if (attout_g <= 37) {
		gain = -3;
		attout = attout_g - 6;
	} else {
		if (attout_g > 40) {
			attout_g = 40;
			outputAttenuatorSet(1, attout_g);;
		}
		attout = 31;
		gain = 34 - attout_g;
	}
	gain = rSignedByte(gain);
	if (gain > 255)
		gain = 255;
	configFrm = configFrm + hexformat(gain, 2);
	configFrm = configFrm + hexformat(attout, 2);
	bitmask = filtSqThrGet(1);
	if (bitmask > sqThrULLims.max)
		bitmask = sqThrULLims.max;
	else if (bitmask < sqThrULLims.min)
		bitmask = sqThrULLims.min;	
	if (bitmask < 0)
		bitmask += 256;
	configFrm = configFrm + hexformat(bitmask, 2);	
	for (var ch = 1; ch <= window.top.MaxChNr; ++ch) {
		fr = chFrGet(ch, 1);
		bw = chBwGet(ch, 1);
		gain =chFineGainGet(ch, 1);
		if (isNaN(fr) || isNaN(bw) || isNaN(gain)) {
			configFrm += currentConfigFrm.substr(configFrm.length, 6);
			continue;
		}
		if (fr < factory.data.band[0].fStart) {
			fr = factory.data.band[0].fStart;
			chFrSet(ch,1,fr);
		}
		if (fr > factory.data.band[0].fStop) {
			fr = factory.data.band[0].fStop;
			chFrSet(ch,1,fr);
		}		
		var num = this.computeChNum(fr);
		if (num < 0)
			num += 65536;
		num <<= 3;
		num |= bw;
		configFrm += hexformat(num, 4);

		if (gain < fineGainLims.min)
			gain = fineGainLims.min;
		else if (gain > fineGainLims.max)
			gain = fineGainLims.max;		
		gain = rSignedByte(gain);
		if (gain > 255)
			gain = 255;
		configFrm = configFrm + hexformat(gain, 2);
	}
	var currentStbyCh = parseInt(currentConfigFrm.substr(configFrm.length, 6), 16);
	var stbychannels = 0;
	for (var ch = 1, mask = 1; ch <= window.top.MaxChNr; ++ch, mask <<= 1) {
		var isChSet = chEnableIsSet(ch, 1);
		if (isChSet == -1) {
			stbychannels |= (currentStbyCh & mask);
		} else if (!isChSet) {
			stbychannels |= mask;
		}
	}
	configFrm += hexformat(stbychannels, 6);
	var delay=0;
	for (ch=0;ch<4;ch++)
	{
		delay=delayGet((ch % 2),Math.floor(ch/2));
		if (delay == "undefined" || isNaN(delay)) {
			configFrm += currentConfigFrm.substr(configFrm.length, 4);
		} else {
			if (delay < delayLims.min) delay=delayLims.min;
			if (delay > delayLims.max) delay=delayLims.max;
			configFrm += hexformat(Math.round(delay*10),4);
		}
	}
	var t = persistTimeGet(1);
	if (t >= 0) {
		configFrm += hexformat(t, 4);
	} else {
		configFrm += currentConfigFrm.substr(configFrm.length, 4);
	}
	var p = getPlaPeriod();
	if (p >= 0) {
		configFrm += hexformat(p, 4);
	} else {
		configFrm += currentConfigFrm.substr(configFrm.length, 4);
	}
	configFrm += hexformat(0, 4);
	configFrm += currentConfigFrm.substr(configFrm.length, 2);
	configFrm += hexformat(0, 2);
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
	window.top.tag = name;
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

function formatClearCounters(currentConfigFrm) {
	var frm = "20"+currentConfigFrm.substr(2);
	return frm;
}

function formatUpdatePlaMeas(currentConfigFrm) {
	var frm = "40"+currentConfigFrm.substr(2);
	return frm;
}
