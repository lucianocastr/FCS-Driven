<!--
function Config() {
	this.bwType = 'undefined';
	this.addrMap = 'undefined';
	this.frameStr = '';
	this.addrMapSet = [{
		'RESET':	0,
		'CTLGRL':	2,
		'BANDUP':	4,
		'CH1UP':	12,
		'BANDDN':	108,
		'CH1DN':	116,
		'NR':		212
	}, {
		'RESET':	0,
		'CTLGRL':	2,
		'BANDUP':	4,
		'CH1UP':	12,
		'BW1UP': 	44,
		'BANDDN':	60,
		'CH1DN':	68,
		'BW1DN': 	100,
		'NR':		116		
	}];
	this.bandAddrMap = {
		'CONTROL':	0,
		'SQTRHSLD':	2,
		'GAIN':		4,
		'POWER':	6
	};
	this.maxChannelsSet = [12, 4];
	this.maxChannels = this.maxChannelsSet[0];
	this.bwVarStepHz = 	25000;
	this.bwVarMaxHz = 	18000000;
	this.chAddrMap = {
		'FRQ': 		0,
		'CONTROL':	4,
		'GAIN':		6,
		'NR':		8
	};
	this.hpaAddrMap = {
		'CONTROL':	0
	};
	this.ctrlGrlBits = {
		'MUTEMODE': 	0x02,
		'SPLIT': 	0x04,
		'BWVAR': 	0x08,
		'REVISION': 	0x10,
		'REVSWITCH': 	0x20
	};
	this.bandCtrlBits = {
		'FILTDIS': 	0x02,
		'SQEN': 	0x10,
		'HPAEN': 	0x80
	};
	this.conf = {
		resets:	{
			fpgaReset: false,
			restoreIP: false,
			ethReset:  false,
			restoreModemCounter: false
		},
		control: {
			muteMode: 0,
			split: 0,
			revision: 0
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
			mainPowerRange: 20,
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
				frqNr: 0,
				frqNrStop: 0
			});
		}
	}
	this.parse = function(sr) {
		try {
			var type = this.parseType(sr);
			if (type == 'undefined') {
				return;
			}
			if (sr.length < this.addrMapSet[type]['NR']) {
				return;
			}
			this.bwType = type;
			this.addrMap = this.addrMapSet[type];
			this.maxChannels = this.maxChannelsSet[type];
			this.parseCtrl(sr);
			for (var i = 0; i < 2; ++i) {
				this.parseBand(sr, i);
				for (var j = 0; j < this.maxChannels; ++j)
					this.parseChannel(sr, i, j);
			}
			this.frameStr = sr;
			this.setSqThrLims();
		} catch (err) { }
	}
	this.setSqThrLims = function() {
		for (var i = 0; i < 2; ++i) {
			if (factory.data.simplex) {
				this.conf.band[i].squelchThrMin = -100;
				this.conf.band[i].squelchThrMax = -40;
			} else {
				this.conf.band[i].squelchThrMin = i == 0? -110 : -90;
				this.conf.band[i].squelchThrMax = i == 0? -70 : -40;
			}
		}
	}
	this.parseType = function(sr) {
		try {
			var num = parseInt(sr.substr(this.addrMapSet[0]['CTLGRL'], 2), 16);
			if (isNaN(num)) {
				return 'undefined';
			}
			num = (num & this.ctrlGrlBits['BWVAR']) ? 1 : 0;
			return num;
		} catch (err) {return 'undefined';}
	}
	this.computeChNrOtherBand = function(chNr, b) {
		var fr = this.computeChFreq(chNr, b);
		var diff = fr - factory.data.band[b].fStart;
		var a = (b + 1) % 2;
		fr = factory.data.band[a].fStart + diff;
		var num = this.computeChNum(fr, a);
		return num;
	}
	this.computeFreqOtherBand = function(fr, b) {
		var diff = fr - factory.data.band[b].fStart;
		var a = (b + 1) % 2;
		fr = factory.data.band[a].fStart + diff;
		return fr;
	}
	this.parseCtrl = function(sr) {
		var n = this.addrMap['CTLGRL'];
		var num = parseInt(sr.substr(n, 2), 16);
		if (!isNaN(num)) {
			this.conf.control.muteMode = (num & this.ctrlGrlBits['MUTEMODE']) ? 1 : 0;
			this.conf.control.split = (num & this.ctrlGrlBits['SPLIT']) ? 1 : 0;
			this.conf.control.revision = (num & this.ctrlGrlBits['REVISION']) ? 1 : 0;
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
			this.conf.band[b].mainGain = num;
		num = parseInt(sr.substr(n + this.bandAddrMap['POWER'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].mainPower = cSignedByte(num);
	}
	this.parseChannel = function(sr, b, c) {
		var n, num, bw;
		n = (b == 0 ? this.addrMap['CH1UP'] : this.addrMap['CH1DN']);
		n += c * this.chAddrMap['NR'];
		num = parseInt(sr.substr(n + this.chAddrMap['FRQ'], 4), 16);
		if (!isNaN(num)) {
			this.conf.band[b].ch[c].frqNr = (num < 32768 ? num : num - 65536);
		}
		num = parseInt(sr.substr(n + this.chAddrMap['CONTROL'], 2), 16);
		if (!isNaN(num)) {
			this.conf.band[b].ch[c].enable = (num & 0x08) == 0;
			this.conf.band[b].ch[c].bandwidth = (num & 0x07);
			this.conf.band[b].ch[c].finePower = -((num >> 4) & 0x0F);
		}
		num = parseInt(sr.substr(n + this.chAddrMap['GAIN'], 2), 16);
		if (!isNaN(num))
			this.conf.band[b].ch[c].fineGain = cSignedByte(num);
		if (this.bwType == 1) {
			n = (b == 0 ? this.addrMap['BW1UP'] : this.addrMap['BW1DN']);
			n += c * 4;
			num = parseInt(sr.substr(n, 4), 16);
			if (!isNaN(num)) {
				this.conf.band[b].ch[c].frqNrStop = (num < 32768 ? num : num - 65536);
			}
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
		setMuteMode(this.conf.control.muteMode);
		setFreqSplit(this.conf.control.split);
		page.setFwRev(this.conf.control.revision);
		for (var i = 0; i < this.maxChannels; ++i) {
			var c = i + 1;
			chSwSet(c, this.conf.band[0].ch[i].enable && this.conf.band[1].ch[i].enable);
		}
		for (var i = 0; i < 2; ++i) {
			squelchEnSet(i, this.conf.band[i].squelchEnable);
			hpaSwSet(i, this.conf.band[i].hpaEnable);
			squelchThrSet(i, this.conf.band[i].squelchThr);
			mainGainLimSet(i, this.conf.band[i].mainGain);
			mainPowerLimSet(i, this.conf.band[i].mainPower);
			for (var j = 0; j < this.maxChannels; ++j) {
				var c = j + 1;
				if (this.bwType == 0) {
					var fr = this.conf.band[i].ch[j].frqNr * factory.data.fstep + factory.data.band[i].fo;
					setFreqCh(c, i, fr);
					page.chBwSet(c, i, this.conf.band[i].ch[j].bandwidth);
				} else {
					var chnr = [];
					chnr.push(this.conf.band[i].ch[j].frqNr);
					chnr.push(this.conf.band[i].ch[j].frqNrStop);
					var fr = [];
					for (var k = 0; k < 2; ++k) {
						var f = chnr[k] * factory.data.fstepAdj + factory.data.band[i].fo;
						fr.push(~~f);
					}
					page.setFreqBv(c, i, fr);
					page.saveFreq(j, i, fr);
				}
				fineGainLimSet(c, i, this.conf.band[i].ch[j].fineGain);
				finePowerLimSet(c, i, this.conf.band[i].ch[j].finePower);
			}
		}
	}
	this.computeChNum = function(fr, b) {
		if (isNaN(fr)){
			return Number.NaN;
		}
		var fstep = this.bwType == 0 ? factory.data.fstep : factory.data.fstepAdj;
		var num = (fr - factory.data.band[b].fo) / fstep;
		return ~~Math.round(num);
	}
	this.computeChFreq = function(num, b) {
		var fstep = this.bwType == 0 ? factory.data.fstep : factory.data.fstepAdj;
		var fr = num * fstep + factory.data.band[b].fo;
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
			if (config.conf.band[b].squelchEnable)
				return false;
		}
		return true;
	}
	this.format = function(fwChange) {
		currentConfigFrm = this.frameStr;
		page.updateAllFreqs();
		var frame = "00";
		var num;
		var mode = isMuteModeLinked();
		if (mode == null) {
			mode = false;
		}
		num = mode? this.ctrlGrlBits['MUTEMODE'] : 0;
		num |= isFreqSplitFixed() ? 0 : this.ctrlGrlBits['SPLIT'];
		num |= this.bwType == 1 ? this.ctrlGrlBits['BWVAR'] : 0;
		num |= page.getFwRev() == 1 ? this.ctrlGrlBits['REVISION'] : 0;
		num |= fwChange ? this.ctrlGrlBits['REVSWITCH'] : 0;
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
			}
			if (this.bwType == 0) {
				continue;
			}
			for (var j = 0; j < this.maxChannels; ++j) {
				var fr = this.formatFstop(i, j);
				frame += fr ? fr : currentConfigFrm.substr(frame.length, 4);
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
		var n = c + 1;
		var fr;
		if (this.bwType == 0) {
			fr = getFreqCh(n, b);
			if (fr < factory.data.band[b].fStart)
				fr = factory.data.band[b].fStart;
			else if (fr > factory.data.band[b].fStop)
				fr = factory.data.band[b].fStop;
		} else {
			var f = page.getBandBv(n, b);
			fr = f[0];
		}
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
		if (en == null || (this.bwType == 1 && k > factory.data.bwAdjFiltNr)) {
			en = false;
		}
		var bw;
		if (this.bwType == 0) {
			bw = page.chBwGet(k, b);
			if (!bw) {
				for (var i = 0; i < factory.bwOptions.length; ++i) {
					if (factory.bwOptions[i].mask & factory.data.bwmask) {
						bw = factory.bwOptions[i].nr;
						break;
					}
				}
			}
		}
		var num = 0;//finePowerLimGet(k, b);
		if (num == null) {
			num = 0;
		} else if (num > 0) {
			num = 0;
		} else if (num < this.conf.finePowerRange) {
			num = this.conf.finePowerRange;
		}
		num = ~~Math.abs(num) & 0x0F;
		num <<= 4;
		num |= en ? 0 : 0x08;
		num |= (bw & 0x07);
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
	this.formatFstop = function(b, c) {
		if (this.bwType == 0) {
			return null;
		}
		var n = c + 1;
		var f = page.getBandBv(n, b);
		var fr = f[1];
		var num = this.computeChNum(fr, b);
		if (isNaN(num)) {
			return null;
		}
		if (num < 0)
			num += 65536;
		var frame = hexformat(num, 4);
		return frame;		
	}
	this.serialize = function(fct) {
		var frm = "00";
		var num = this.conf.control.muteMode ? this.ctrlGrlBits['MUTEMODE'] : 0;
		num |= this.conf.control.split ? this.ctrlGrlBits['SPLIT'] : 0;
		num |= this.bwType == 1 ? this.ctrlGrlBits['BWVAR'] : 0;
		num |= this.conf.control.revision == 1 ? this.ctrlGrlBits['REVISION'] : 0;
		frm += hexformat(num, 2);
		for (var i = 0; i < 2; ++i) {
			frm += this.serializeBand(i, fct);
			for (var j = 0; j < this.maxChannels; ++j) {
				frm += this.serializeCh(i, j);
			}
			if (this.bwType == 0) {
				continue;
			}
			for (var j = 0; j < this.maxChannels; ++j) {
				frm += this.serializeFstop(i, j);
			}
		}
		return frm;
	}
	this.serializeBand = function(b, fct) {
		var frm = "";
		var num = this.conf.band[b].squelchEnable ? this.bandCtrlBits['SQEN'] : 0;
		num |= this.conf.band[b].hpaEnable ? this.bandCtrlBits['HPAEN'] : 0;
		frm += hexformat(num, 2);
		num = this.conf.band[b].squelchThr;
		if (num > this.conf.band[b].squelchThrMax)
			num = this.conf.band[b].squelchThrMax;
		else if (num < this.conf.band[b].squelchThrMin)
			num = this.conf.band[b].squelchThrMin;
		num = rSignedByte(num);
		frm += hexformat(num, 2);
		num = this.conf.band[b].mainGain;
		if (num > fct.data.band[b].gainLim)
			num = fct.data.band[b].gainLim;
		else if (num < this.conf.band[b].mainGainMin)
			num = this.conf.band[b].mainGainMin;
		num = rSignedByte(num);
		frm += hexformat(num, 2);
		num = this.conf.band[b].mainPower;
		if (num > fct.data.band[b].powerLim)
			num = fct.data.band[b].powerLim;
		else if (num < fct.data.band[b].powerLim - this.conf.band[b].mainPowerRange)
			num = fct.data.band[b].powerLim - this.conf.band[b].mainPowerRange;
		num = rSignedByte(num);
		frm += hexformat(num, 2);
		return frm;
	}
	this.serializeCh = function(b, c) {
		var frm = "";
		var num = this.conf.band[b].ch[c].frqNr;
		if (num < 0)
			num += 65536;
		frm += hexformat(num, 4);
		num = this.conf.band[b].ch[c].finePower;
		if (num > 0)
			num = 0;
		else if (num < this.conf.finePowerRange)
			num = this.conf.finePowerRange;
		num = ~~Math.abs(num) & 0x0F;
		num <<= 4;
		var en = this.conf.band[b].ch[c].enable;
		if (this.bwType == 1 && k > factory.data.bwAdjFiltNr) {
			en = false;
		}
		num |= en ? 0 : 0x08;
		var bw = 0;
		if (this.bwType == 0) {
			bw = this.conf.band[b].ch[c].bandwidth;
		} else {
			bw = ~~Math.round(this.conf.band[b].ch[c].bandwidth / this.bwVarStepHz);
		}
		num |= bw & 0x07;
		frm += hexformat(num, 2);
		num = this.conf.band[b].ch[c].fineGain;
		if (num > 0)
			num = 0;
		else if (num < this.conf.fineGainRange)
			num = this.conf.fineGainRange;
		num = rSignedByte(num);
		frm += hexformat(num, 2);
		return frm;
	}
	this.serializeFstop = function(b, c) {
		var num = this.conf.band[b].ch[c].frqNrStop;
		if (num < 0)
			num += 65536;
		var frm = hexformat(num, 4);
		return frm;
	}
}
// -->
