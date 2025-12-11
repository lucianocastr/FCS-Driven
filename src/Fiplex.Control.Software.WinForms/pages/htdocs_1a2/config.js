function Config(maxChNr) {
	this.maxChannels = maxChNr;
	this.addrMap = {
		'RESET':	0,
		'CTLGRL':	2,
		'BANDUP':	4,
		'CH1UP':	12,
		'BANDDN':	92,
		'CH1DN':	100,
		'NR':		180
	};
	this.bandAddrMap = {
		'CONTROL':	0,
		'SQTRHSLD':	2,
		'GAIN':		4,
		'POWER':	6
	};
	this.chAddrMap = {
		'FRQ': 		0,
		'CONTROL':	4,
		'GAIN':		6,
		'POWER':	8,
		'NR':		10
	};
	this.ctrlGrlBits = {
		'TRACKING': 	0x01,
		'MUTEMODE': 	0x02,
		'SPLIT': 	0x04
	};
	this.bandCtrlBits = {
		'FILTDIS': 	0x02,
		'SQEN': 	0x10,
		'HPAEN': 	0x80
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
		modsys: [this.maxChannels],
		control: {
			tracking: false,
			muteMode: 0,
			split: 0
		},
		band: [],
		fineGainRange: -40,
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
			mainPowerRange: 30,
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
			this.parseCtrl(sr);
			for (var i = 0; i < 2; ++i) {
				this.parseBand(sr, i);
				for (var j = 0; j < this.maxChannels; ++j)
					this.parseChannel(sr, i, j);
			}
		} catch (err) { }
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
			this.conf.control.tracking = (num & this.ctrlGrlBits['TRACKING']) ? 1 : 0;
			this.conf.control.muteMode = (num & this.ctrlGrlBits['MUTEMODE']) ? 1 : 0;
			this.conf.control.split = (num & this.ctrlGrlBits['SPLIT']) ? 1 : 0;
		}
	}
	this.parseBand = function(sr, b) {
		var n, num;
		n = (b == 0 ? this.addrMap['BANDUP'] : this.addrMap['BANDDN']);
		num = parseInt(sr.substr(n + this.bandAddrMap['CONTROL'], 2), 16);
		if (!isNaN(num)) {
			this.conf.band[b].squelchEnable = (num & this.bandCtrlBits['SQEN']) != 0;
			this.conf.band[b].hpaEnable = (num & this.bandCtrlBits['HPAEN']) != 0;
		}
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
		num = parseInt(sr.substr(n + this.chAddrMap['FRQ'], 4), 16);
		if (!isNaN(num)) {
			this.conf.band[b].ch[c].frqNr = (num < 32768 ? num : num - 65536);
		}
		num = parseInt(sr.substr(n + this.chAddrMap['CONTROL'], 2), 16);
		if (!isNaN(num)) {
			this.conf.band[b].ch[c].enable = (num & 0x40) == 0;
			this.conf.band[b].ch[c].bandwidth = (num & 0x07);
			if (b == 0) {
				this.conf.modsys[c] = num & 0x08;
			} else {
				this.conf.modsys[c] |= ((num & 0x38) >> 3);
			}
		}
		num = parseInt(sr.substr(n + this.chAddrMap['GAIN'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].ch[c].fineGain = cSignedByte(num);
		num = parseInt(sr.substr(n + this.chAddrMap['POWER'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].ch[c].finePower = cSignedByte(num);
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
		setTrackingEnable(this.conf.control.tracking);
		setMuteMode(this.conf.control.muteMode);
		setFreqSplit(this.conf.control.split);
		for (var i = 0; i < this.maxChannels; ++i) {
			var c = i + 1;
			chSwSet(c, this.conf.band[0].ch[i].enable && this.conf.band[1].ch[i].enable);
		}
		for (var i = 0; i < 2; ++i) {
			squelchEnSet(i, this.conf.band[i].squelchEnable, this.conf.control.tracking);
			hpaSwSet(i, this.conf.band[i].hpaEnable);
			squelchThrSet(i, this.conf.band[i].squelchThr);
			mainGainLimSet(i, this.conf.band[i].mainGain);
			mainPowerLimSet(i, this.conf.band[i].mainPower);
			for (var j = 0; j < this.maxChannels; ++j) {
				var c = j + 1;
				var fr = this.conf.band[i].ch[j].frqNr * factory.data.fstep + factory.data.band[i].fo;
				setFreqCh(c, i, fr);
				chBwSet(c, i, this.conf.band[i].ch[j].bandwidth);
				fineGainLimSet(c, i, this.conf.band[i].ch[j].fineGain);
				finePowerLimSet(c, i, this.conf.band[i].ch[j].finePower);
			}
		}
		for (var i = 0; i < this.maxChannels; ++i) {
			var ch = i + 1;
			setModsys(ch, this.conf.modsys[i]);
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
		var mode = isMuteModeLinked();
		if (mode == null) {
			mode = false;
		}
		var track = isTrackingEnable();
		if (track == null) {
			track = false;
		}
		num = mode? this.ctrlGrlBits['MUTEMODE'] : 0;
		num |= isFreqSplitFixed() ? 0 : this.ctrlGrlBits['SPLIT'];
		num |= track ? this.ctrlGrlBits['TRACKING'] : 0;
		frame += hexformat(num, 2);
		for (var i = 0; i < 2; ++i) {
			frame += this.formatBandCtrl(i);
			frame += this.formatSqThr(i);
			frame += this.formatMainGain(i);
			frame += this.formatMainPower(i);
			for (var j = 0; j < this.maxChannels; ++j) {
				var fr = this.formatFreq(i, j);
				frame += fr ? fr : currentConfigFrm.substr(frame.length, 4);
				frame += this.formatChCtrl(i, j);
				frame += this.formatFineGain(i, j);
				frame += this.formatFinePower(i, j);
			}
		}
		return frame;
	}
	this.formatBandCtrl = function(b) {
		var num = squelchEnIsSet(b) ? this.bandCtrlBits['SQEN'] : 0;
		num |= hpaIsOn(b) ? this.bandCtrlBits['HPAEN'] : 0;
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatSqThr = function(b) {
		var num = squelchThrGet(b);
		if (num > config.conf.band[b].squelchThrMax)
			num = config.conf.band[b].squelchThrMax;
		else if (num < config.conf.band[b].squelchThrMin)
			num = config.conf.band[b].squelchThrMin;
		num = rSignedByte(num);
		frame = hexformat(num, 2);
		return frame;
	}
	this.formatMainGain = function(b) {
		var num = mainGainLimGet(b);
		if (num > factory.data.band[b].gainLim)
			num = factory.data.band[b].gainLim;
		else if (num < config.conf.band[b].mainGainMin)
			num = config.conf.band[b].mainGainMin;
		num = rSignedByte(num);
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatMainPower = function(b) {
		var num = mainPowerLimGet(b);
		if (num > factory.data.band[b].powerLim)
			num = factory.data.band[b].powerLim;
		else if (num < factory.data.band[b].powerLim - config.conf.band[b].mainPowerRange)
			num = factory.data.band[b].powerLim - config.conf.band[b].mainPowerRange;
		num = rSignedByte(num);
		frame = hexformat(num, 2);
		return frame;
	}
	this.formatFreq = function(b, c) {
		var fr = getFreqCh(c + 1, b);
		if (fr < factory.data.band[b].fStart)
			fr = factory.data.band[b].fStart;
		else if (fr > factory.data.band[b].fStop)
			fr = factory.data.band[b].fStop;
		var num = this.computeChNum(fr, b);
		if (isNaN(num)) {
			return null;
		}
		if (num < 0)
			num += 65536;
		var frame = hexformat(num, 4);
		return frame;		
	}
	this.formatChCtrl = function(b, c) {
		var k = c + 1;
		var en = chIsOn(k);
		var bw = chBwGet(k, b);
		var modsys = getModsys(k);
		if (en == null)
			en = false;
		if (bw == null) 
			bw = 0;
		if (modsys == null)
			modsys = 0;
		var num = en ? 0 : 0x40;
		num |= (bw & 0x07);
		if (b == 0) {
			num |= (modsys & 0x08);
		} else {
			num |= ((modsys & 0x07) << 3);
		}
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatFineGain = function(b, c) {
		var num = fineGainLimGet(c + 1, b);
		if (num == null) {
			num = 0;
		}
		if (num > 0)
			num = 0;
		else if (num < config.conf.fineGainRange)
			num = config.conf.fineGainRange;
		num = rSignedByte(num);
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatFinePower = function(b, c) {
		var num = finePowerLimGet(c + 1, b);
		if (num == null) {
			num = 0;
		}
		if (num > 0)
			num = 0;
		else if (num < config.conf.fineGainRange)
			num = config.conf.fineGainRange;
		num = rSignedByte(num);
		var frame = hexformat(num, 2);
		return frame;
	}
}
