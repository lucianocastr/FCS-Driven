function ftoolGui(osc, clk) {
	var self = this;
	this.factory;
	this.confs = new Conf();
	this.freqs = new Frequency();
	this.osc = osc;
	this.clk = clk;
	this.filterTypes = FilterTypes;
	this.b = 1;
	this.proposal;
	this.rej;
	this.frms;
	this.countSubmit;
	this.waitIcon;
	this.carriers;
	this.initialize = function() {
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		this.factory = new Factory(str);
		str = localStorage.getItem("Frequency"+Prjstr+window.location.host);
		this.freqs.parseFrameStr(str);
		str = localStorage.getItem("Conf"+Prjstr+window.location.host);
		this.confs.parseFrameStr(str);
	}
	this.initialize();
	this.BWKHZ = 90;
	this.bwIndex = 0;
	this.FILTSEP90K = FILT90KSTEPKHZ;
	this.create = function() {
		var box = document.getElementById("contentbox"); 
		box.appendChild(this.createCarriersArea());
		box.appendChild(this.createComputeButton());
		box.appendChild(this.createFiltProposal());
		box.appendChild(this.createAcceptButton());
		box.appendChild(this.createWaitIcon());
	}
	this.createCarriersArea = function() {
		var cont = document.createElement("div");
		var head = document.createElement("h2");
		head.innerHTML = "Carrier&nbsp;Frequency&nbsp;List";
		cont.appendChild(head);
		head = document.createElement("h3");
		head.innerHTML = "Enter&nbsp;downlink&nbsp;frequencies&nbsp;in\
			&nbsp;MHz&nbsp;separated&nbsp;by&nbsp;spaces";
		cont.appendChild(head);
		var el = document.createElement("textarea");
		el.id = el.name = "carriers";
		el.className = "carriers";
		el.rows = 5;
		el.onkeypress = function(ev) {
			return (isKeyDecimalPositive(ev) || isSpaceChar(ev) || isCtrlVC(ev));
		}
		this.carriersAreaSetTitle(1, el);
		var val = this.recoverSettingCarriers();
		if (val !== null) {
			el.value = val;
		}
		cont.appendChild(el);
		return cont;
	}
	this.carriersAreaSetTitle = function(b, el) {
		if (typeof(el) === 'undefined' || !el) {
			el = document.getElementById("carriers");
		}
		if (self.factory.hasExcludeFreq(b)){
			el.placeholder = "Frequency Range: "+(self.factory.data.band[b].fStart/1e6) +
			"-"+(self.factory.data.band[b].fStartExc/1e6)+"MHz / " +
			(self.factory.data.band[b].fStopExc/1e6) + "-" + 
			(self.factory.data.band[b].fStop/1e6)+"MHz";
		}else{
			el.placeholder = "Frequency Range: "+(self.factory.data.band[b].fStart/1e6) +
				"-"+(self.factory.data.band[b].fStop/1e6)+"MHz";
		}
	}
	this.createComputeButton = function() {
		var cont = document.createElement("div");
		cont.style.minHeight = "50px";
		cont.style.marginLeft = cont.style.marginRight = "auto";
		cont.style.display = "table";
		var butwrap = document.createElement("div");
		butwrap.style.display = "table-cell";
		butwrap.style.verticalAlign = "middle";
		cont.appendChild(butwrap);
		var el = document.createElement("input");
		el.type = "button";
		el.id = el.name = "compute";
		el.value = "Compute Configuration Proposal";
		el.style.fontWeigh = "bold";
		el.style.fontSize = "12px";
		el.onclick = function(ev) {
			var gfilts = self.computeFilters();
			if (!gfilts) {
				return;
			}
			self.showProposal(gfilts);
			self.proposal = gfilts;
		}
		butwrap.appendChild(el)
		return cont;
	}
	this.computeFilters = function() {
		var b = 1;
		self.b = b;
		var inputCarr = self.readCarriers();
		if (inputCarr.length == 0) {
			return null;
		}
		var outofband = self.checkOutOfBand(inputCarr, b);
		if (outofband.length > 0) {
			alert("Some carriers are out of band "+ 
				(b == 0 ? "uplink":"downlink"+":\n"+
				outofband));
			return null;
		}
		var carriers = self.dupCarriers(inputCarr);
		self.carriers = carriers;
		var carrList = self.tuneCarriers(carriers, b);
		carrList.sort(function(a, b) { return (a-b); });
		var groups = self.groupCarriers(carrList);
		var gfilts = self.groupFilts(groups, b);
		var n = self.computeProposalFiltNr(gfilts);
		if (n > self.confs.CHNR) {
			alert("Too many filters required: "+n+":\n"+
				"Maximum nr. of filters is "+self.confs.CHNR); 
			return null;
		}
		return gfilts;
	}
	this.readCarriers = function() {
		var el = document.getElementById("carriers");
		var arr = el.value.split(/\s+/);
		var carr = [];
		for (var i = 0; i < arr.length; ++i) {
			if (arr[i].length == 0) {
				continue;
			}
			var f = parseFloat(arr[i]);
			if (isNaN(f)) {
				continue;
			}
			carr.push(f);
		}
		return carr;
	}
	this.dupCarriers = function(inpCarr) {
		var carr = [];
		for (var i = 0; i < inpCarr.length; ++i) {
			var val = inpCarr[i];
			if (!inArray(carr, val)) {
				carr.push(val);
			}
		}
		return carr;
	}
	this.checkOutOfBand = function(cl, b) {
		var fstart = self.factory.data.band[b].fStart;
		var fstop = self.factory.data.band[b].fStop;
		var isExcBand = self.factory.hasExcludeFreq(b);
		var fstartExc = self.factory.data.band[b].fStartExc;
		var fstopExc = self.factory.data.band[b].fStopExc;
		var outofband = [];
		for (var i = 0; i < cl.length; ++i) {
			if (cl[i]*1e6 < fstart || cl[i]*1e6 > fstop) {
				outofband.push(cl[i]);
			}else if (isExcBand){
				if (cl[i]*1e6 > fstartExc && cl[i]*1e6 < fstopExc) {
					outofband.push(cl[i]);
				}
			}
		}
		return outofband;
	}
	this.tuneCarriers = function(carrList, b) {
		var cl = [];
		for (var c = 0; c < carrList.length; ++c) {
			var f = carrList[c] * 1e6;
			var chnr = self.computeChNr(f, b);
			var fn = self.computeChFreq(chnr, b) / 1e6;
			cl.push(fn);
		}
		return cl;
	}
	this.groupCarriers = function(carrList) {
		var gList = [];
		var g = [];
		g.push(carrList[0]);
		if (carrList.length == 1) {
			gList.push(g);
		}
		var k = self.clk;
		for (var i = 1; i < carrList.length; ++i) {
			if ((carrList[i] - carrList[i-1])*1e6 < this.FILTSEP90K[k]*1e3) {
				g.push(carrList[i]);
			} else {
				gList.push(g);
				g = [];
				g.push(carrList[i]);
			}
			if (i == carrList.length - 1) {
				gList.push(g);
			}
		}
		return gList;
	}
	this.groupFilts = function(gList, b) {
		var gfList = [];
		for (var i = 0; i < gList.length; ++i) {
			gfList.push(self.computeFiltGnf(gList[i], b));
		}
		return gfList;
	}
	this.computeFiltGnf = function(gc, b) {
		var gf = [];
		var n = gc.length - 1;
		var bw = ~~Math.round((gc[n] - gc[0])*1e6);
		var fc = ~~Math.round((gc[0] + gc[n])/2*1e6);
		var k = self.clk;
		var fstep = self.FILTSEP90K[k]*1e3;
		var N = self.computeNrFiltBw3dB(bw);
		var fstart = fc - (N - 1) * fstep / 2;
		for (var i = 0; i < N; ++i) {
			var f = fstart + i * fstep;
			var cnr = self.computeChNr(f, b);
			gf.push(cnr);
		}
		return gf;
	}
	this.computeNrFiltBw3dB = function(bw) {
		var k = self.clk;
		var fgr = [];
		fgr.push(self.filterTypes[k]['filt'][0]['data'][1]*1e3);
		for (var i = 6; i < self.filterTypes[k]['filt'].length; ++i) {
			fgr.push(self.filterTypes[k]['filt'][i]['data'][1]*1e3);
		}
		for (var i = 0; i < fgr.length; ++i) {
			if (bw < fgr[i]) {
				return (i+1);
			}
		}
		var n = fgr.length;
		var k = self.clk;
		var fstep = self.FILTSEP90K[k]*1e3;
		var N = Math.ceil((bw - fgr[n-1]) / fstep) + n;
		return N;
	}
	this.computeProposalFiltNr = function(gfList) {
		var n = 0;
		for (var i = 0; i < gfList.length; ++i) {
			n += gfList[i].length;
		}
		return n;
	}
	this.createFiltProposal = function() {
		var cont = document.createElement("div");
		cont.id = cont.name = "proposalCont";
		cont.style.display = "none";
		var head = document.createElement("h3");
		head.innerHTML = "Filter&nbsp;Proposal";
		cont.appendChild(head);
		var el = document.createElement("textarea");
		el.id = el.name = "proposal";
		el.className = "carriers";
		el.rows = 10;
		el.disabled = true;
		el.style.backgroundColor = "#DDDDDD";
		cont.appendChild(el);
		return cont;
	}
	this.createAcceptButton = function() {
		var cont = document.createElement("div");
		cont.id = cont.name = "acceptCont";
		cont.style.minHeight = "50px";
		cont.style.marginLeft = cont.style.marginRight = "auto";
		cont.style.display = "none";
		var butwrap = document.createElement("div");
		butwrap.style.display = "table-cell";
		butwrap.style.verticalAlign = "middle";
		cont.appendChild(butwrap);
		var el = document.createElement("input");
		el.type = "button";
		el.id = el.name = "compute";
		el.value = "Apply Proposal";
		el.style.fontWeigh = "bold";
		el.style.fontSize = "12px";
		el.onclick = function(ev) {
			var gfilts = self.computeFilters();
			if (!gfilts) {
				return;
			}
			if (self.proposal != gfilts) {
				self.proposal = gfilts;
				self.showProposal(gfilts);
			}
			self.applyProposal();
		}
		butwrap.appendChild(el)
		return cont;
	}
	this.showProposal = function(gfilts) {
		var str = "Filter Bandwdith: 90 KHz \n";
		for (var i = 0, n = m = 1; i < gfilts.length; ++i) {
			var filt = gfilts[i];
			if (filt.length == 1) {
				str += "Single filter "+m+":";
				m++;
			} else {
				str += "Group filter "+n+":";
				n++;
			}
			var fr = self.computeFreqsTxt(filt, self.b);
			str += fr + " MHz\n";
		}
		var proposal = document.getElementById("proposal");
		proposal.value = str;
		var cont = document.getElementById("proposalCont");
		cont.style.display = "block";
		var accept = document.getElementById("acceptCont");
		accept.style.display = "table";
	}
	this.applyProposal = function() {
		self.applyFreqs();
		self.applyConfs();
		self.makeSubmitFrm();
		self.makeStrFrm();
		self.saveSettingVals();
		//filterToolApplyEvent = true;
		localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,1);
	}
	this.applyFreqs = function() {
		var chList = [];
		var gfilts = self.proposal;
		for (var i = 0; i < gfilts.length; ++i) {
			var gf = gfilts[i];
			for (var j = 0; j < gf.length; ++j) {
				chList.push(gf[j]);
			}
		}
		var isSplitFixed = true;
		self.freqs.setSplit(isSplitFixed);
		var b = self.b;
		var a = (b + 1) % 2;
		for (var c = 0; c < chList.length; ++c) {
			var chnr = chList[c];
			self.freqs.setFreq(b, c, chnr);
			chnr = self.computeChNrOtherBand(chnr, b, c);
			self.freqs.setFreq(a, c, chnr);
		}
	}
	this.applyConfs = function() {
		for (var b = 0; b < 2; ++b) {
			self.setBandConf(self.confs, b, self.proposal);
		}
		for (var c = 0; c < self.freqs.CHNR; ++c) {
			self.setChConf(self.confs, c, self.proposal);
		}
	}
	this.setBandConf = function(cnf, b, gfilts) {
		var rednr = self.computeFilterCombineReduction(gfilts);
		cnf.setRedFiltNr(b, rednr);
		cnf.setBandBit(b);
		cnf.setEqBw(b, false);
	}
	this.computeFilterCombineReduction = function(gfilts) {
		var nfilt = 0, ngroups = 0, nsingle = 0;
		for (var i = 0; i < gfilts.length; ++i) {
			var n = gfilts[i].length;
			if (n > 1) {
				ngroups++;
			} else {
				nsingle++
			}
			nfilt += n;
		}
		return (nfilt - (ngroups + nsingle));
		return ngroups;
	}
	this.setChConf = function(cnf, c, gfilts) {
		var nfilt = self.computeFiltNr(gfilts);
		var on = c < nfilt;
		var wf = self.filterBelongsToCombination(c, gfilts);
		for (var b = 0; b < 2; ++b) {
			cnf.setChStby(b, c, !on);
			if (!(c < nfilt)) {
				continue;
			}
			cnf.setFilterCombineBit(b, c, wf);
			cnf.setChBw(b, c, self.bwIndex);
			cnf.setGfine(b, c, 0);
		}
	}
	this.computeFiltNr = function(gfilts) {
		var nfilt = 0;
		for (var i = 0; i < gfilts.length; ++i) {
			var n = gfilts[i].length;
			nfilt += n;
		}
		return nfilt;
	}
	this.filterBelongsToCombination = function(c, gfilts) {
		var nfilt = 0, ngroups = 0;
		for (var i = 0; i < gfilts.length; ++i) {
			var n = gfilts[i].length;
			nfilt += n;
			if (c < nfilt) {
				var isGroup = (n > 1);
				return isGroup;
			}
		}
		return false;
	}
	this.hideProposal = function() {
		var el = document.getElementById("proposalCont");
		el.style.display = "none";
		el = document.getElementById("acceptCont");
		el.style.display = "none";
	}
	this.computeFreqsTxt = function(filt, b) {
		var str = "";
		for (var i = 0; i < filt.length; ++i) {
			var fr = self.computeChFreq(filt[i], b);
			str += " "+(fr / 1e6);
		}
		return str;
	}
	this.computeChFreq = function(chnr, b) {
		var fo = self.factory.data.band[b].fo;
		var fstep = self.factory.data.fstep;
		var fr = chnr * fstep + fo;
		return fr;
	}
	this.computeChNr = function(fr, b) {
		var fo = self.factory.data.band[b].fo;
		var fstep = self.factory.data.fstep;
		var chnr = ~~Math.round((fr - fo)/fstep);
		return chnr;
	}
	this.computeChNrOtherBand = function(chnr, b, c) {
		var fr = self.computeChFreq(chnr, b);
		var diff = fr - self.factory.data.band[b].fStart;
		var a = (b + 1) % 2;
		fr = self.factory.data.band[a].fStart + diff;
		var num = self.computeChNr(fr, a, c);
		return num;
	}
	this.makeSubmitFrm = function() {
		self.frms = [];
		for (var b = 0; b < self.freqs.frm.length && b < 2; ++b) {
			self.frms.push({type: 'frequency_str=', frame: self.freqs.frm[b]});
		}
		for (var b = 0; b < self.confs.frm.length && b < 2; ++b) {
			self.frms.push({type: 'confs_str=', frame: self.confs.frm[b]});
		}
		localStorage.setItem("ftGui_frms"+Prjstr+window.location.host,JSON.stringify(self.frms));
	}
	this.makeStrFrm = function() {
		var toolFreqsFrame = "";
		for (var b = 0; b < self.freqs.frm.length && b < 2; ++b) {
			toolFreqsFrame += self.freqs.frm[b];
			if (b == 0) {
				toolFreqsFrame += "\t";
			}
		}
		localStorage.setItem("Frequency"+Prjstr+window.location.host, toolFreqsFrame);
		var toolConfsFrame = "";
		for (var b = 0; b < self.confs.frm.length && b < 2; ++b) {
			toolConfsFrame += self.confs.frm[b];
			if (b == 0) {
				toolConfsFrame += "\t";
			}
		}
		localStorage.setItem("Conf"+Prjstr+window.location.host, toolConfsFrame);
	}
	this.saveSettingVals = function() {
		var str = "";
		for (var i = 0; i < self.carriers.length; ++i) {
			if (i > 0) {
				str += "  ";
			}
			str += self.carriers[i];
		}
		localStorage.setItem("FToolFreq"+Prjstr+window.location.host, str);
	}
	this.recoverSettingCarriers = function() {
		var carr = localStorage.getItem("FToolFreq"+Prjstr+window.location.host);
		if (typeof(carr) !== 'undefined' && carr !== null) {
			return carr;
		}
		return null;
	}
	this.createWaitIcon = function() {
		var cont = document.createElement("div");
		cont.id = cont.name = "resultCont";
		cont.style.display = "none";
		cont.style.height = "50px";
		cont.style.width = "200px";
		cont.style.marginLeft = cont.style.marginRight = "auto";
		var pic = document.createElement("img");
		pic.src = "blank.gif";
		pic.width = "45px";
		pic.height = "45px";
		pic.id = "resultPic";
		cont.appendChild(pic);
		self.waitIcon = new BallIcon(pic, 100);
		return cont;
	}
	this.hideWaitIcon = function() {
		var el = document.getElementById("resultCont");
		el.style.display = "none";
	}
	this.showWaitIcon = function(num) {
		try {
			var cont = document.getElementById("resultCont");
			cont.style.display = "block";
			var el = document.getElementById("resultPic");
			self.waitIcon.cancel();
			el.style.position = "inherit";
			el.style.width = "45px";
			el.style.height = "45px";
			switch (num) {
			default:
			case ERR_NONE:	el.src = "/blank.gif"; break;
			case ERR_OK: 	el.src = "/tick.png"; break;
			case ERR_FAIL: 	el.src = "/cross.png"; break;
			case ERR_PENDING: self.waitIcon.redraw(); break;
			}
		} catch (err) {}
	}
}

var ftGui;
var filterToolChangedEvent = false;
//var filterToolApplyEvent = false;
localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,0);


function ftonload() {
	//document.title = "";
	var osc, clk;
	var q = param();
	if (q['osc']) {
		var o = entify(q['osc']);
		try {
			osc = parseInt(o);
		} catch(e) { osc = 150; }
	} else {
		osc = 150;
	}
	if (q['clk']) {
		var c = entify(q['clk']);
		try {
			clk = parseInt(c);
		} catch(e) { clk = 1; }
	} else {
		clk = 1;
	}
	ftGui = new ftoolGui(osc, clk);
	ftGui.create();
	setTimeout(function() {
		ftGui.hideProposal(); 
		ftGui.hideWaitIcon();
	}, 500);
	startWatchDog();
}
function startWatchDog(){
	localStorage.setItem("fToolTime"+Prjstr+window.location.host,Date.now());
	setTimeout(function() {startWatchDog();}, 1000);
}
