<!--
function Config(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'RESET':	0,
		'FRQOFFSET':	2,
		'FRQCH1':	4,
		'CTLGRL':	20,
		'BANDUP':	22,
		'CH1UP':	30,
		'BANDDN':	78,
		'CH1DN':	86,
		'HPA':		134,
		'NR':		136
	};
	this.bandAddrMap = {
		'CONTROL':	0,
		'SQTRHSLD':	2,
		'GAIN':		4,
		'POWER':	6
	};
	this.chAddrMap = {
		'CONTROL':	0,
		'GAIN':		2,
		'POWER':	4,
		'NR':		6
	};
	this.hpaAddrMap = {
		'CONTROL':	0
	};
	this.conf = {
		resets:	{
			fpgaReset: false,
			restoreIP: false,
			ethReset:  false,
			restoreModemCounter: false
		},
		freqOffset: 0,
		channel: [this.maxChannels],
		control: {
			tracking: false,
			muteMode: 0
		},
		band: [],
		fineRange: -10
	};
	for (var i = 0; i < 2; ++i) {
		this.conf.band.push({
			squelchEnable:	true,
			squelchThr: -100,
			squelchThrMin: i == 0? -110 : -90,
			squelchThrMax: i == 0? -70 : -40,
			mainGainMax: 88,
			mainGainMin: 60,
			mainGain: 88,
			mainPowerMax: i == 0? 18 : 36,
			mainPowerRange: 10,
			mainPower: i == 0? 18 : 36,
			ch: [],
			hpaEnable: false
		});
	}
	for (var i = 0; i < 2; ++i) {
		for (var j = 0; j < this.maxChannels; ++j) {
			this.conf.band[i].ch.push({
				enable: false,
				bandwidth: 0,
				fineGain: 0,
				finePower: 0
			});
		}
	}
	this.parse = function(sr) {
		try {
			if (sr.length < this.addrMap['NR']) {
				return;
			}
			this.parseFreqOffset(sr);
			for (var i = 0; i < this.maxChannels; ++i)
				this.parseChFreq(sr, i);
			this.parseCtrl(sr);
			for (var i = 0; i < 2; ++i) {
				this.parseBand(sr, i);
				for (var j = 0; j < this.maxChannels; ++j)
					this.parseChannel(sr, i, j);
			}
			this.parseHpa(sr);
		} catch (err) { }
	}
	this.parseFreqOffset = function(sr) {
		var n = this.addrMap['FRQOFFSET'];
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num))
			this.conf.freqOffset = num & 0x01;
	}
	this.parseChFreq = function(sr, ch) {
		var n = this.addrMap['FRQCH1'] + ch*2;
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num))
			this.conf.channel[ch] = num;
	}
	this.parseCtrl = function(sr) {
		var n = this.addrMap['CTLGRL'];
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num)) {
			this.conf.control.tracking = (num & 0x01) != 0;
			this.conf.control.muteMode = ((num >> 1) & 0x01);
		}
	}
	this.parseBand = function(sr, b) {
		var n, num;
		n = (b == 0 ? this.addrMap['BANDUP'] : this.addrMap['BANDDN']);
		num = parseInt(sr.substr(n + this.bandAddrMap['CONTROL'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].squelchEnable = (num & 0x10) != 0;
		num = parseInt(sr.substr(n + this.bandAddrMap['SQTRHSLD'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].squelchThr = cSignedByte(num);
		num = parseInt(sr.substr(n + this.bandAddrMap['GAIN'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].mainGain = cSignedByte(num);
		num = parseInt(sr.substr(n + this.bandAddrMap['POWER'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].mainPower = cSignedByte(num);
	}
	this.parseChannel = function(sr, b, c) {
		var n, num;
		n = (b == 0 ? this.addrMap['CH1UP'] : this.addrMap['CH1DN']);
		n += c * this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['CONTROL'], 2), 16);
		if (!isNaN(num)) {
			this.conf.band[b].ch[c].enable = (num & 0x40) == 0;
			this.conf.band[b].ch[c].bandwidth = (num & 0x03);
		}
		num = parseInt(sr.substr(n + this.chAddrMap['GAIN'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].ch[c].fineGain = cSignedByte(num);
		num = parseInt(sr.substr(n + this.chAddrMap['POWER'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].ch[c].finePower = cSignedByte(num);
	}
	this.parseHpa = function(sr) {
		var n, num;
		n = this.addrMap['HPA'];
		num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num)) {
			this.conf.band[0].hpaEnable = (num & 0x01) != 0;
			this.conf.band[1].hpaEnable = (num & 0x02) != 0;
		}
	}
	this.getChannelsEnabledMask = function() {
		var chMask = 0;
		for (var i = 0, mask = 1; i < this.maxChannels; ++i) {
			for (var j = 0; j < 2; ++j) {
				if (this.conf.band[j].ch[i].enable)
					chMask |= mask;
			}
			mask <<= 1;
		}
		return chMask;
	}
	this.render = function() {
		setChannelFreqOffset(this.conf.freqOffset);
		this.renderAllFreqs(this.conf.freqOffset);
		if (window.top.hasCancellation) {
			setTrackingEnable(this.conf.control.tracking);
			setMuteMode(this.conf.control.muteMode);
		}
		for (var i = 0; i < this.maxChannels; ++i) {
			var c = i + 1;
			chSwSet(c, this.conf.band[0].ch[i].enable && this.conf.band[1].ch[i].enable);
		}
		for (var i = 0; i < 2; ++i) {
			squelchEnSet(i, this.conf.band[i].squelchEnable);
			squelchThrSet(i, this.conf.band[i].squelchThr);
			mainGainLimSet(i, this.conf.band[i].mainGain);
			mainPowerLimSet(i, this.conf.band[i].mainPower);
			for (var j = 0; j < this.maxChannels; ++j) {
				var c = j + 1;
				chBwSet(c, i, this.conf.band[i].ch[j].bandwidth);
				fineGainLimSet(c, i, this.conf.band[i].ch[j].fineGain);
				finePowerLimSet(c, i, this.conf.band[i].ch[j].finePower);
			}
			hpaSwSet(i, this.conf.band[i].hpaEnable);
		}
	}
	this.renderAllFreqs = function(frqOffsetIndex) {
		for (var i = 0; i < this.maxChannels; ++i) {
			var num = this.conf.channel[i];
			num <<= 1;
			num |= frqOffsetIndex;
			var ch = i + 1;
			for (var j = 0; j < 2; ++j) {
				var fr = factory.data.band[j].frqBand + num * window.top.FreqStepHz * window.top.BandDirection[j];
				setFreqCh(ch, j, fr);
			}
		}
	}
	this.computeChNum = function(fr, b) {
		if (isNaN(fr)){
			return Number.NaN;
		}
		var num = Math.abs(fr - factory.data.band[b].frqBand) / window.top.FreqStepHz;
		num = Math.round(num);
		if (num > window.top.MaxChInBand) {
			return Number.NaN;
		}
		num &= ~1;
		num |= (getChannelFreqOffset() & 0x01);
		return num;
	}
	this.computeChFreq = function(num, b) {
		fr = factory.data.band[b].frqBand + num * window.top.FreqStepHz * window.top.BandDirection[b];
		return fr;
	}
	this.format = function(currentConfigFrm) {
		var frame = "00";
		var num = getChannelFreqOffset() & 0x01;
		var frqOffset = num;
		frame += hexformat(num, 2);
		for (var i = 1; i <= this.maxChannels; ++i) {
			var fr = getFreqCh(i, 1);
			num = this.computeChNum(fr, 1);
			if (isNaN(num)) {
				frame += currentConfigFrm.substr(frame.length, 2);
			} else {
				num >>= 1;
				frame += hexformat(num, 2);
			}
		}
		if (window.top.hasCancellation) {
			num = 0;
			if (isTrackingEnable())
				num |= 0x01;
			if (isMuteModeLinked())
				num |= 0x02;
			frame += hexformat(num, 2);
		} else {
			frame += currentConfigFrm.substr(frame.length, 2);
		}
		for (var i = 0; i < 2; ++i) {
			num = squelchEnIsSet(i) ? 0x10 : 0;
			frame += hexformat(num, 2);
			num = squelchThrGet(i);
			if (num > config.conf.band[i].squelchThrMax)
				num = config.conf.band[i].squelchThrMax;
			else if (num < config.conf.band[i].squelchThrMin)
				num = config.conf.band[i].squelchThrMin;
			num = rSignedByte(num);
			frame += hexformat(num, 2);
			num = mainGainLimGet(i);
			if (num > config.conf.band[i].mainGainMax)
				num = config.conf.band[i].mainGainMax;
			else if (num < config.conf.band[i].mainGainMin)
				num = config.conf.band[i].mainGainMin;
			num = rSignedByte(num);
			frame += hexformat(num, 2);
			num = mainPowerLimGet(i);
			if (num > config.conf.band[i].mainPowerMax)
				num = config.conf.band[i].mainPowerMax;
			else if (num < config.conf.band[i].mainPowerMax - config.conf.band[i].mainPowerRange)
				num = config.conf.band[i].mainPowerMax - config.conf.band[i].mainPowerRange;
			num = rSignedByte(num);
			frame += hexformat(num, 2);
			for (j = 1; j <= this.maxChannels; ++j) {
				var en = chIsOn(j);
				var bw = chBwGet(j, i);
				if (en == null || bw == null)
					frame += currentConfigFrm.substr(frame.length, 2);
				else {
					num = en ? 0 : 0x40;
					num |= (bw & 0x03);
					frame += hexformat(num, 2);
				}
				num = fineGainLimGet(j, i);
				if (num > 0)
					num = 0;
				else if (num < config.conf.fineRange)
					num = config.conf.fineRange;
				num = rSignedByte(num);
				frame += hexformat(num, 2);
				num = finePowerLimGet(j, i);
				if (num > 0)
					num = 0;
				else if (num < config.conf.fineRange)
					num = config.conf.fineRange;
				num = rSignedByte(num);
				frame += hexformat(num, 2);
			}
		}
		num = hpaIsOn(0) ? 1 : 0;
		num |= hpaIsOn(1) ? 2 : 0;
		frame += hexformat(num, 2);
		return frame;
	}
	this.doReset = function() {
		var frm = this.format(confStr);
		frm = "07"+frm.substr(2);
		doSubmit(frm);
	}
	this.doClearCancelCoefs = function(ch, dn) {
		var frm = format_config(confStr);
		var index = (dn == 0? this.addrMap['CH1UP'] : this.addrMap['CH1DN']);
		index += (ch - 1)*this.chAddrMap['NR'];
		var num = parseInt(frm.substr(index, 2), 16);
		num |= 0x20;
		frm = frm.substr(0, index) + hexformat(num, 2) + frm.substr(index+2);
		doSubmit(frm);
	}
}
// -->
