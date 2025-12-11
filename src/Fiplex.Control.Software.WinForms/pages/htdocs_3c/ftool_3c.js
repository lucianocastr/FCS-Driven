function ftoolGui() {
	var self = this;
	this.factory;
	this.config = new Config();
	this.maxChannels = this.config.CHNR;
	this.filterTypes = FilterTypes;
	this.b = 1;
	this.band = 0;
	this.toolband = [true,true];
	this.proposal;
	this.rej;
	this.frms;
	this.countSubmit;
	this.waitIcon;
	this.carriers;
	this.initialize = function() {
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		this.factory = new Factory(str);
		str = localStorage.getItem("Conf"+Prjstr+window.location.host);
		this.config.parse(str);
		var band = localStorage.getItem("FToolFreqBand"+Prjstr+window.location.host);
		if (typeof(band) !== 'undefined' && band !== null) {
			this.band = band;
		}
		this.toolband = [this.factory.chBandEnabled[0],this.factory.chBandEnabled[1]];
		
		if ((this.factory.fstop[1]-this.factory.fstart[1])!=(this.factory.fstop[0]-this.factory.fstart[0])) this.toolband[0] = false;
		if ((this.factory.fstop[3]-this.factory.fstart[3])!=(this.factory.fstop[2]-this.factory.fstart[2])) this.toolband[1] = false;
		if (this.toolband[0] && !this.toolband[1]) this.band=0;
		if (this.toolband[1] && !this.toolband[0]) this.band=1;
		this.FilterValidSep = FilterValidSeparation[this.band];
		if (this.factory.singleBandEnabled[this.band]) this.maxChannels = 2*this.config.CHNR; 

	}
	this.initialize();
	this.BWKHZ = 100;
	this.bwIndex = 1;
	this.FilterValidSep;
	this.create = function() {
		var box = document.getElementById("contentbox"); 
		box.appendChild(this.createTitles());
		box.appendChild(this.createBandSelect());
		box.appendChild(this.createCarriersArea());
		box.appendChild(this.createComputeButton());
		box.appendChild(this.createFiltProposal());
		box.appendChild(this.createAcceptButton());
		box.appendChild(this.createWaitIcon());
	}
	this.createBandSelect = function(){
		var cont = document.createElement("div");
		var el = document.createElement("select");
		cont.appendChild(el);
		el.id = "bandSelect";
		el.name = el.id;
		for (var band=0;band<2;band++){
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = self.factory.bandNames[band];
			opt.value = band;
		}
		el.value = this.band;
		el.disabled = (this.toolband[0]!=this.toolband[1]);
		el.onchange = function(ev) {
			self.band = this.value=="0"?0:1;
			var el = document.getElementById("carriers");
			self.carriersAreaSetTitle(1, el);
			self.FilterValidSep = FilterValidSeparation[self.band];
			var val = self.recoverSettingCarriers();
			if (val !== null)
				el.value = val;
			else
				el.value = "";
		}
		return cont;
	}
	this.createTitles = function(){
		var cont = document.createElement("div");
		var head = document.createElement("h2");
		head.innerHTML = "Carrier&nbsp;Frequency&nbsp;List";
		cont.appendChild(head);
		head = document.createElement("h3");
		head.innerHTML = "Enter&nbsp;downlink&nbsp;frequencies&nbsp;in\
			&nbsp;MHz&nbsp;separated&nbsp;by&nbsp;spaces";
		cont.appendChild(head);
		return cont;
	}
	this.createCarriersArea = function() {
		var cont = document.createElement("div");
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
		var fstart = (self.factory.fstart[2*this.band+b] / 1e6).toFixed(6);
		var fstop = (self.factory.fstop[2*this.band+b] / 1e6).toFixed(6);
		if (typeof(el) === 'undefined' || !el) {
			el = document.getElementById("carriers");
		}
		el.placeholder = "Min. "+fstart+" MHz, Max. "+fstop+" MHz,";
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
		var outofband = self.checkOutOfBand(inputCarr, b, self.band);
		if (outofband.length > 0) {
			alert("Some carriers are out of band "+ 
				(b == 0 ? "uplink":"downlink"+":\n"+
				outofband));
			return null;
		}
		var carriers = self.dupCarriers(inputCarr);
		self.carriers = carriers;
		var carrList = self.tuneCarriers(carriers, b, self.band);
		carrList.sort(function(a, b) { return (a-b); });
		var groups = self.groupCarriers(carrList);
		var gfilts = self.groupFilts(groups, b, self.band);
		var n = self.computeProposalFiltNr(gfilts);
		if (n > self.maxChannels) {
			alert("Too many filters required: "+n+":\n"+
				"Maximum nr. of filters is "+self.maxChannels); 
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
	this.checkOutOfBand = function(cl, b, band) {
		var fstart = self.factory.fstart[2*band+b];
		var fstop = self.factory.fstop[2*band+b];
		var outofband = [];
		for (var i = 0; i < cl.length; ++i) {
			if (cl[i]*1e6 < fstart || cl[i]*1e6 > fstop) {
				outofband.push(cl[i]);
			}
		}
		return outofband;
	}
	this.tuneCarriers = function(carrList, b, band) {
		var cl = [];
		for (var c = 0; c < carrList.length; ++c) {
			var f = carrList[c] * 1e6;
			var chnr = self.computeChNr(f, b, band);
			var fn = self.computeChFreq(chnr, b, band) / 1e6;
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
		for (var i = 1; i < carrList.length; ++i) {
			if ((~~Math.round((carrList[i] - carrList[i-1])*1e6)) <= this.FilterValidSep*1e3) {
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
	this.groupFilts = function(gList, b, band) {
		var gfList = [];
		for (var i = 0; i < gList.length; ++i) {
			gfList.push(self.computeFiltGnf(gList[i], b, band));
		}
		return gfList;
	}
	this.computeFiltGnf = function(gc, b, band) {
		var gf = [];
		var n = gc.length - 1;
		var bw = ~~Math.round((gc[n] - gc[0])*1e6);
		var fc = ~~Math.round((gc[0] + gc[n])/2*1e6);
		var fstep = self.FilterValidSep*1e3;
		var N = self.computeNrFiltBw3dB(bw, band);
		var fstart = fc - (N - 1) * fstep / 2;
		for (var i = 0; i < N; ++i) {
			var f = fstart + i * fstep;
			var cnr = self.computeChNr(f, b, band);
			gf.push(cnr);
		}
		return gf;
	}
	this.computeNrFiltBw3dB = function(bw, band) {
		var fgr = [];
		fgr.push(self.filterTypes[band][self.bwIndex]['data'][1]*1e3);
		for (var i = 8; i < self.filterTypes[band].length; ++i) {
			fgr.push(self.filterTypes[band][i]['data'][1]*1e3);
		}
		for (var i = 0; i < fgr.length; ++i) {
			if (bw < fgr[i]) {
				return (i+1);
			}
		}
		var n = fgr.length;
		var fstep = self.FilterValidSep*1e3;
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
			self.applyProposal(self.band);
		}
		butwrap.appendChild(el)
		return cont;
	}
	this.showProposal = function(gfilts) {
		var str = "Filter Bandwdith: 100 KHz \n";
		for (var i = 0, n = m = 1; i < gfilts.length; ++i) {
			var filt = gfilts[i];
			if (filt.length == 1) {
				str += "Single filter "+m+":";
				m++;
			} else {
				str += "Group filter "+n+":";
				n++;
			}
			var fr = self.computeFreqsTxt(filt, self.b, self.band);
			str += fr + " MHz\n";
		}
		var proposal = document.getElementById("proposal");
		proposal.value = str;
		var cont = document.getElementById("proposalCont");
		cont.style.display = "block";
		var accept = document.getElementById("acceptCont");
		accept.style.display = "table";
	}
	this.applyProposal = function(band) {
		self.applyFreqs(band);
		self.applyConfs(band);
		self.makeSubmitFrm();
		self.makeStrFrm();
		self.saveSettingVals();
		//filterToolApplyEvent = true;
		localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,1);
	}
	this.applyFreqs = function(band) {
		var chList = [];
		var gfilts = self.proposal;
		for (var i = 0; i < gfilts.length; ++i) {
			var gf = gfilts[i];
			for (var j = 0; j < gf.length; ++j) {
				chList.push(gf[j]);
			}
		}
		var isSplitFixed = true;
		self.config.uldlLinkedFreq[band] = isSplitFixed;
		var b = self.b;
		var a = (b + 1) % 2;
		for (var c = 0; c < chList.length; ++c) {
			var chnr = chList[c];
			var stp = self.factory.fstep;
			if (stp<=1.5e3) stp/=2;
			self.config.freqHz[band][b][c]=self.factory.fref[2*band+b]+stp*chnr;
			self.config.freqHz[band][a][c]=self.config.freqHz[band][b][c]-self.factory.fstart[2*band+b]+self.factory.fstart[2*band+a];
		}
	}
	this.applyConfs = function() {
		for (var b = 0; b < 2; ++b) {
			self.setBandConf(self.config, b, self.proposal, self.band);
		}
		for (var c = 0; c < self.maxChannels; ++c) {
			self.setChConf(self.config, c, self.proposal, self.band);
		}
	}
	this.setBandConf = function(cnf, b, gfilts, band) {
		var rednr = self.computeFilterCombineReduction(gfilts);
		cnf.numberOfFilterNonGrouped[band][b] = rednr;
		cnf.allChSameBW[band][b] = false;
	}
	this.computeFilterCombineReduction = function(gfilts, band) {
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
	this.setChConf = function(cnf, c, gfilts, band) {
		var nfilt = self.computeFiltNr(gfilts);
		var on = c < nfilt;
		var wf = self.filterBelongsToCombination(c, gfilts);
		for (var b = 0; b < 2; ++b) {
			cnf.filterEnabled[0][band][b][c] = on;
			cnf.isFilterGrouped[band][b][c] = false; //force to false by default
			if (!(c < nfilt)) {
				continue;
			}
			cnf.isFilterGrouped[band][b][c] = wf;
			cnf.bwIndex[band][b][c] = self.bwIndex;
			cnf.fineGainFilter[0][band][b][c] = 0;
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
	this.computeFreqsTxt = function(filt, b, band) {
		var str = "";
		for (var i = 0; i < filt.length; ++i) {
			var fr = self.computeChFreq(filt[i], b, band);
			str += " "+(fr / 1e6);
		}
		return str;
	}
	this.computeChFreq = function(chnr, b, band) {
		var fo = self.factory.fref[2*band+b];
		var stp = self.factory.fstep;
		if (stp<=1.5e3) stp/=2;
		var fr = chnr * stp + fo;
		return fr;
	}
	this.computeChNr = function(fr, b, band) {
		var fo = self.factory.fref[2*band+b];
		var stp = self.factory.fstep;
		if (stp<=1.5e3) stp/=2;
		var chnr = ~~Math.round((fr - fo)/stp);
		return chnr;
	}
	this.makeSubmitFrm = function() {
		self.frms = [];
		self.frms.push({type: 'ctl_conf_str=', frame: self.config.getFrm()});
		localStorage.setItem("ftGui_frms"+Prjstr+window.location.host,JSON.stringify(self.frms));

	}
	this.makeStrFrm = function() {
		var toolConfFrame = self.config.getFrm();
		localStorage.setItem("Conf"+Prjstr+window.location.host, toolConfFrame);
	}
	this.saveSettingVals = function() {
		var str = "";
		for (var i = 0; i < self.carriers.length; ++i) {
			if (i > 0) {
				str += "  ";
			}
			str += self.carriers[i];
		}
		var band = this.band;
		if (this.factory.chBandEnabled[0] && this.factory.chBandEnabled[1]){
			var el = document.getElementById("bandSelect");
			band = el.value;
		}
		localStorage.setItem("FToolFreqBand"+Prjstr+window.location.host, band);
		localStorage.setItem("FToolFreq_"+band+"_"+Prjstr+window.location.host, str);
	}
	this.recoverSettingCarriers = function() {
		var band = this.band;
		var carr = localStorage.getItem("FToolFreq_"+band+"_"+Prjstr+window.location.host);
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
	ftGui = new ftoolGui();
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
