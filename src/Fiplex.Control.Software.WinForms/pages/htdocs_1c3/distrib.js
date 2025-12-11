<!--
var distrib;
var tmrIdFact;
var countCheck;

function onloadInit() {
	distrib = new Distrib();
	var frm = window.parent.navi.factoryFrame;
	distrib.parseFact(frm);
	var r = window.parent.navi.currentRevision;
	frm = window.parent.navi.configFrame[r];
	distrib.parseConf(frm);
	distrib.bwType = distrib.config.bwType;
	distrib.createForm();
	distrib.render();
	initFormChangeCheck();
	guiBlocked(false);
}
function reloadData() {
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	factReq();	
}
function Distrib() {
	this.factory = new Factory();
	this.config = new Config();
	this.formMap = [
		{label: 'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;(Hz)', idStr: 'fstart'},
		{label: 'BAND&nbsp;STOP&nbsp;FREQUENCY&nbsp;(Hz)',  idStr: 'fstp'}
	];
	this.bandMargin = {
		min: 450000000,
		max: 470000000
	};
	this.bwType = 0;
	this.maxBw = 5000000;
	this.maxHalfBw = 2500000;
	this.fRefStep = 1250000;
	this.sampleFreq = 80000000;
	this.rfDacStep = 1875000;
	this.rfDacDif = 7500000;
	this.rfOl = 480000000;
	this.ncoTxOl = 40000000;
	this.prescaler = 1;	//ON
	this.fmodulo = 3200;
	this.fstep = 3125;
	this.fastAgc = 1;	//OFF
	this.bwmask = 0x1F;	//all
	this.dacspect = 0;	//INVERT
	this.dacmode = 0;	//2C
	this.fdummyC = 0x0125;
	this.fmoduloAdj = 800;
	this.fstepAdj = 25000;
	this.createForm = function() {
		var Texts = TextEn;
		var row, cell, el;
		var cont = document.getElementById("page");
		var frm = document.createElement("input");
		frm.type = "hidden";
		frm.name = "factory_str";
		frm.id = frm.name;
		frm.value = "";
		cont.appendChild(frm);
		var mainTab = document.createElement("table");
		mainTab.style.borderSpacing = '20px';
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		this.createTitles(mainTb, "BAND&nbsp;FREQUENCY", 2);
		var title = "Min: "+this.bandMargin.min+", Max: "+this.bandMargin.max;
		for (var i = 0; i < this.formMap.length; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.formMap[i].label;
			for (var j = 0; j < 2; ++j) {
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("input");
				el.type = "text";
				el.size = 14;
				el.className = "number";
				el.id = this.formMap[i].idStr + '_' + j;
				el.name = el.id;
				el.title = title;
				el.onkeypress = function(ev) {
					return numbersOnly(ev);
				}
				cell.appendChild(el);
			}
		}
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		cell.colSpan = 3;
		cell.innerHTML = "BAND&nbsp;MARGIN&nbsp;LIMITS&nbsp;[Min:&nbsp;"
		+(this.bandMargin.min/1e6).toFixed(0)+"&nbsp;MHz,&nbsp;Max:&nbsp;"
		+(this.bandMargin.max/1e6).toFixed(0)+"&nbsp;MHz]";
		cell.style.color = "black";
		row.appendChild(cell);
	}
	this.createTitles = function(mainTb, titleTxt, n) {
		var Texts = TextEn;
		var row = document.createElement("tr");
		row.style = "height: 20px";
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.colSpan = 2;
		cell.innerHTML = titleTxt;
		cell.style.color = "black";
		row.appendChild(cell);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		for (var i = 0; i < n; ++i) {
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
		}
	}
	this.parseFact = function(factFrame) {
		this.factFrm = factFrame;
		this.factory.parse(factFrame);
	}
	this.parseConf = function(confFrame) {
		this.confFrm = confFrame;
		this.config.parse(confFrame);
		this.computeFilterFreq();
	}
	this.render = function() {
		for (var i = 0; i < this.formMap.length; ++i) {
			for (var j = 0; j < 2; ++j) {
				var id = this.formMap[i].idStr + '_' + j;
				var el = document.getElementById(id);
				if (i == 0) {
					el.value = this.factory.data.band[j].fStart;
				} else {
					el.value = this.factory.data.band[j].fStop;
				}
			}
		}
	}
	this.format = function() {
		var frq = this.readForm();
		var frm = this.computeFact(frq);
		this.submitFactFrm = frm;
		return frm; 
	}
	this.formatConf = function() {
		this.computeFilterNr();
		var frm = this.config.serialize(this.factory);
		this.submitConfFrm = frm;
		return frm;
	}
	this.readForm = function() {
		var res = [];
		for (var i = 0; i < this.formMap.length; ++i) {
			var r = [];
			for (var j = 0; j < 2; ++j) {
				var id = this.formMap[i].idStr + '_' + j;
				var el = document.getElementById(id);
				var num;
				try {
					num = parseInt(el.value);
				} catch (e) {
					if (i == 0)
						num = this.factory.data.band[j].fStart;
					else
						num = this.factory.data.band[j].fStop;
				}
				r.push(num);
			}
			res.push(r);
		}
		return res;
	}
	this.computeFact = function(frq) {
		for (var i = 0; i < this.formMap.length; ++i) {
			for (var j = 0; j < 2; ++j) {
				var num = frq[i][j];
				if (i == 0) {
					if (num < this.bandMargin.min || num > this.bandMargin.max)
						num = this.bandMargin.min;
					this.factory.data.band[j].fStart = num;
				} else {
					if (num < this.bandMargin.min || num > this.bandMargin.max)
						num = this.bandMargin.max;
					this.factory.data.band[j].fStop = num;
				}
			}
		}
		for (var j = 0; j < 2; ++j) {
			if (this.factory.data.band[j].fStop < this.factory.data.band[j].fStart) {
				var num = this.factory.data.band[j].fStop;
				this.factory.data.band[j].fStop = this.factory.data.band[j].fStart;
				this.factory.data.band[j].fStart = num;
			}
			if (Math.abs(this.factory.data.band[j].fStop - this.factory.data.band[j].fStart) > this.maxBw) {
				this.factory.data.band[j].fStop = this.factory.data.band[j].fStart + this.maxBw;
				if (this.factory.data.band[j].fStop > this.bandMargin.max) {
					this.factory.data.band[j].fStop = this.bandMargin.max;
				}
			}
		}
		this.computFactoryParms();
		var frm = this.factory.serialize(this.factFrm);
		return frm;
	}
	this.computFactoryParms = function() {
		this.factory.data.fmodulo = this.fmodulo;
		this.factory.data.fstep = this.fstep;
		this.factory.data.fmoduloAdj = this.fmoduloAdj;
		this.factory.data.fstepAdj = this.fstepAdj;
		this.factory.data.fastAgc = this.fastAgc;
		this.factory.data.bwmask = this.bwmask;
		for (var i = 0; i < 2; ++i) {
			this.factory.data.band[i].oscsel = this.prescaler;
		}
		this.factory.data.dacspect = this.dacspect;
		this.factory.data.dacmode = this.dacmode;
		var frefs = this.computeFRefs();
		var s = this.factory.data.band[0].fStart < this.factory.data.band[1].fStart ? 0 : 1;
		for (var i = 0; i < 2; ++i) {
			this.factory.data.band[i].fo = frefs[s][i];
		}
		this.computeNcoRx();
		var rfDacArr = this.computeRfDacs();
		var rfDacs = [];
		for (var i = 0; i < 2; ++i) {
			rfDacs[i] = rfDacArr[s][i];
		}
		this.computeDacFtw(rfDacs);
		this.computeNcoTx(rfDacs);
		var fDummyArr = this.computeFrDummy(rfDacs);
		if (s == 0) {
			this.factory.data.band[0].fdummy = this.fdummyC;
			this.factory.data.band[1].fdummy = fDummyArr[1];
		} else {
			this.factory.data.band[0].fdummy = fDummyArr[0];
			this.factory.data.band[1].fdummy = this.fdummyC;
		}
	}
	this.computeFRefs = function() {
		var fLim, k, num;
		var fStop = [], fStart = [];
		for (var i = 0; i < 2; ++i) {
			fLim = this.factory.data.band[i].fStop - this.maxHalfBw;
			k = ~~(fLim / this.fRefStep);
			num = k * this.fRefStep;
			if (num < fLim) {
				num += this.fRefStep
			}
			fStop.push(~~num);
		}
		for (var i = 0; i < 2; ++i) {
			fLim = this.factory.data.band[i].fStart + this.maxHalfBw;
			k = ~~(fLim / this.fRefStep);
			fStart.push(~~(k * this.fRefStep));
		}
		var frefs = [];
		frefs.push([]);
		(frefs[0]).push(fStop[0]);
		(frefs[0]).push(fStart[1]);
		frefs.push([]);
		(frefs[1]).push(fStart[0]);
		(frefs[1]).push(fStop[1]);
		return frefs;
	}
	this.computeNcoRx = function() {
		for (var i = 0; i < 2; ++i) {
			var num = (this.factory.data.band[i].fo % this.sampleFreq) / this.fRefStep;
			num = ~~Math.round(num);
			if (num < 0) {
				num = 0;
			} else if (num > 63) {
				num = 63;
			}
			this.factory.data.band[i].ncoRx = num;
		}
	}
	this.computeRfDacs = function() {
		var fDif, k, num;
		var rfDacA = [], rfDacB = [];
		for (i = 0; i < 2; ++i) {
			fDif = this.factory.data.band[i].fo - this.rfDacDif;
			k = ~~(fDif / this.rfDacStep);
			num = k * this.rfDacStep;
			rfDacA.push(num);
			fDif = this.factory.data.band[i].fo + this.rfDacDif;
			k = ~~(fDif / this.rfDacStep);
			num = k * this.rfDacStep;
			if (num < fDif) {
				num += this.rfDacStep;
			}
			rfDacB.push(num);
		}
		var rfDacs = [];
		rfDacs.push([]);
		(rfDacs[0]).push(rfDacA[0]);
		(rfDacs[0]).push(rfDacB[1]);
		rfDacs.push([]);
		(rfDacs[1]).push(rfDacB[0]);
		(rfDacs[1]).push(rfDacA[1]);
		return rfDacs;
	}
	this.computeDacFtw = function(rfDacs) {
		for (var i = 0; i < 2; ++i) {
			var num = (1 - rfDacs[i] / this.rfOl) * 256;
			num = ~~Math.round(Math.abs(num));
			num &= 0xFF;
			num <<= 24;
			this.factory.data.band[i].ftw = num;
		}
	}
	this.computeNcoTx = function(rfDacs) {
		for (var i = 0; i < 2; ++i) {
			var num = (this.factory.data.band[i].fo - rfDacs[i]) / this.ncoTxOl;
			num *= 256;
			num = ~~Math.round(num);
			if (num < 0) {
				num += 256;
			}
			num &= 0xFF;
			this.factory.data.band[i].ncoTx = num;
		}
	}
	this.computeFrDummy = function(rfDacs) {
		var arr = [];
		for (var i = 0; i < 2; ++i) {
			var fDummy = 1;
			var rfDummy = rfDacs[i] + this.ncoTxOl / 512;
			var rfDummyStep = 2 * this.ncoTxOl / 512;
			while (rfDummy <= this.rfOl) {
				rfDummy += rfDummyStep;
				fDummy += 2;
			}
			if (fDummy > 1)
				fDummy -= 2;
			arr.push(fDummy);
		}
		return arr;
	}
	this.computeFilterFreq = function() {
		self.filterFrq = [];
		var fs = self.bwType == 0 ? self.factory.data.fstep : self.factory.data.fstepAdj;
		for (var i = 0; i < 2; ++i) {
			var fo = self.factory.data.band[i].fo;
			var fStart = self.factory.data.band[i].fStart;
			var fStop = self.factory.data.band[i].fStop;
			var r = [];
			for (var j = 0; j < self.config.maxChannels; ++j) {
				if (self.bwType == 0) {
					var f = self.config.conf.band[i].ch[j].frqNr * fs + fo;
					if (f < fStart) {
						f = fStart;
					} else if (f > fStop) {
						f = fStop;
					}
				} else {
					var f = [];
					for (var k = 0; k < 2; ++k) {
						var chnr = k == 0 ? self.config.conf.band[i].ch[j].frqNr :
							self.config.conf.band[i].ch[j].frqNrStop;
						var fr = chnr * fs + fo;
						if (fr < fStart) {
							fr = fStart;
						} else if (f > fStop) {
							fr = fStop;
						}
						f.push(fr);
					}
					if (f[0] > f[1]) {
						var g = f[0];
						f[0] = f[1];
						f[1] = g;
					}
					var bw = Math.abs(f[1] - f[0]);
					if (bw < self.config.bwVarStepHz) {
						if (f[0] == fStart) {
							f[1] = f[0] + self.config.bwVarStepHz;
						} else if (f[1] == fStop) {
							f[0] = f[1] - self.config.bwVarStepHz;
						} else {
							f[1] = f[0] + self.config.bwVarStepHz;
						}
					} else if (bw > self.maxBw(i)) {
						f[1] = f[0] + self.maxBw(i);
					}
				}
				r.push(f);
			}
			self.filterFrq.push(r);
		}
	}
	this.computeFilterNr = function() {
		var fArr = [];
		var fs = self.bwType == 0 ? self.factory.data.fstep : self.factory.data.fstepAdj;
		for (var i = 0; i < 2; ++i) {
			var fo = self.factory.data.band[i].fo;
			var fStart = self.factory.data.band[i].fStart;
			var fStop = self.factory.data.band[i].fStop;
			var r = [];
			for (var j = 0; j < self.config.maxChannels; ++j) {
				if (self.bwType == 0) {
					var f = self.filterFrq[i][j];
					if (f < fStart) {
						f = fStart;
					} else if (f > fStop) {
						f = fStop;
					}
					var num = ~~Math.round((f - fo) / fs);
					self.config.conf.band[i].ch[j].frqNr = num;
					f = num * fs + fo;
				} else {
					var f = [];
					for (k = 0; k < 2; ++k) {
						var fr = self.filterFrq[i][j][k];
						if (fr < fStart) {
							fr = fStart;
						} else if (fr > fStop) {
							fr = fStop;
						}
						if (k == 0) {
							if (fr == fStop) {
								fr -= self.config.bwVarStepHz;
							}
							var num = ~~Math.round((fr - fo) / fs);
							self.config.conf.band[i].ch[j].frqNr = num;
						} else {
							if (fr == fStart) {
								fr += self.config.bwVarStepHz;
							}
							var num = ~~Math.round((fr -fo) / fs);
							self.config.conf.band[i].ch[j].frqNrStop = num;
						}
						fr = num * fs + fo;
						f.push(fr);
					}
				}
				r.push(f);
			}
			fArr.push(r);
		}
		if (self.config.conf.control.split != 0) {
			return;
		}
		var split = this.factory.data.band[1].fStart - this.factory.data.band[0].fStart;
		for (var i = 0; i < this.config.maxChannels; ++i) {
			if (self.bwType == 0) {
				var fr = fArr[1][i] - split;
				if (fr == fArr[0][i]) {
					continue;
				}
				var frqNr = ~~Math.round((fr - this.factory.data.band[0].fo) / fs);
				this.config.conf.band[0].ch[i].frqNr = frqNr;
			} else {
				var f = fArr[1][i];
				var fcd = ~~Math.round((f[0] + f[1]) / 2 - split);
				f = fArr[0][i];
				var fc = ~~Math.round((f[0] + f[1]) / 2);
				if (fcd == fc) {
					continue;
				}
				var bw2 = ~~Math.round(Math.abs(f[1] - f[0]) / 2);
				f[0] = fcd - bw2;
				f[1] = fcd + bw2;
				var chnr = [];
				for (var k = 0; k < 2; ++k) {
					chnr.push(~~Math.round((f[k] - this.factory.data.band[0].fo) / fs));
				}
				this.config.conf.band[0].ch[i].frqNr = chnr[0];
				this.config.conf.band[0].ch[i].frqNrStop = chnr[1];
			}
		}
	}
/*
	this.computeFilterNr = function() {
		var fs = this.factory.data.fstep;
		var fArr = [];
		for (var i = 0; i < 2; ++i) {
			var fo = this.factory.data.band[i].fo;
			fArr.push([]);
			for (var j = 0; j < this.config.maxChannels; ++j) {
				var fr = this.filterFrq[i][j];
				if (fr < this.factory.data.band[i].fStart) {
					fr = this.factory.data.band[i].fStart;
				} else if (fr > this.factory.data.band[i].fStop) {
					fr = this.factory.data.band[i].fStop;
				}
				var num = ~~Math.round((fr - fo) / fs);
				this.config.conf.band[i].ch[j].frqNr = num;
				fr = num * fs + fo;
				fArr[i].push(fr);
			}
		}
		if (this.config.conf.control.split != 0) {
			return;
		}
		var split = this.factory.data.band[1].fStart - this.factory.data.band[0].fStart;
		for (var i = 0; i < this.config.maxChannels; ++i) {
			var fr = fArr[1][i] - split;
			if (fr == fArr[0][i]) {
				continue;
			}
			var frqNr = ~~Math.round((fr - this.factory.data.band[0].fo) / fs);
			this.config.conf.band[0].ch[i].frqNr = frqNr;
		}
	}
*/
	this.maxBw = function(b) {
		var bw =  Math.abs(Math.abs(self.factory.data.band[b].fStop
			- self.factory.data.band[b].fStart));
		if (bw > self.config.bwVarMaxHz) {
			bw = self.config.bwVarMaxHz;
		}
		return bw;
	}
	this.factFrm = '';
	this.confFrm = '';
	this.filterFrq = [];
	this.submitState = 0;
	this.submitFactFrm = '';
	this.submitConfFrm = '';
	var self = this;
}
function factReq() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				setTimeout(function() { load_fact(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
		}
		xhr.ontimeout = function(ev) {
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "distrib.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var serverResponse = this.responseText;
				factStr = serverResponse;
				window.parent.navi.factoryFrame = serverResponse;
				distrib.parseFact(serverResponse);
				distrib.render();
				initFormChangeCheck();
				guiBlocked(false);
			}
		}
		xhr.onerror = function(ev) {
		}
		xhr.ontimeout = function(ev) {
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform() {
	if (!checkChange())
		return;
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	clearTimeout(tmrIdFact);
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	var frm = distrib.format();
	distrib.submitState = 1;
	factStr = frm;
	document.getElementById("factory_str").value = frm;
	doSubmit("factory_str="+frm);
}
function doSubmit(cmdStr) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countCheck = 0;
					setTimeout(function() { check_result(); }, 100);
				} else {
					showResultIcon(ERR_FAIL);
					setTimeout(function() { xhrOnEnd(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.open("POST", "distrib.zhtml", true);
		xhr.timeout = 5000;
		xhr.send(cmdStr);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		guiBlocked(false);
		clearTimeout(tmrIdFact);
	};
})();

function xhrOnStart() {
	guiBlocked(true);
}

function xhrOnEnd() {
	distrib.submitState = 0;
	factReq();
}

function check_result() {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 35) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
				}
				if (error == ERR_FAIL) {
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
					return;
				}
				if (distrib.submitState == 1) {
					window.parent.navi.factoryFrame = distrib.submitFactFrm;
					distrib.parseFact(distrib.submitFactFrm);
					distrib.submitState = 2;
					var frm = distrib.formatConf();
					countCheck = 0;
					document.getElementById("ctl_conf_str").value = frm;
					doSubmit("ctl_conf_str="+frm);
				} else if (distrib.submitState == 2) {
					distrib.parseConf(distrib.submitConfFrm);
					var r = config.conf.control.revision;
					window.parent.navi.currentRevision = distrib.config.conf.control.revision;
					window.parent.navi.configFrame[r] = distrib.submitConfFrm;
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
				} else {
					error = ERR_FAIL;
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 		
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
// -->