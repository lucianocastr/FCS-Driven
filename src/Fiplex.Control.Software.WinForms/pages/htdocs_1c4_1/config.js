function Frequency(obj) {
	this.saveFrameStr = function(sr) {
		localStorage.setItem("Frequency"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("Frequency"+Prjstr+window.location.host);
	}
	this.parseSavedFrame = function() {
		var sr = this.retrieveFrameStr();
		var r = this.parseFrameStr(sr);
		return r;
	}
	this.parseFrameStr = function(sr) {
		try {
			var arr = sr.split('\t');
			if (arr.length != 2) {
				return null;
			}
			for (var i = 0; i < arr.length; ++i) {
				var r = this.setFrameStr(arr[i]);
				if (r === null) {
					return null;
				}
			}
			return 1;
		} catch(e) { return null; }
	}
	this.setFrameStr = function(str) {
		if (str.length != this.FRMLEN) {
			return null;
		}
		var b = this.parseBand(str);
		var s = this.parseSplit(str);
		if (b < 0 || s < 0)  {
			return null;
		}
		for (var c = 0; c < this.CHNR; ++c) {
			var ch = this.parseChNr(str, c);
			if (ch === null) {
				return null;
			}
		}
		this.frm[b] = str;
	}
	this.parseSplit = function(str) {
		try {
			var cnf = parseInt(str.substr(0, 2), 16);
			var s = (cnf & this.confMask['SPLIT']) ? 1 : 0;
			return s;
		} catch (err) { return -1; }
	}
	this.parseBand = function(str) {
		try {
			var cnf = parseInt(str.substr(0, 2), 16);
			var b = (cnf & this.confMask['BAND']) ? 1 : 0;
			return b;
		} catch (err) { return -1; }
	}
	this.parseChNr = function(str, c) {
		if (!(c < this.CHNR)) {
			return null;
		}
		try {
			var s = 2 + c*4;
			var ch = parseInt(str.substr(s, 4), 16);
			if (ch > 32767) {
				ch -= 65536;
			}
			return ch;
		} catch (e) { return null; }
	}
	this.getChNr = function(b, c) {
		if (!(c < this.CHNR && b < 2)) {
			return null;
		}
		try {
			var s = 2 + c*4;
			var ch = parseInt(this.frm[b].substr(s, 4), 16);
			if (ch > 32767) {
				ch -= 65536;
			}
			return ch;
		} catch (e) { return null; }
	}
	this.isSplitFixed = function() {
		var result = true;
		for (var b = 0; b < 2; ++b) {
			var isFixed = this.parseSplit(this.frm[b]) == 0;
			if (!isFixed) {
				result = false;
				break;
			}
		}
		return result;
	}
	this.setSplit = function(isSplitFixed) {
		try {
			for (var b = 0, cfg = 0; b < 2; ++b) {
				if (!isSplitFixed) {
					cfg |= this.confMask['SPLIT'];
				}
				if (b > 0) {
					cfg |= this.confMask['BAND'];
				}
				this.frm[b] = hexformat(cfg, 2) + this.frm[b].substr(2);
			}
		} catch(err) {}
	}
	this.setFreq = function(b, c, chnr) {
		try {
			if (chnr < 0) {
				chnr += 65536;
			}
			var frame = hexformat(chnr, 4);
			var s = 2 + c*4;
			this.frm[b] = this.frm[b].substr(0, s) + frame + this.frm[b].substr(s+4);
		} catch(e) {}
	}
	this.FRMLEN = 65*2;
	this.CHNR = 32;
	this.confMask = {
		'SPLIT': 	0x01,
		'BAND': 	0x02
	}
	this.frm = [];
	try {
		for (var i = 0; i < 2 && i < obj.frm.length; ++i) {
			this.frm.push(obj.frm[i]);
		}
	} catch(e) {}
}

function Conf(obj) {
	this.saveFrameStr = function(sr) {
		localStorage.setItem("Conf"+Prjstr+window.location.host, sr);
	}
	this.retrieveFrameStr = function() {
		return localStorage.getItem("Conf"+Prjstr+window.location.host);
	}
	this.frm = [];
	this.FRMLEN = 70*2;
	this.CHNR = 32;
	this.GfineRange = -40;
	this.AddrMap = {
		'RESET': 	0,
		'GRAL': 	1*2,
		'BAND': 	2*2,
		'CH1': 		6*2
	};
	this.AddrMapBand = {
		'CONF': 	0,
		'SQTH': 	1*2,
		'GMAIN': 	2*2,
		'PMAIN': 	3*2
	};
	this.AddrMapCh = {
		'CONF': 	0,
		'GFINE': 	1*2,
		'NR': 		2*2
	};
	this.MaskGralBits = {
		'REVISION': 	0x01,
		'MUTEMODE': 	0x02,
		'FILTREDMASK': 	0x7C,
		'FILTREDSH': 	2,
		'SIMPLEX': 	0x80
	};
	this.MaskBandBits = {
		'BAND': 	0x01,
		'SQEN': 	0x10,
		'EQBW': 	0x20,
		'PAEN': 	0x80
	};
	this.MaskChBits = {
		'BWMASKOLD': 	0x3F,
		'BWMASK': 	0x07,
		'BWGAIN': 	0x40,
		'STBY': 	0x80
	};
	this.SqModeVals = {
		'NOTLINKED': 	0,
		'LINKED': 	1
	}
	this.sqThrLimits = function(simplex, b) {
		if (simplex) {
			return {MIN: -100, MAX: -40};
		} else {
			if (b == 0) {
				return {MIN: -110, MAX: -70};
			} else {
				return {MIN: -90, MAX: -40};
			}
		}
	}
	this.limitGmainMin = [60, 60];
	this.limitPowerRange = [20, 20];
	this.limitgFine = [
		{MIN: -40,	MAX: 0},
		{MIN: -40,	MAX: 0}
	];
	this.parseFrameStr = function(sr) {
		try {
			var arr = sr.split('\t');
			if (arr.length != 2) {
				return null;
			}
			for (var i = 0; i < arr.length; ++i) {
				var r = this.setFrameStr(arr[i]);
				if (r === null) {
					return null;
				}
			}
			return 1;
		} catch(e) { return null; }
	}
	this.setFrameStr = function(str) {
		if (str.length != this.FRMLEN) {
			return null;
		}
		var b = this.parseBand(str);
		if (b === null)  {
			return null;
		}
		var sqmode = this.parseSqMode(str);
		if (sqmode === null) {
			return null;
		}
		var sqen = this.parseSqEn(str);
		if (sqen === null) {
			return null;
		}
		var eqbw = this.parseEqBw(str);
		if (eqbw === null) {
			return null;
		}
		var paen = this.parsePaEn(str);
		if (paen === null) {
			return null;
		}
		var sqth = this.parseSqTh(str);
		if (sqth === null) {
			return null;
		}
		var gmain = this.parseGmain(str);
		if (gmain === null) {
			return null;
		}
		var pmain = this.parsePmain(str);
		if (pmain === null) {
			return null;
		}
		for (var c = 0; c < this.CHNR; ++c) {
			var stby = this.parseChStby(str, c);
			if (stby === null) {
				return null;
			}
			var bw = this.parseChBw(str, c);
			if (bw === null) {
				return null;
			}
			var gfine = this.parseChGfine(str, c);
			if (gfine === null) {
				return null;
			}
		}
		this.frm[b] = str;
	}
	this.parseReset = function(str) {
		try {
			var s = this.AddrMap['RESET'];
			var v = parseInt(str.substr(s, 2), 16);
			return v;
		} catch (err) { return null; }
	}
	this.parseRevision = function(str) {
		try {
			var s = this.AddrMap['GRAL'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskGralBits['REVISION']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseSimplexMode = function(str) {
		try {
			var s = this.AddrMap['GRAL'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskGralBits['SIMPLEX']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseSqMode = function(str) {
		try {
			var s = this.AddrMap['GRAL'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskGralBits['MUTEMODE']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseBand = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskBandBits['BAND']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseSqEn = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskBandBits['SQEN']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseEqBw = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskBandBits['EQBW']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parsePaEn = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskBandBits['PAEN']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseSqTh = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['SQTH'];
			var v = parseInt(str.substr(s, 2), 16);
			if (v > 0x7F) {
				v -= 0x100;
			}
			return v;
		} catch (err) { return null; }
	}
	this.parseGmain = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['GMAIN'];
			var v = parseInt(str.substr(s, 2), 16);
			return v;
		} catch (err) { return null; }
	}
	this.parsePmain = function(str) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['PMAIN'];
			var v = parseInt(str.substr(s, 2), 16);
			if (v > 0x7F) {
				v -= 0x100;
			}
			return v;
		} catch (err) { return null; }
	}
	this.parseChStby = function(str, c) {
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['CONF'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskChBits['STBY']) ? 1 : 0;
			return v;
		} catch (err) { return null; }
	}
	this.parseChBw = function(str, c) {
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['CONF'];
			var cnf = parseInt(str.substr(s, 2), 16);
			var v = (cnf & this.MaskChBits['BWMASK']);
			return v;
		} catch (err) { return null; }
	}
	this.parseChGfine = function(str, c) {
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['GFINE'];
			var v = parseInt(str.substr(s, 2), 16);
			if (v > 127) {
				v -= 256;
			}
			return v;
		} catch (err) { return null; }
	}
	this.getSimplexMode = function() {
		try {
			var v = this.parseSimplexMode(this.frm[0]);
			return v;
		} catch(e) { return null; }
	}
	this.getSqMode = function() {
		try {
			var v = this.parseSqMode(this.frm[0]);
			return v;
		} catch(e) { return null; }
	}
	this.getSqEn = function(b) {
		var v = this.parseSqEn(this.frm[b]);
		return v;
	}
	this.getEqBw = function(b) {
		var v = this.parseEqBw(this.frm[b]);
		return v;
	}
	this.getPaEn = function(b) {
		var v = this.parsePaEn(this.frm[b]);
		return v;
	}
	this.getSqTh = function(b) {
		return this.parseSqTh(this.frm[b]);
	}
	this.getGmain = function(b) {
		return this.parseGmain(this.frm[b]);
	}
	this.getPmain = function(b) {
		return this.parsePmain(this.frm[b]);
	}
	this.getChStby = function(b, c) {
		return this.parseChStby(this.frm[b], c);
	}
	this.getChActive = function(c) {
		return (!this.getChStby(0, c) || !this.getChStby(1, c));
	}
	this.getChannelsEnabledMask = function() {
		var activeMask = 0;
		for (var c = 0, mask = 1; c < this.CHNR; ++c, mask <<= 1) {
			if (this.getChActive(c)) {
				activeMask |= mask;
			}
		}
		return activeMask;
	}
	this.getChBw = function(b, c) {
		return this.parseChBw(this.frm[b], c);
	}
	this.getChGfine = function(b, c) {
		return this.parseChGfine(this.frm[b], c);
	}
	this.setReset = function(b) {
		b = b ? 1 : 0;
		try {
			var v = 0x07;
			this.frm[b] = hexformat(v, 2) + this.frm[b].substr(2);
		} catch(err) {}
	}
	this.setRevision = function(b, revision, revisionChange) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['GRAL'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (revision == 0) {
				v &= ~this.MaskGralBits['REVISION'];
			} else {
				v |= this.MaskGralBits['REVISION'];
			}
			if (revisionChange) {
				v |= this.MaskGralBits['REVSWITCH'];
			} else {
				v &= ~this.MaskGralBits['REVSWITCH'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setSimplexMode = function(b, simplex) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['GRAL'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (simplex) {
				v |= this.MaskGralBits['SIMPLEX'];
			} else {
				v &= ~this.MaskGralBits['SIMPLEX'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setSqMode = function(b, mode) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['GRAL'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (mode == this.SqModeVals['NOTLINKED']) {
				v &= ~this.MaskGralBits['MUTEMODE'];
			} else {
				v |= this.MaskGralBits['MUTEMODE'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setRedFiltNr = function(b, nr) {
		b = b ? 1 : 0;
		try {
			var m = (nr << this.MaskGralBits['FILTREDSH']);
			var s = this.AddrMap['GRAL'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			v &= ~this.MaskGralBits['FILTREDMASK'];
			v |= m & this.MaskGralBits['FILTREDMASK'];
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}		
	}
	this.setBandBit = function(b) {
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (b) {
				v |= this.MaskBandBits['BAND'];
			} else {
				v &= ~this.MaskBandBits['BAND'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setSqEn = function(b, sqen) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (sqen) {
				v |= this.MaskBandBits['SQEN'];
			} else {
				v &= ~this.MaskBandBits['SQEN'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setEqBw = function(b, eqbw) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (eqbw) {
				v |= this.MaskBandBits['EQBW'];
			} else {
				v &= ~this.MaskBandBits['EQBW'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setPaEn = function(b, paen) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (paen) {
				v |= this.MaskBandBits['PAEN'];
			} else {
				v &= ~this.MaskBandBits['PAEN'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setSqTh = function(b, sqth) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['SQTH'];
			var v = sqth;
			if (v < 0) {
				v += 0x100;
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setGmain = function(b, gmain) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['GMAIN'];
			var v = gmain;
			if (v > 255) {
				v = 255;
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setPmain = function(b, pmain) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['BAND'] + this.AddrMapBand['PMAIN'];
			var v = pmain;
			if (v < 0) {
				v += 0x100;
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setChStby = function(b, c, stby) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (stby) {
				v |= this.MaskChBits['STBY'];
			} else {
				v &= ~this.MaskChBits['STBY'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setChBw = function(b, c, chbw) {
		b = b ? 1 : 0;
		if (chbw < 0) {
			return null;
		}
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			v &= ~this.MaskChBits['BWMASKOLD'];
			v |= chbw;
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setFilterCombineBit = function(b, c, on) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['CONF'];
			var v = parseInt(this.frm[b].substr(s, 2), 16);
			if (on) {
				v |= this.MaskChBits['BWGAIN'];
			} else {
				v &= ~this.MaskChBits['BWGAIN'];
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	this.setGfine = function(b, c, gfine) {
		b = b ? 1 : 0;
		try {
			var s = this.AddrMap['CH1'] + c*this.AddrMapCh['NR'] + this.AddrMapCh['GFINE'];
			var v = gfine;
			if (v < 0) {
				v += 0x100;
			}
			this.frm[b] = this.frm[b].substr(0, s) + hexformat(v, 2) + this.frm[b].substr(s + 2);
		} catch(err) {}
	}
	try {
		for (var i = 0; i < 2 && i < obj.frm.length; ++i) {
			this.frm.push(obj.frm[i]);
		}
	} catch(e) {}
}
