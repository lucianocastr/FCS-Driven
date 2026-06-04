function ftoolGui() {
	var self = this;
	this.factory;
	this.config = new ConfigBDA();
	this.cnfToSend = new ConfigBDA(); //config to send, keeping original config separate
	this.maxChannels = 2*this.config.CHNR;
	this.b = 1;
	this.band = 0;
	this.minBwIndex = 2; //minimum BW index allowed in ftool
	this.numberingMode = 0;
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
		var ret = this.config.parse(str);
		if (ret==-2){//blocked
			window.close();
			return;
		}
		var band = localStorage.getItem("FToolFreqBand"+Prjstr+window.location.host);
		if (typeof(band) !== 'undefined' && band !== null) {
			this.band = band;
		}
		var numberingMode = localStorage.getItem("FToolNumbering"+Prjstr+window.location.host);
		if (typeof(numberingMode) !== 'undefined' && numberingMode !== null) {
			this.numberingMode = numberingMode;
		}
		this.toolband = [this.factory.chBandEnabled[0],this.factory.chBandEnabled[1]];
		
		if ((this.factory.fstop[1]-this.factory.fstart[1])!=(this.factory.fstop[0]-this.factory.fstart[0])) this.toolband[0] = false;
		if ((this.factory.fstop[3]-this.factory.fstart[3])!=(this.factory.fstop[2]-this.factory.fstart[2])) this.toolband[1] = false;
		if (this.toolband[0] && !this.toolband[1]) this.band=0;
		if (this.toolband[1] && !this.toolband[0]) this.band=1;
	}
	this.initialize();
	
	this.create = function() {
		var box = document.getElementById("contentbox"); 
		box.appendChild(this.createTitles());
		box.appendChild(this.createOptions());
		box.appendChild(this.createCarriersArea());
		box.appendChild(this.createComputeButton());
		box.appendChild(this.createFiltProposal());
		box.appendChild(this.createAcceptButton());
		box.appendChild(this.createWaitIcon());
	}
	this.updateMaxChannels = function(band){
		var otherBand = 1-band;
		if (self.factory.chBandEnabled[otherBand]){//if the other band is enabled, reduce the max channels accordingly
			self.maxChannels = 2*self.config.CHNR - numEnabledFilts(otherBand,0,self.config,self.factory);
		}else{
			self.maxChannels = 2*self.config.CHNR;
		}
	}
	this.createOptions = function(){
		var cont = document.createElement("div");
		var tab = document.createElement("table");
		tab.style.margin = "auto";
		cont.appendChild(tab);
		var tr = document.createElement("tr");
		tab.appendChild(tr);
		var td = document.createElement("th");
		td.style.textAlign = "left";
		td.innerHTML = "Select Frequency Band:";
		tr.appendChild(td);
		td = document.createElement("td");
		tr.appendChild(td);
		td.style.textAlign = "left";
		var el = document.createElement("select");
		td.appendChild(el);
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
		self.updateMaxChannels(self.band);
		el.onchange = function(ev) {
			var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
			self.config.parse(str); //update config to use latest config
			self.band = this.value=="0"?0:1;
			self.updateMaxChannels(self.band);
			var el = document.getElementById("carriers");
			self.carriersAreaSetTitle(1, el);
			var val = self.recoverSettingCarriers();
			if (val !== null)
				el.value = val;
			else
				el.value = "";
		}
		var td = document.createElement("th");
		td.style.textAlign = "left";
		td.style.paddingLeft = "20px";
		td.innerHTML = "NOTE: filter tool will use 75KHz bandwidth filters as preferred option<br>If separation between carriers is too small, 100KHz or 150KHz or group of 150KHz<br>filters will be used.";
		tr.appendChild(td);
		tr = document.createElement("tr");
		tab.appendChild(tr);
		td = document.createElement("th");
		td.innerHTML = "Filter Indexing Mode:";
		td.style.textAlign = "left";
		tr.appendChild(td);
		td = document.createElement("td");
		tr.appendChild(td);
		td.colSpan = 2;
		td.style.textAlign = "left";
		var el = document.createElement("select");
		td.appendChild(el);
		el.id = "indexSelect";
		el.name = el.id;
		var optNumbering = ["Preserve filter indexes of the other band",
			"Place " + self.factory.bandNames[0] + " filters at the lower indexes and " + self.factory.bandNames[1] +" filters afterwards",
			"Place " + self.factory.bandNames[0] + " filters at the lower indexes and " + self.factory.bandNames[1] +" filters at the end"];
		for (var i=0;i<optNumbering.length;i++){
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = optNumbering[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			self.numberingMode = parseInt(this.value);
		}
		var nbands = self.factory.chBandEnabled[0]?1:0;
		nbands += self.factory.chBandEnabled[1]?1:0;
		if (nbands<2) tr.style.display = "none";
		el.value = nbands>1?self.numberingMode:0;
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
		var gfilts = self.groupCarriers(carrList, b, self.band);
		var n = self.computeProposalFiltNr(gfilts);
		if (n > self.maxChannels) {
			var mess = "Too many filters required: "+n+":\n"+ "Maximum nr. of filters is "+self.maxChannels;
			if (self.maxChannels < 2*self.config.CHNR) mess+= ",\nsince " + self.factory.bandNames[1-self.band] + " is using " + (2*self.config.CHNR-self.maxChannels) + " filters";
			alert(mess); 
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
	this.groupCarriers = function(carrList, b, band) {
		var cList = [];
		var n_attempts=0;
		for (var i=0;i<carrList.length;i++) cList.push(carrList[i]); //copy of carrList
		do{
			//compute filter configuration (freq, bw, and groups)
			var gList = [];
			var g = [];
			g.push(cList[0]);
			if (cList.length == 1) {
				gList.push(g);
			}
			var validSep = self.config.computeBWFromIndex(self.minBwIndex) * 1000 * 1.6; //in Hz, belonging to 1.6 * (75+75)/2 KHz filter BW
			for (var i = 1; i < cList.length; ++i) {
				if ((~~Math.round((cList[i] - cList[i-1])*1e6)) <= validSep) {
					g.push(cList[i]);
				} else {
					gList.push(g);
					g = [];
					g.push(cList[i]);
				}
				if (i == cList.length - 1) {
					gList.push(g);
				}
			}
			var gfList = [];
			for (var i = 0; i < gList.length; ++i) {
				gfList.push(self.computeFiltGnf(gList[i], b, band));
			}
			//load freqs and bws on new arrays to check conflicts
			var fList = [];
			var bwList = [];
			var conflict = false;
			for (var i=0;i<gfList.length;i++){
				for (var  j=0;j<gfList[i].ch.length;j++){
					fList.push(self.computeChFreq(gfList[i].ch[j], b, band)); //in Hz
					bwList.push(gfList[i].bwIndex);
				}
			}
			//check conflicts
			for (var i=1;i<cList.length;i++){
				var f1 = fList[i-1]; //in Hz
				var f2 = fList[i]; //in Hz
				var sep = Math.abs(f2 - f1);
				var b1 = self.config.computeBWFromIndex(bwList[i-1]);
				var b2 = self.config.computeBWFromIndex(bwList[i]);
				var validSep = (b1+b2)/2*1.6*1000; //in Hz
				if (bwList[i]==0 && bwList[i-1]==0) validSep = FilterTypes[0].validSep*1000; //special case for 150KHz filters
				if (sep<validSep){
					conflict = true;
					//console.log("Conflict between freqs "+f1+" and "+f2+" with sep="+sep+" validSep="+validSep);
					cList.push((f1+f2)/2/1e6); //add new carrier in between to fill the gap and resolve freq conflicts
				}
			}
			cList.sort();
			n_attempts++;
		}while(conflict && n_attempts<2); //2 attempts to solve conflicts
		if (conflict) alert("Could not resolve all frequency conflicts. Please revise the carrier list.");
		return gfList;
	}
	this.computeFiltGnf = function(gc, b, band) {
		var gf = [];
		var n = gc.length - 1;
		var bw = ~~Math.round((gc[n] - gc[0])*1e6);
		var fc = ~~Math.round((gc[0] + gc[n])/2*1e6);
		var resultFilt = self.computeNrFiltBw3dB(bw);
		if (resultFilt.N==1){
			var cnr = [self.computeChNr(fc, b, band)];
			return {ch: cnr, bwIndex: resultFilt.bwIndex}; //if single filter return chnr, with bw
		}
		var fstep = ~~Math.round(FilterTypes[0].validSep * 1000);
		var fstart = fc - (resultFilt.N - 1) * fstep / 2;
		for (var i = 0; i < resultFilt.N; ++i) {
			var f = fstart + i * fstep;
			var cnr = self.computeChNr(f, b, band);
			gf.push(cnr);
		}
		return {ch: gf, bwIndex: 0}; //if single filter return chnr array with bw=150KHz
	}
	this.computeNrFiltBw3dB = function(bw) {
		for (var i=self.minBwIndex ; i>=0; --i){
			if (bw<=(FilterTypes[i].bw3dB[0]*1e3))
				return {'N':1,'bwIndex':i};
		}
		var n = FilterTypes[0].bw3dB.length;
		for (var i = 0; i < n; ++i) {
			if (bw < (FilterTypes[0].bw3dB[i]*1e3)) {
				return {'N':(i+1),'bwIndex':0};
			}
		}	
		var fstep = ~~Math.round(FilterTypes[0].validSep * 1000);
		var N = Math.ceil((bw - (FilterTypes[0].bw3dB[n-1]*1e3)) / fstep) + n;
		return {'N':N,'bwIndex':0};
	}
	this.computeProposalFiltNr = function(gfList) {
		var n = 0;
		for (var i = 0; i < gfList.length; ++i) {
			n += gfList[i].ch.length;
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
		el.readOnly = true;
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
		var str = "";
		for (var i = 0, n = 1; i < gfilts.length; ++i) {
			var filt = gfilts[i].ch;
			str += "BW: " + (" " + self.config.computeBWFromIndex(gfilts[i].bwIndex)).slice(-3) + "KHz\t";
			if (filt.length == 1) {
				str += "Single filter "+n+":\t";
			} else {
				str += "Group filters "+n+"-"+(n+filt.length-1)+":\t";
			}
			n+=filt.length;
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
		var str = localStorage.getItem("Conf"+Prjstr+window.location.host);
		self.config.parse(str); //update both objects to use latest config
		self.cnfToSend.parse(str); //update both objects to use latest config
		self.applyFreqs(band);
		self.applyConfs(band);
		self.makeSubmitFrm();
		self.makeStrFrm();
		self.saveSettingVals();
		localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,1);
	}
	this.applyFreqs = function(band) {
		var chList = [];
		var bwList = [];
		var gfilts = self.proposal;
		for (var i = 0; i < gfilts.length; ++i) {
			var gf = gfilts[i].ch;
			for (var j = 0; j < gf.length; ++j) {
				chList.push(gf[j]);
				bwList.push(gfilts[i].bwIndex);
			}
		}
		var isSplitFixed = true;
		self.cnfToSend.uldlLinkedFreq[band] = isSplitFixed;
		var otherBand = 1 - band;
		var nfilt = self.computeFiltNr(gfilts);
		var nstartOwnBand = 0;

		//reorganize other band filters to avoid interference if user selects this option
		if (self.numberingMode!=0){
			var nstartOtherBand;
			if (band==0){
				nstartOwnBand = 0;
				nstartOtherBand = self.numberingMode==1? nfilt : self.config.CHNR*2-numEnabledFilts(1,0,self.config,self.factory);
			}else{
				nstartOtherBand = 0;
				nstartOwnBand = self.numberingMode==1? numEnabledFilts(0,0,self.config,self.factory) : self.config.CHNR*2 - nfilt;
			}
			reorganizeChFilters(self.config, self.cnfToSend, otherBand, nstartOtherBand);
		}

		var frm = self.cnfToSend.getFrm();
		self.config.parse(frm);//copy updated config to cnfToSend
		var b = self.b;
		var a = (b + 1) % 2;
		for (var fb=0,nch=0; fb<2; ++fb){ //search for available filters in both band arrays
			for (var c = 0; c < self.config.CHNR; ++c) {
				if (self.config.filterEnabled[0][fb][b][c] && self.config.filterBand[0][fb][b][c]==otherBand) { //skip filter enabled in the other band
					continue;
				}
				if (fb*self.config.CHNR + c < nstartOwnBand) { //skip first nstart filters to avoid interference with existing carriers
					self.cnfToSend.filterEnabled[0][fb][b][c] = false;
					continue;
				}
				var chnr = chList[nch];
				self.cnfToSend.freqHz[fb][b][c]=self.factory.fref[2*band+b]+self.factory.fstep*chnr;
				chnr = self.computeChNrOtherBand(chnr, b, band);
				self.cnfToSend.freqHz[fb][a][c]=self.factory.fref[2*band+a]+self.factory.fstep*chnr;
				var on = nch < nfilt;
				self.setChConf(self.cnfToSend, c, bwList[nch], gfilts, fb, on, band, nstartOwnBand);
				nch++;
			}
		}
	}
	this.setChConf = function(cnf, c, bwf, gfilts, band, on, realBand, nstart) {
		var wf = self.filterBelongsToCombination(c, gfilts);
		for (var b = 0; b < 2; ++b) {
			cnf.filterEnabled[0][band][b][c] = on;
			if (!on) {
				cnf.isFilterGrouped[band][b][c] = false;
				continue;
			}
			cnf.filterBand[0][band][b][c] = realBand;
			cnf.isFilterGrouped[band][b][c] = wf;
			cnf.bwIndex[band][b][c] = bwf;
			cnf.fineGainFilter[0][band][b][c] = 0;
			if (b == 1 && cnf.allSameSquelch[realBand] && c>0) {
				var bch = Math.floor(nstart/self.config.CHNR);
				var nch = nstart % self.config.CHNR;
				cnf.sqChEnabled[0][band][b][c] = cnf.sqChEnabled[0][bch][b][nch];
				cnf.sqChThreshold[0][band][b][c] = cnf.sqChThreshold[0][bch][b][nch];
			}
		}
	}
	this.applyConfs = function() {
		for (var b = 0; b < 2; ++b) {
			self.setBandConf(self.cnfToSend, b, self.proposal, self.band);
		}
		//TESTING PURPOSES
		/*for (var b = 0; b < 2; ++b) {
			console.log("Filter Groups "+(b==1?"DL":"UL"));
			for (var band = 0; band < 2; ++band) {
				console.log("Filter reduction "+(b==1?"DL":"UL")+" band "+band+": "+self.cnfToSend.numberOfFilterNonGrouped[band][b]);
				for ( var n = 0; n < self.config.CHNR; ++n) {
					if (self.cnfToSend.isFilterGrouped[band][b][n]) console.log("Filter "+(self.config.CHNR*band+n)+" belongs to a combination in band "+self.cnfToSend.filterBand[0][band][1][n]);
				}
			}
		}*/
	}
	this.setBandConf = function(cnf, b, gfilts, band) {
		var rednr = self.computeFilterCombineReduction(gfilts);
		cnf.numberOfFilterNonGrouped[band][b] = rednr;
		cnf.allChSameBW[band][b] = false;

	}
	this.computeFilterCombineReduction = function(gfilts) {
		var nfilt = 0, ngroups = 0, nsingle = 0;
		for (var i = 0; i < gfilts.length; ++i) {
			var n = gfilts[i].ch.length;
			if (n > 1) {
				ngroups++;
			} else {
				nsingle++
			}
			nfilt += n;
		}
		return (nfilt - (ngroups + nsingle));
	}
	this.computeFiltNr = function(gfilts) {
		var nfilt = 0;
		for (var i = 0; i < gfilts.length; ++i) {
			var n = gfilts[i].ch.length;
			nfilt += n;
		}
		return nfilt;
	}
	this.filterBelongsToCombination = function(c, gfilts) {
		var nfilt = 0;
		for (var i = 0; i < gfilts.length; ++i) {
			var n = gfilts[i].ch.length;
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
		var fstep = self.factory.fstep;
		var fr = chnr * fstep + fo;
		return fr;
	}
	this.computeChNr = function(fr, b, band) {
		var fo = self.factory.fref[2*band+b];
		var fstep = self.factory.fstep;
		var chnr = ~~Math.round((fr - fo)/fstep);
		return chnr;
	}
	this.computeChNrOtherBand = function(chnr, b, band) {
		var fr = self.computeChFreq(chnr, b, band);
		var diff = fr - self.factory.fstart[2*band+b];
		var a = (b + 1) % 2;
		fr = self.factory.fstart[2*band+a] + diff;
		var num = self.computeChNr(fr, a, band);
		return num;
	}
	this.makeSubmitFrm = function() {
		self.frms = [];
		self.frms.push({type: 'ctl_conf_str=', frame: self.cnfToSend.getFrm()});
		localStorage.setItem("ftGui_frms"+Prjstr+window.location.host,JSON.stringify(self.frms));
	}
	this.makeStrFrm = function() {
		var toolConfFrame = self.cnfToSend.getFrm();
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
		localStorage.setItem("FToolNumbering"+Prjstr+window.location.host, this.numberingMode);
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
		pic.src = "/i/blank.gif";
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
	//to be removed??
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
			case ERR_NONE:	el.src = "/i/blank.gif"; break;
			case ERR_OK: 	el.src = "/i/tick.png"; break;
			case ERR_FAIL: 	el.src = "/i/cross.png"; break;
			case ERR_PENDING: self.waitIcon.redraw(); break;
			}
		} catch (err) {}
	}
}

var ftGui;
var filterToolChangedEvent = false;
localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,0);

function ftonload() {
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
