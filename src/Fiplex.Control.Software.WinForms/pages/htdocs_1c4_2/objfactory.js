function Factory(factoryFrame) {
	this.data = {
		band: [],
		fmodulo:	0,
		fstep:		0,
		fastAgc:	0,
		dacspect:	0,
		dacmode:	0,
		pwrReductionEn:	0,
		bwmask:		0,
		ulPaCurrMon: 	false,
		ulAbnSq: 	false,
		ln: 		false,
		simplex: 	false,
		fmoduloAdj:	0,
		fstepAdj: 	0,
		bandAdj: 	[],
		dualFw: 	0,
		disablePAUlHwEn: false,
		opfEnable: 	false,
		excludeFreq: false
	};
	for (var i = 0; i < 2; ++i) {
		this.data.band.push({
			powerCorr:	0,
			sqTrhCorr:	0,
			maxGainCorr:	0,
			maxPowerCorr:	0,
			diplexerLoss:	0,
			spectWarn:	0,
			attout:		0,
			powerLim:	0,
			gainLim:	0,
			ncoRx:		0,
			ncoTx:		0,
			ftw:		0,
			fStart:		0,
			fStop:		0,
			fo:		0,
			fdummy:		0,
			oscsel:		0,
			hpamon:		0,
			fipmon: 	0,
			fStartExc:	0,
			fStopExc:	0
		});
		this.data.bandAdj.push({
			powerCorr:	0,
			sqTrhCorr:	0,
			maxGainCorr:	0,
			maxPowerCorr: 	0,
			diplexerLoss: 	0,
			spectHwCorr: 	0,
			dcOffset: 	0
		});
	}
	this.MAX_PWR_DELTA = 3;
	var self = this;
	this.frm;
	this.getFrm = function() {
		var str = self.frm;
		for (var n = 0, s = 0; n < self.Map.length; ++n) {
			var len = self.Map[n].len;
			for (var b = 0; b < self.Map[n].dataLen; ++b, s += len) {
				try {
					var v = self.Map[n].fmt(b);
					str = str.substr(0, s) 
						+ hexformat(v, len) 
						+ str.substr(s + len);
				} catch(err){}
			}
		}
		return str;
	}
	this.computeFrmLen = function() {
		var len = 0;
		for (var n = 0; n < self.Map.length; ++n) {
			len += self.Map[n].len * self.Map[n].dataLen;
		}
		return len;
	}
	this.parse = function(sr) {
		if (typeof(sr) === 'undefined' || !sr) {
			return -1;
		}
		if (!isHex(sr) || sr.length < self.computeFrmLen()) {
			return -1;
		}
		self.frm = sr;
		for (var n = 0, s = 0; n < self.Map.length; ++n) {
			var len = self.Map[n].len;
			for (var b = 0; b < self.Map[n].dataLen; ++b, s += len) {
				try {
					var num = parseInt(sr.substr(s, len), 16);
					if (isNaN(num)) {
						continue;
					}
					// self.Map[n].data[b] = num;
					var v = self.Map[n].prs(b, num);
					if (self.Map[n].id=='oscsel' && self.data.excludeFreq)	self.updateMap();
						
				} catch(err){}
			}
		}
		return 0;
	}
	this.updateMap = function(){
		for (var n = 0; n < self.Map.length; ++n){
			if (self.Map[n].id == 'dcOffset'){
				self.Map[n].id = 'fStopExc';
				self.Map[n].fmt = this.ftFstopExc;
				self.Map[n].prs = this.psFstopExc;
			}
			if (self.Map[n].id == 'diplexAdj'){
				self.Map[n].id = 'fStartExc';
				self.Map[n].fmt = this.ftFstartExc;
				self.Map[n].prs = this.psFstartExc;
			}			
		}
	}
	this.CONF1BITS = {
		'PRESCALER': 	0x01,
		'SPECTINV': 	0x02,
		'DACMODE': 	0x04,
		'PAMONHW': 	0x08,
		'PAMONFIP': 	0x10,
		'PAULENHW': 	0x20,
		'OPFEN': 	0x40,
		'EXCFREQ': 	0x80
	};
	this.CONF2BITS = {
		'FASTAGC': 	0x01,
		'DUALFW': 	0x02,
		'FILTNR0': 	0x04,
		'FILTNR1': 	0x08,
		'FORCDULCURR': 	0x10,
		'ULABNSQ': 	0x20,
		'SIMPLEX': 	0x40,
		'LOWNOISE': 	0x80
	};
	this.psRfInCorr = function(b, v) {
		var val = to_float(v);
		self.data.band[b].powerCorr = val;
	}
	this.psSqTh = function(b, v) {
		var val = to_float(v);
		self.data.band[b].sqTrhCorr = val;
	}
	this.psGainCorr = function(b, v) {
		var val = to_float(v);
		self.data.band[b].maxGainCorr = val;
	}
	this.psPwrCorr = function(b, v) {
		var val = to_float(v);
		self.data.band[b].maxPowerCorr = val;
	}
	this.psRfOutCorr = function(b, v) {
		var val = to_float(v);
		self.data.band[b].diplexerLoss = val;
	}
	this.psSpectWarn = function(b, v) {
		var val = cSignedByte(v);
		self.data.band[b].spectWarn = val;
	}
	this.psAttOut = function(b, v) {
		self.data.band[b].attout = v;
	}
	this.psPwrLim = function(b, v) {
		var val = v;
		
		if (b == 0) {
			self.data.band[b].powerLim = val & 0x7F;
			self.data.pwrReductionEn = (val & 0x80) != 0;
		}else{
			self.data.band[b].powerLim = cSignedByte(val);
		}
	}
	this.psGainLim = function(b, v) {
		self.data.band[b].gainLim = v;
	}
	this.psNcoRx = function(b, v) {
		self.data.band[b].ncoRx = v;
	}
	this.psNcoTx = function(b, v) {
		self.data.band[b].ncoTx = v;
	}
	this.psFtw = function(b, v) {
		self.data.band[b].ftw = v;
	}
	this.psFstart = function(b, v) {
		self.data.band[b].fStart = v;
	}
	this.psFstop = function(b, v) {
		self.data.band[b].fStop = v;
	}
	this.psFref = function(b, v) {
		self.data.band[b].fo = v;
	}
	this.psFdummy = function(b, v) {
		self.data.band[b].fdummy = v;
	}
	this.psOscSel = function(b, v) {
		self.data.band[b].oscsel = (v & self.CONF1BITS['PRESCALER']) ? 1 : 0;
		self.data.dacspect = (v & self.CONF1BITS['SPECTINV']) ? 1 : 0;
		self.data.dacmode = (v & self.CONF1BITS['DACMODE']) ? 1 : 0;
		self.data.band[b].hpamon = (v & self.CONF1BITS['PAMONHW']) ? 1 : 0;
		self.data.band[b].fipmon = (v & self.CONF1BITS['PAMONFIP']) ? 1 : 0;
		if (b == 0) {
			self.data.disablePAUlHwEn = ((v & self.CONF1BITS['PAULENHW']) != 0);
			self.data.opfEnable = ((v & self.CONF1BITS['OPFEN']) != 0);
			self.data.excludeFreq = ((v & self.CONF1BITS['EXCFREQ']) != 0);
		}
	}
	this.psFmodulo = function(b, v) {
		self.data.fmodulo = v;
	}
	this.psFstep = function(b, v) {
		self.data.fstep = v;
	}
	this.psFastAgc = function(b, v) {
		self.data.fastAgc = (v & self.CONF2BITS['FASTAGC']) ? 0 : 1;
		self.data.dualFw = (v & self.CONF2BITS['DUALFW']) ? 1 : 0;
		self.data.ulPaCurrMon = (v & self.CONF2BITS['FORCDULCURR']) ? 1 : 0;
		self.data.ln = (v & self.CONF2BITS['LOWNOISE']) ? 1 : 0;
		self.data.simplex = (v & self.CONF2BITS['SIMPLEX']) ? 1 : 0;
		self.data.ulAbnSq = (v & self.CONF2BITS['ULABNSQ']) ? 1 : 0;
	}
	this.psBw = function(b, v) {
		self.data.bwmask = v;
	}
	this.psFmoduloAdj = function(b, v) {
		self.data.fmoduloAdj = v;
	}
	this.psFstepAdj = function(b, v) {
		self.data.fstepAdj = v;
	}
	this.psPwrCorrAdj = function(b, v) {
		var val = to_float(v);
		self.data.bandAdj[b].powerCorr = val;
	}
	this.psSqThCorrAdj = function(b, v) {
		var val = to_float(v);
		self.data.bandAdj[b].sqTrhCorr = val;
	}
	this.psMaxGainCorrAdj = function(b, v) {
		var val = to_float(v);
		self.data.bandAdj[b].maxGainCorr = val;
	}
	this.psMaxPwrCorrAdj = function(b, v) {
		var val = to_float(v);
		self.data.bandAdj[b].maxPowerCorr = val;
	}
	this.psRfOutCorrAdj = function(b, v) {
		var val = to_float(v);
		self.data.bandAdj[b].diplexerLoss = val;
	}
	this.psSpectCorrAdj = function(b, v) {
		var val = to_float(v);
		self.data.bandAdj[b].spectHwCorr = val;
	}
	this.psDcOffset = function(b, v) {
		self.data.bandAdj[b].dcOffset = v;
	}
	this.psFstartExc = function(b, v) {
		self.data.band[b].fStartExc = 25000*v;
	}		
	this.psFstopExc = function(b, v) {
		self.data.band[b].fStopExc = 25000*v;
	}	
	this.ftRfInCorr = function(b) {
		return double_to_uint(self.data.band[b].powerCorr);
	}
	this.ftSqTh = function(b) {
		return double_to_uint(self.data.band[b].sqTrhCorr);
	}
	this.ftGainCorr = function(b) {
		return double_to_uint(self.data.band[b].maxGainCorr);
	}
	this.ftPwrCorr = function(b) {
		return double_to_uint(self.data.band[b].maxPowerCorr);
	}
	this.ftRfOutCorr = function(b) {
		return double_to_uint(self.data.band[b].diplexerLoss);
	}
	this.ftSpectWarn = function(b) {
		return rSignedByte(self.data.band[b].spectWarn);
	}
	this.ftAttOut = function(b) {
		return rSignedByte(self.data.band[b].attout);
	}
	this.ftPwrLim = function(b) {
		var v;
		if (b==0){
			v = self.data.band[b].powerLim & 0x7F;
			if (self.data.pwrReductionEn) {
				v |= 0x80;
			}			
		}else{
			v = rSignedByte(self.data.band[b].powerLim);
		}
		return v;
	}
	this.ftGainLim = function(b) {
		return self.data.band[b].gainLim;
	}
	this.ftNcoRx = function(b) {
		return self.data.band[b].ncoRx;
	}
	this.ftNcoTx = function(b) {
		return self.data.band[b].ncoTx;
	}
	this.ftFtw = function(b) {
		return self.data.band[b].ftw;
	}
	this.ftFstart = function(b) {
		return self.data.band[b].fStart;
	}
	this.ftFstop = function(b) {
		return self.data.band[b].fStop;
	}
	this.ftFref = function(b) {
		return self.data.band[b].fo;
	}
	this.ftFdummy = function(b) {
		return self.data.band[b].fdummy;
	}
	this.hasExcludeFreq = function(b) {
		if (!self.data.excludeFreq) return false;
		if (self.data.band[b].fStart>self.data.band[b].fStartExc) return false;
		if (self.data.band[b].fStartExc>self.data.band[b].fStopExc) return false;
		if (self.data.band[b].fStopExc>self.data.band[b].fStop) return false;
		return true;
	}
	this.isVHF = function(){
		return self.data.band[0].fStop<180e6;
	}
	this.isULDLFreqConsistent = function(){
		var bwUL = (this.data.band[0].fStop-this.data.band[0].fStart);
		var bwDL = (this.data.band[1].fStop-this.data.band[1].fStart);
		if (bwUL!=bwDL) return false;
		var excFrUL = this.hasExcludeFreq(0);
		var excFrDL = this.hasExcludeFreq(1);
		if (excFrUL!=excFrDL) return false;
		if (excFrUL && excFrDL){
			var bwExcUL = (this.data.band[0].fStopExc-this.data.band[0].fStartExc);
			var bwExcDL = (this.data.band[1].fStopExc-this.data.band[1].fStartExc);
			if (bwExcUL!=bwExcDL) return false;
			//first subband
			bwExcUL = (this.data.band[0].fStartExc-this.data.band[0].fStart);
			bwExcDL = (this.data.band[1].fStartExc-this.data.band[1].fStart);			
			if (bwExcUL!=bwExcDL) return false;
		}
		return true;
	}
	this.ftOscSel = function(b) {
		var v = 0;
		v |= self.data.band[b].oscsel ? self.CONF1BITS['PRESCALER'] : 0;
		v |= self.data.dacspect ? self.CONF1BITS['SPECTINV'] : 0;
		v |= self.data.dacmode ? self.CONF1BITS['DACMODE'] : 0;
		v |= self.data.band[b].hpamon ? self.CONF1BITS['PAMONHW'] : 0;
		v |= self.data.band[b].fipmon ? self.CONF1BITS['PAMONFIP'] : 0;
		if (b == 0) {
			v |= self.data.disablePAUlHwEn ? self.CONF1BITS['PAULENHW'] : 0;
			v |= self.data.opfEnable ? self.CONF1BITS['OPFEN'] : 0;
			v |= self.data.excludeFreq ? self.CONF1BITS['EXCFREQ'] : 0;
		}
		return v;
	}
	this.ftFmodulo = function() {
		return self.data.fmodulo;
	}
	this.ftFstep = function() {
		return self.data.fstep;
	}
	this.ftFastAgc = function() {
		var v = 0;
		v |= self.data.fastAgc ? 0 : self.CONF2BITS['FASTAGC'];
		v |= self.data.dualFw ? self.CONF2BITS['DUALFW'] : 0;
		v |= self.data.ulPaCurrMon ? self.CONF2BITS['FORCDULCURR'] : 0;
		v |= self.data.ln ? self.CONF2BITS['LOWNOISE'] : 0;
		v |= self.data.simplex ? self.CONF2BITS['SIMPLEX'] : 0;
		v |= self.data.ulAbnSq ? self.CONF2BITS['ULABNSQ'] : 0;
		return v;
	}
	this.ftBw = function(b) {
		return self.data.bwmask;
	}
	this.ftFmoduloAdj = function() {
		return self.data.fmoduloAdj;
	}
	this.ftFstepAdj = function() {
		return self.data.fstepAdj;
	}
	this.ftPwrCorrAdj = function(b) {
		return double_to_uint(self.data.bandAdj[b].powerCorr);
	}
	this.ftSqThCorrAdj = function(b) {
		return double_to_uint(self.data.bandAdj[b].sqTrhCorr);
	}
	this.ftMaxGainCorrAdj = function(b) {
		return double_to_uint(self.data.bandAdj[b].maxGainCorr);
	}
	this.ftMaxPwrCorrAdj = function(b) {
		return double_to_uint(self.data.bandAdj[b].maxPowerCorr);
	}
	this.ftRfOutCorrAdj = function(b) {
		return double_to_uint(self.data.bandAdj[b].diplexerLoss);
	}
	this.ftSpectCorrAdj = function(b) {
		return double_to_uint(self.data.bandAdj[b].spectHwCorr);
	}
	this.ftDcOffset = function(b) {
		return self.data.bandAdj[b].dcOffset;
	}
	this.ftFstopExc = function(b) {
		return ~~Math.round(self.data.band[b].fStopExc/25000);
	}
	this.ftFstartExc = function(b) {
		return ~~Math.round(self.data.band[b].fStartExc/25000);
	}		
	this.isSimplexAllowed = function() {
		return self.data.simplex != 0;
	}
	this.isDualFwAllowed = function() {
		return self.data.dualFw != 0;
	}
	this.isUlAbnSqCapable = function() {
		return self.data.ulAbnSq != 0;
	}
	this.isOpfEnabled = function() {
		return self.data.opfEnable;
	}
	this.Map = [ 
		{
			id:'power',
			len: 4,
			dataLen: 2,
			fmt: this.ftRfInCorr,
			prs: this.psRfInCorr
		},
		{
			id:'sqThr',
			len: 4,
			dataLen: 2,
			fmt: this.ftSqTh,
			prs: this.psSqTh
		},
		{
			id:'maxGain',
			len: 4,
			dataLen: 2, 
			fmt: this.ftGainCorr,
			prs: this.psGainCorr
		},
		{
			id:'maxPow',
			len: 4,
			dataLen: 2,
			fmt: this.ftPwrCorr,
			prs: this.psPwrCorr 
		},
		{
			id:'diplex',
			len: 4,
			dataLen: 2,
			fmt: this.ftRfOutCorr,
			prs: this.psRfOutCorr
		},
		{
			id:'spectWarn',
			len: 2,
			dataLen: 2,
			fmt: this.ftSpectWarn,
			prs: this.psSpectWarn
		},
		{
			id:'attout',
			len: 2,
			dataLen: 2,
			fmt: this.ftAttOut,
			prs: this.psAttOut
		},
		{
			id:'powerLim',
			len: 2,
			dataLen: 2,
			fmt: this.ftPwrLim,
			prs: this.psPwrLim
		},
		{
			id:'gainLim',
			len: 2,
			dataLen: 2,
			fmt: this.ftGainLim,
			prs: this.psGainLim
		},
		{
			id:'ncoRx',
			len: 2,
			dataLen: 2,
			fmt: this.ftNcoRx,
			prs: this.psNcoRx
		},
		{
			id:'ncoTx',
			len: 2,
			dataLen: 2,
			fmt: this.ftNcoTx,
			prs: this.psNcoTx
		},
		{
			id:'ftw',
			len: 8,
			dataLen: 2,
			fmt: this.ftFtw,
			prs: this.psFtw
		},
		{
			id:'fStart',
			len: 8,
			dataLen: 2,
			fmt: this.ftFstart,
			prs: this.psFstart
		},
		{
			id:'fStop',
			len: 8,
			dataLen: 2,
			fmt: this.ftFstop,
			prs: this.psFstop
		},
		{
			id:'fo',
			len: 8,
			dataLen: 2,
			fmt: this.ftFref,
			prs: this.psFref
		},
		{
			id:'fdummy',
			len: 4,
			dataLen: 2,
			fmt: this.ftFdummy,
			prs: this.psFdummy
		},
		{
			id:'oscsel',
			len: 2,
			dataLen: 2,
			fmt: this.ftOscSel,
			prs: this.psOscSel
		},
		{
			id:'fmodulo',
			len: 4,
			dataLen: 1,
			fmt: this.ftFmodulo,
			prs: this.psFmodulo
		},
		{
			id:'fstep',
			len: 4,
			dataLen: 1,
			fmt: this.ftFstep,
			prs: this.psFstep
		},
		{
			id:'fastAgc',
			len: 2,
			dataLen: 1,
			fmt: this.ftFastAgc,
			prs: this.psFastAgc
		},
		{
			id:'bandwidths',
			len: 2,
			dataLen: 1,
			fmt: this.ftBw,
			prs: this.psBw
		},
		{
			id:'fmoduloAdj',
			len: 4,
			dataLen: 1,
			fmt: this.ftFmoduloAdj,
			prs: this.psFmoduloAdj
		},
		{
			id:'fstepAdj',
			len: 4,
			dataLen: 1,
			fmt: this.ftFstepAdj,
			prs: this.psFstepAdj
		},
		{
			id:'powerAdj',
			len: 4,
			dataLen: 2,
			fmt: this.ftPwrCorrAdj,
			prs: this.psPwrCorrAdj
		},
		{
			id:'sqThrAdj',
			len: 4,
			dataLen: 2,
			fmt: this.ftSqThCorrAdj,
			prs: this.psSqThCorrAdj
		},
		{
			id:'maxGainAdj',
			len: 4,
			dataLen: 2,
			fmt: this.ftMaxGainCorrAdj,
			prs: this.psMaxGainCorrAdj
		},
		{
			id:'maxPowAdj',
			len: 4,
			dataLen: 2,
			fmt: this.ftMaxPwrCorrAdj,
			prs: this.psMaxPwrCorrAdj
		},
		{
			id:'diplexAdj',
			len: 4,
			dataLen: 2,
			fmt: this.ftRfOutCorrAdj,
			prs: this.psRfOutCorrAdj
		},
		{
			id:'spectCorr',
			len: 4,
			dataLen: 2,
			fmt: this.ftSpectCorrAdj,
			prs: this.psSpectCorrAdj
		},
		{
			id:'dcOffset',
			len: 4,
			dataLen: 2,
			fmt: this.ftDcOffset,
			prs: this.psDcOffset
		}
	];
	this.CLOCKS = [
		{fmod: 6400, clk: 160,   clk10: 1600},
		{fmod: 6000, clk: 150,   clk10: 1500},
		{fmod: 5400, clk: 67.5,  clk10: 1350},
		{fmod: 6144, clk: 153.6, clk10: 1536}
	];
	this.getOsc = function() {
		for (var i = 0; i < self.CLOCKS.length; ++i) {
			if (self.data.fmodulo % self.CLOCKS[i].clk10 == 0) {
				return self.CLOCKS[i].clk;
			}
		}
		return 150;
	}
	this.getClkNr = function() {
		for (var i = 0; i < self.CLOCKS.length; ++i) {
			if (self.data.fmodulo % self.CLOCKS[i].clk10 == 0) {
				return i;
			}
		}
		return 1;
	}
	if (typeof(factoryFrame) !== 'undefined') {
		this.parse(factoryFrame);
	}
}
