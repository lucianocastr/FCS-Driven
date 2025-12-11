<!--
function Config(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'RESET':	0,
		'FRQCH1':	2,
		'CTLGRL':	50,
		'BANDUP':	52,
		'CH1UP':	60,
		'BANDDN':	132,
		'CH1DN':	140,
		'HPA':		212,
		'NR':		214
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
		control: {
			muteMode: 0
		},
		band: [],
		fineGainRange: -80,
		finePowerRange: -10
	};
	for (var i = 0; i < 2; ++i) {
		this.conf.band.push({
			squelchEnable:	true,
			squelchThr: -100,
			squelchThrMin: i == 0? -110 : -90,
			squelchThrMax: i == 0? -70 : -40,
			mainGain: 88,
			mainGainMin: 60,
			mainPower: i == 0? 18 : 36,
			mainPowerRange: 10,
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
				finePower: 0,
				frqNr: 0
			});
		}
	}
	this.parse = function(sr) {
		try {
			if (sr.length < this.addrMap['NR']) {
				return;
			}
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
	this.parseChFreq = function(sr, c) {
		var n = this.addrMap['FRQCH1'] + c*4;
		var num = parseInt(sr.substr(n, 4), 16);
		if (!isNaN(num)) {
			this.conf.band[1].ch[c].frqNr = (num < 32768 ? num : num - 65536);
			this.conf.band[0].ch[c].frqNr = this.computeChNrOtherBand(this.conf.band[1].ch[c].frqNr, 1);
		}
	}
	this.computeChNrOtherBand = function(chNr, b) {
		var fr = this.computeChFreq(chNr, b);
		var diff = fr - factory.data.band[b].fStart;
		var a = (b + 1) % 2;
		fr = factory.data.band[a].fStart + diff;
		var num = this.computeChNum(fr, a);
		return num;
	}
	this.parseCtrl = function(sr) {
		var n = this.addrMap['CTLGRL'];
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num)) {
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
			this.conf.band[b].ch[c].bandwidth = (num & 0x07);
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
		this.renderAllFreqs();
		setMuteMode(this.conf.control.muteMode);
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
	this.renderAllFreqs = function() {
		for (var i = 0; i < this.maxChannels; ++i) {
			var ch = i + 1;
			for (var j = 0; j < 2; ++j) {
				var fr = this.conf.band[j].ch[i].frqNr * factory.data.fstep + factory.data.band[j].fo; 
				setFreqCh(ch, j, fr);
			}
		}
	}
	this.computeChNum = function(fr, b) {
		if (isNaN(fr)){
			return Number.NaN;
		}
		var num = (fr - factory.data.band[b].fo) / factory.data.fstep;
		return ~~Math.round(num);
	}
	this.computeChFreq = function(num, b) {
		var fr = num * factory.data.fstep + factory.data.band[b].fo;
		return fr;
	}
	this.indexOfChannel = function(b, num) {
		var chIdx = new Array();
		for (var i = 0; i < this.maxChannels; ++i) {
			if (this.conf.band[b].ch[i].frqNr == num)
				chIdx.push(i);
		}
		return chIdx;
	}
	this.isChannelOnAndActive = function(b, c, signalIn) {
		if (c < 0 || c > this.maxChannels)
			return false;
		if (!config.conf.band[b].ch[c].enable)
			return false;
		if (!signalIn) {
			if (config.conf.band[b].squelchEnable || config.conf.control.tracking)
				return false;
		}
		return true;
	}
	this.format = function(currentConfigFrm) {
		var frame = "00";
		var num;
		for (var i = 1; i <= this.maxChannels; ++i) {
			var fr = getFreqCh(i, 1);
			if (fr < factory.data.band[1].fStart)
				fr = factory.data.band[1].fStart;
			else if (fr > factory.data.band[1].fStop)
				fr = factory.data.band[1].fStop;
			num = this.computeChNum(fr, 1);
			if (isNaN(num)) {
				frame += currentConfigFrm.substr(frame.length, 4);
			} else {
				if (num < 0)
					num += 65536;
				frame += hexformat(num, 4);
			}
		}
		var mode = isMuteModeLinked();
		if (mode == null) {
			mode = false;
		}
		num = mode? 0x02 : 0;
		frame += hexformat(num, 2);
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
			if (num > factory.data.band[i].gainLim)
				num = factory.data.band[i].gainLim;
			else if (num < config.conf.band[i].mainGainMin)
				num = config.conf.band[i].mainGainMin;
			num = rSignedByte(num);
			frame += hexformat(num, 2);
			num = mainPowerLimGet(i);
			if (num > factory.data.band[i].powerLim)
				num = factory.data.band[i].powerLim;
			else if (num < factory.data.band[i].powerLim - config.conf.band[i].mainPowerRange)
				num = factory.data.band[i].powerLim - config.conf.band[i].mainPowerRange;
			num = rSignedByte(num);
			frame += hexformat(num, 2);
			for (var j = 1; j <= this.maxChannels; ++j) {
				var en = chIsOn(j);
				var bw = chBwGet(j, i);
				if (en == null || bw == null) {
					en = false;
					bw = 0;
				}
				num = en ? 0 : 0x40;
				num |= (bw & 0x07);
				frame += hexformat(num, 2);
				num = fineGainLimGet(j, i);
				if (num == null) {
					num = 0;
				}
				if (num > 0)
					num = 0;
				else if (num < config.conf.fineGainRange)
					num = config.conf.fineGainRange;
				num = rSignedByte(num);
				frame += hexformat(num, 2);
				num = finePowerLimGet(j, i);
				if (num == null) {
					num = 0;
				}
				if (num > 0)
					num = 0;
				else if (num < config.conf.finePowerRange)
					num = config.conf.finePowerRange;
				num = rSignedByte(num);
				frame += hexformat(num, 2);
			}
		}
		num = hpaIsOn(0) ? 1 : 0;
		num |= hpaIsOn(1) ? 2 : 0;
		frame += hexformat(num, 2);
		return frame;
	}
}
// -->
