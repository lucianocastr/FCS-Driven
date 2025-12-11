<!--
var factory;
var config;
var spectrum;
var timerId;
var timerStop;
var timerMsg;

function onloadInit() {
	guiBlocked(false);
	showResultIcon(ERR_PENDING);
	timerStop = setTimeout(function() {
		stop_loading_spectrum();
		var el = window.parent.navi.document.getElementById("start");
		el.click();
	}, 5*60*1000);
	factory = new Factory();
	config = new Config(window.top.MaxChNr);
	var frm = window.parent.navi.factoryFrame;
	if (frm) {
		factory.parse(frm);
	} else {
		reloadData();
		return;
	}
	frm = window.parent.navi.configFrame;
	if (frm) {
		config.parse(frm);
	} else {
		reloadData();
		return;
	}
	spectrum = new Spectrum();
	request_spectrum();
}
function reloadData(){
	factReq();
}
function factReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_fact(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { factReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.open("POST", "/spect.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					window.parent.navi.factoryFrame = this.responseText;
					factory.parse(this.responseText);
					confReq();
				} else {
					timerId = setTimeout(function() { load_fact(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact2.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function confReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_conf(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { confReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.open("POST", "/spect.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("conf_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_conf() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var cfgarr = this.responseText.split('\t');
					window.parent.navi.configArray = cfgarr;
					window.parent.navi.configFrame = cfgarr[0];
					config.parse(window.parent.navi.configFrame);
					if (typeof(spectrum) === "undefined" || !spectrum)
						spectrum = new Spectrum();
					request_spectrum();
				} else {
					timerId = setTimeout(function() { load_conf(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_conf(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_conf(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function request_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					tmrId = setTimeout(function() { load_spectrum(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { request_spectrum(); }, 1000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { request_spectrum(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { request_spectrum(); }, 1000);
		}
		var spectSettings = spectrum.getSettings();
		if (!spectSettings) {
			xhr = null;
			spectrum.parse();
			tmrId = setTimeout(function() { request_spectrum(); }, 100);
			return;
		}
		xhr.open("POST", "/spect.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("spect_band="+spectSettings+"&spect_req=1");
		xhr = null;
	} catch (err) {}
}
function load_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					if (serverResponse.substr(-4,4) == "NACK") {
						showRemoteMessage("TIMEOUT&nbsp;WAITING&nbsp;DATA", true);
						tmrId = setTimeout(function() { request_spectrum(); }, 100);
						if (!spectrum.spectBox) {
							spectrum.drawGraph();
						}
						return;
					}
					if (serverResponse.length < spectrum.nchannels * 2) {
						if (++spectrum.countGets < spectrum.MAXCOUNTGETS) {
							tmrId = setTimeout(function() { load_spectrum(); }, 1000);
							return;
						}
					} else {
						spectrum.parse(serverResponse);
	 					showResultIcon(ERR_NONE);
	 					if (isGuiBlocked()) {
	 						guiBlocked(false);
	 					}
						showRefresh();
						if (spectrum.isRemote()) {
							showRemoteMessage("");
						}					}
					spectrum.countGets = 0;
				}
				tmrId = setTimeout(function() { request_spectrum(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_spectrum(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_spectrum(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_spct.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function stop_loading_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId) {
			clearTimeout(tmrId);
		}
		if (typeof(timerStop) !== "undefined" && timerStop) {
			clearTimeout(timerStop);
		}
	} catch (err) { }
}
function showRefresh() {
	try {
		var img = document.getElementById("spectRefreshed");
		if (!img) {
			img = document.createElement("img");
			img.id = "spectRefreshed";
			document.getElementById("inSpectRefresh").appendChild(img);
		}
		img.src = "/bullet_green.png";
		setTimeout(function() {
			var el = document.getElementById("spectRefreshed");
			if (el) {
				document.getElementById("spectRefreshed").src = "blank.gif";
			}
		}, 1000);
	} catch (e) {}
}

function showRemoteMessage(msgText, withTimeout, tooltip) {
	try {
		var el = document.getElementById("remoteSpectMsg");
		if (typeof(msgText) == "undefined") {
			msgText = "";
		}
		el.innerHTML = msgText;
		if (msgText != "") {
			el.style.backgroundColor = "white";
		} else {
			el.style.backgroundColor = el.parentNode.style.backgroundColor;
			el.title = "";
		}
		if (typeof(tooltip) != "undefined") {
			el.title = tooltip;
		} else {
			el.title = "";
		}
		if (typeof(withTimeout) == "undefined" || !withTimeout) {
			clearTimeout(timerMsg);
			return;
		}
		timerMsg = setTimeout(function() {
			var el = document.getElementById("remoteSpectMsg");
			if (!el) {
				return;
			}
			el.innerHTML = "";
			el.style.backgroundColor = el.parentNode.style.backgroundColor;
		}, 1000);
	} catch (e) {}
}

function Spectrum() {
	this.parse = function(sr) {
		if (!this.spectBox || this.bandChanged || this.resBwChanged 
		    || this.spanStepChanged || this.chainChanged || this.zspanChanged) {
			var dnXscale;
			if (this.zSpanSt) {
				dnXscale = {
					min: this.FreqZspanHz,
					max: this.FreqZspanHz,
					step: this.FreqStepHz
				};
			} else {
				dnXscale = {
					min: this.FreqMinHz,
					max: this.FreqMaxHz,
					step: this.FreqStepHz
				};
			}
			this.spectBox = this.getNewGraphBox("spectBox", this.inYscale, this.outYscale, dnXscale);
			document.getElementById("contentbox").appendChild(this.spectBox);
			this.graphAddDivs(this.spectBox);
			this.drawYScales(this.spectBox);
			this.drawXScale(this.spectBox);
			this.createChannelBars(this.spectBox);
		}
		this.bandChanged = false;
		this.resBwChanged = false;
		this.spanStepChanged = false;
		this.chainChanged = false;
		this.zspanChanged = false;
		this.rawInput = [];
		for (var ch = 0, n = 0; ch <= this.nchannels; ++ch, n += 2) {
			if (!sr) {
				this.rawInput.push(this.inYscale.min);
				continue;
			}
			if (n >= sr.length) {
				break;
			}
			try {
				var num = parseInt(sr.substr(n, 2), 16);
				this.rawInput.push(isNaN(num) ? this.inYscale.min : cSignedByte(num));
			} catch (err) { }
		}
		if ((this.io) == 0) {
			this.inputSpectrum = [];
			this.computeInput(this.rawInput);
		} else {
			this.outputSpectrum = [];
			this.computeOutput(this.rawInput);
		}
		var ioSet = this.getIoChecked();
		this.render(this.spectBox, ioSet[0]||ioSet[2] ? this.inputSpectrum : null, ioSet[1] ? this.outputSpectrum : null);
	}
	this.drawGraph = function() {
		if (this.spectBox) {
			return;
		}
		var dnXscale;
		if (this.zSpanSt) {
			dnXscale = {
				min: this.FreqZspanHz,
				max: this.FreqZspanHz,
				step: this.FreqStepHz
			};
		} else {
			dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
		}
		this.spectBox = this.getNewGraphBox("spectBox", this.inYscale, this.outYscale, dnXscale);
		document.getElementById("contentbox").appendChild(this.spectBox);
		this.graphAddDivs(this.spectBox);
		this.drawYScales(this.spectBox);
		this.drawXScale(this.spectBox);
	}
	this.getNewGraphBox = function(id, yInScale, yOutScale, xScale) {
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = this.graphsize.y+"px";
		box.h = this.graphsize.y;
		box.inMin = yInScale.min;
		box.inMax = yInScale.max;
		box.outMin = yOutScale.min;
		box.outMax = yOutScale.max;
		box.xmin = xScale.min;
		box.xmax = xScale.max;
		box.xstep = ~~Math.round((xScale.max - xScale.min) /this.graphsize.x);
		box.onmousemove = function(ev) {
			ev = ev || window.event;
			var box = document.getElementById("spectBox");
			var n = getCursorRelPosX(box, ev);
			var fr = "";
			if (n >= 0) {
				var f = n * box.xstep + box.xmin;
				f = ~~Math.round(f / xScale.step) * xScale.step;
				fr = (f / 1e6).toFixed(6)+"&nbsp;MHz"
			}
			var tip = document.getElementById("spectTip");
			if (tip) tip.innerHTML = fr;
		}
		box.onmouseout = function(ev) {
			ev = ev || window.event;
			var tip = document.getElementById("spectTip");
			if (tip) tip.innerHTML = "";
		}
		return box;
	}
	this.graphAddDivs = function(box) {
		var divSize = this.graphsize.y / this.divisions.y;
		for (var i = 0; i <= this.divisions.y; ++i) {
			if (i > 0 && i < this.divisions.y) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphxdiv";
				line.style.bottom = (i*divSize)+"px";
			}
		}
		divSize = this.graphsize.x / this.divisions.x;
		divVal = (box.xmax - box.xmin) / this.divisions.x;
		for (var i = 0, pos = 0; i <= this.divisions.x; ++i) {
			if (i > 0 && i < this.divisions.x) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphydiv";
				pos = ~~Math.round(i * divSize);
				line.style.left = pos+"px";
			}
		}
	}
	this.drawYScales = function(box) {
		var divSize = this.graphsize.y / this.divisions.y;
		var inS = document.getElementById("inScale");
		remove_children(inS);
		var outS = document.getElementById("outScale");
		remove_children(outS);
		for (var i = 0; i <= this.divisions.y; ++i) {
			var txt = document.createElement("div");
			var divVal = (box.inMax - box.inMin) / this.divisions.y;
			txt.innerHTML = (box.inMin + i*divVal).toFixed(0);
			txt.style.position = "absolute";
			txt.style.bottom = (i*divSize-6)+"px";
			txt.style.marginLeft = "3px";
			inS.appendChild(txt);
			txt = document.createElement("div");
			divVal = (box.outMax - box.outMin) / this.divisions.y;
			txt.innerHTML = (box.outMin + i*divVal).toFixed(1);
			txt.style.position = "absolute";
			txt.style.bottom = (i*divSize-6)+"px";
			txt.style.marginLeft = "5px";
			outS.appendChild(txt);
		}
	}
	this.drawXScale = function(box) {
		var divSize = this.graphsize.x / this.divisions.x;
		var divVal = (box.xmax - box.xmin) / this.divisions.x;
		var xS = document.getElementById("xScale");
		remove_children(xS);
		for (var i = 0, pos = 0; i <= this.divisions.x; ++i) {
			var txt = document.createElement("div");
			txt.innerHTML = ((box.xmin + i*divVal)/1.0e6).toFixed(2);
			txt.style.left = ~~Math.round(i*divSize-15)+"px";
			txt.style.position = "absolute";
			txt.style.marginTop = "3px";
			xS.appendChild(txt);
		}
	}
	this.createChannelBars = function(box) {
		var b = this.chain;
		var cfg = config;
		var cfgRem;
		if (b == 0) {
			var rem = this.getRemoteNr();
			var k = rem.IX;
			cfgRem = new ConfigRemote();
			try {
				cfgRem.parse(window.parent.navi.configArray[k+1]);
			} catch(e) {}
		}
		for (var c = 0; c < cfg.maxChannels; ++c) {
			var chEn = b == 0 ? cfgRem.isChOn(c) : cfg.conf.ch[c].enable;
			if (!chEn) {
				continue;
			}
			var frNr = b == 0 ? cfgRem.getChNr(c) : cfg.conf.ch[c].frqNr;
			var fr = cfg.computeChFreq(frNr, b);
			if (fr < this.FreqMinHz || fr > this.FreqMaxHz)
				continue;
			var pos = ~~Math.round(this.graphsize.x * (fr - this.FreqMinHz) / (this.FreqMaxHz - this.FreqMinHz));
			var mark = document.createElement('div');
			mark.className = "spectmarkbar";
			mark.style.left = pos+"px";
			mark.style.height = (this.graphsize.y - 1) + "px";
			box.appendChild(mark);
		}
	}
	this.render = function(cont, dataIn, dataOut) {
		var id = "cont"+cont.id;
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = cont.style.height;
		box.h = cont.h;
		cont.appendChild(box);
		box.ymin = cont.outMin;
		box.ymax = cont.outMax;
		if (dataOut) {
			for (var i = 0; i < dataOut.length; ++i) {
				this.renderChannel(box, i, 'o', dataOut);
			}
		}
		box.ymin = cont.inMin;
		box.ymax = cont.inMax;
		if (dataIn) {
			for (var i = 0; i < dataIn.length; ++i) {
				this.renderChannel(box, i, 'i', dataIn);
			}
		}
	}
	this.renderChannel = function(box, n, d, data) {
		var height, bar;
		var val = data[n];
		if (val < box.ymin)
			height = 0;
		else if (val > box.ymax)
			height = box.h;
		else
			height = box.h * (val - box.ymin)/(box.ymax - box.ymin);
		height = ~~Math.round(height);
		var s = ~~(this.ik / 2 - 1);
		var xpos = ~~Math.round(n * this.graphsize.x / (this.nd - 1)) + s;
		if ((height > 0)&&(xpos<=this.graphsize.x)) {
			bar = document.createElement('div');
			bar.className = "spectnormalbar";
			bar.style.backgroundColor = d == 'o' ? "#60FF60" : "#E0E030";
			bar.id = box.id+d+n;
			bar.h = height;
			bar.style.width = this.barwidth + "px";
			bar.style.height = "1px";
			bar.style.top = (this.graphsize.y - height).toString()+"px";
			bar.style.left = xpos+"px";
			box.appendChild(bar);
		}
		this.interpolate(box, n, d);
	}
	this.interpolate = function(box, ch, d) {
		if (ch <= 0)
			return;
		var bc = document.getElementById(box.id + d + ch.toString());
		var bp = document.getElementById(box.id + d + (ch-1).toString());
		if (!bc && !bp)
			return;
		var xs = ch > 0 ? ~~Math.round((ch-1) * this.graphsize.x / this.nd) : 0;
		var s = ~~(this.ik / 2 - 1);
		var xp = ~~Math.round(ch * this.graphsize.x / (this.nd - 1)) + s;
		var ys = bp ? bp.h : 0;
		var yp = bc ? bc.h : 0;
		var ln = document.createElement("div");
		ln.className = "spectnormalbar";
		ln.style.backgroundColor = d == 'o' ? "#60FF60" : "#E0E030";
		ln.style.width = "1px";
		ln.style.height = ~~Math.abs(Math.round(yp - ys)) + "px";
		ln.style.left = bc ? bc.style.left : xp+"px";
		var ym = yp > ys ? yp - 1 : ys;
		ln.style.top = (this.graphsize.y - ym).toString() + "px";
		box.appendChild(ln);
	}
	this.computeInput = function(rawData) {
		for (var i = 0; i < rawData.length; ++i) {
			rawData[i] -= this.IN_LEVEL_OFFSET;
		}
		this.inputSpectrum.push(rawData[0]);
		for (var i = 1; i < rawData.length; ++i) {
			var s = rawData[i-1];
			var p = rawData[i];
			var k = (p - s) / this.ik;
			for (var j = 1; j < this.ik; ++j) {
				this.inputSpectrum.push(s + k*j);
			}
			this.inputSpectrum.push(p);
		}
	}
	this.computeOutput = function(rawData) {
		for (var i = 0; i < rawData.length; ++i) {
			rawData[i] -= this.OUT_LEVEL_OFFSET;
		}
		this.outputSpectrum.push(rawData[0]);
		for (var i = 1; i < rawData.length; ++i) {
			var s = rawData[i-1];
			var p = rawData[i];
			var k = (p - s) / this.ik;
			for (var j = 1; j < this.ik; ++j) {
				this.outputSpectrum.push(s + k*j);
			}
			this.outputSpectrum.push(p);
		}
	}
	this.createForm = function() {
		this.createBandLimitsForm();
		this.createRbwForm()
		this.createSweepTime();
		this.createAvgForm();
		this.createChainForm();
		this.createIoForm();
		this.createZspanForm();
		this.zspanSet(this.zSpanSt);
		this.createRemoteForm();
		this.setRemoteNr(this.remote);
	}
	this.createBandLimitsForm = function() {
		var cont = [];
		cont.push(document.getElementById("spanStart"));
		cont.push(document.getElementById("spanStop"));
		var fm = [];
		var b = this.chain;
		if (b == 1) {
			var fStart = factory.data.band[0].fStartDL;
			var fStop = factory.data.band[0].fStopDL;
		} else {
			var fStart = factory.data.band[0].fStartUL;
			var fStop = factory.data.band[0].fStopUL;
		}
		fm.push(fStart / 1e6);
		fm.push(fStop / 1e6);
		var tip = "Min: "+fm[0].toFixed(6)+"MHz, Max: "+fm[1].toFixed(6)+" MHz";
		for (var i = 0; i < 2; ++i) {
			var el = document.createElement("input");
			el.type = "text";
			el.title = tip;
			el.id = i == 0 ? "fstart" : "fstop";
			el.name = el.id;
			el.style.width = "50px";
			el.className = "number";
			el.style.display = "inline-block";
			el.style.marginLeft = "5px";
			el.style.marginRight = "5px";
			el.onkeypress = function(ev) {
				ev = ev || window.event;
				if (ev.keyCode == 13) {
					this.onchange(ev);
					return true;
				} else {
					return isKeyDecimalNumber(ev); 
				}
			}
			el.onchange = function(ev) {
				self.reSetBandLimits(ev);
				if (self.zSpanSt) {
					localStorage.setItem("spect_fz_1dm6_"+self.chain+window.location.host, self.newFreqZspanHz);
				} else {
					localStorage.setItem("spect_fs_1dm6_"+self.chain+window.location.host, self.newFreqMinHz);
					localStorage.setItem("spect_fp_1dm6_"+self.chain+window.location.host, self.newFreqMaxHz);
				}
			}
			var val = i == 0 ? this.FreqMinHz : this.FreqMaxHz;
			el.value = (val / 1e6).toFixed(1);
			var t = document.createElement("span");
			t.innerHTML = i == 0 ? "START" : "STOP";
			t.style.fontWeight = "bold";
			t.style.marginRight = "2px";
			cont[i].appendChild(t);
			cont[i].appendChild(el);
			t = document.createElement("span");
			t.innerHTML = "(MHz)";
			t.style.fontWeight = "bold";
			t.style.marginRight = "2px";
			cont[i].appendChild(t);
			cont[i].style.paddingTop = "1px";
		}
	}
	this.setBandLimits = function(fi, fp) {
		var fm = [];
		var b = this.chain;
		if (b == 1) {
			fm.push(factory.data.band[0].fStartDL / 1e6);
			fm.push(factory.data.band[0].fStopDL / 1e6);
		} else {
			fm.push(factory.data.band[0].fStartUL / 1e6);
			fm.push(factory.data.band[0].fStopUL / 1e6);
		}
		var tip = "Min: "+fm[0].toFixed(6)+"MHz, Max: "+fm[1].toFixed(6)+" MHz";
		var s = document.getElementById("fstart");
		s.value = (fi / 1e6).toFixed(6);
		s.title = tip;
		var p = document.getElementById("fstop");
		p.value = (fp / 1e6).toFixed(6);
		p.title = tip;
	}
	this.getBandLimits = function() {
		var fi, fp, fo;
		if (this.zSpanSt) {
			this.bandChanged = this.FreqZspanHz != this.newFreqZspanHz;
			if (this.bandChanged) {
				this.FreqZspanHz = this.newFreqZspanHz;
			}
			fi = fp = this.FreqZspanHz;
		} else {
			this.bandChanged = this.FreqMinHz != this.newFreqMinHz 
					|| this.FreqMaxHz != this.newFreqMaxHz;
			if (this.bandChanged) {
				this.FreqMinHz = this.newFreqMinHz;
				this.FreqMaxHz = this.newFreqMaxHz;
			}
			fi = this.FreqMinHz;
			fp = this.FreqMaxHz;
		}
		var b = self.chain;
		if (b == 1) {
			fo = factory.data.band[0].foDL;
		} else {
			fo = factory.data.band[0].foUL;
		}
		var nfr = ~~Math.round((fi - fo) / this.FREQ_STEP_HZ);
		if (nfr < 0) {
			nfr += 0x10000;
		}
		var r = hexformat(nfr, 4);
		nfr = ~~Math.round((fp - fo) / this.FREQ_STEP_HZ);
		if (nfr < 0) {
			nfr += 0x10000;
		}
		r += hexformat(nfr, 4);
		return r;
	}
	this.reSetBandLimits = function(ev) {
		var target = ev ? ev.target || false : false;
		var b = self.chain;
		var elS = document.getElementById("fstart");
		var fi;
		if (b == 1) {
			var fo = factory.data.band[0].foDL;
			var fStart = factory.data.band[0].fStartDL;
			var fStop = factory.data.band[0].fStopDL;
		} else {
			var fo = factory.data.band[0].foUL;
			var fStart = factory.data.band[0].fStartUL;
			var fStop = factory.data.band[0].fStopUL;
		}
		if (self.zSpanSt) {
			fi = ~~Math.round(parseFloat(elS.value)*1e6);
			var n = ~~Math.round((fi - fo)/this.FREQ_STEP_HZ);
			fi = n*this.FREQ_STEP_HZ + fo;
		} else {
			fi = ~~Math.round(parseFloat(elS.value)*10)*1e5;
		}
		if (fi < fStart || fi > fStop) {
			fi = fStart;
		}
		var elP = document.getElementById("fstop");
		var fp;
		if (self.zSpanSt) {
			fp = fi;
		} else {
			fp = ~~Math.round(parseFloat(elP.value)*10)*1e5;
			if (fp < fStart || fp > fStop) {
				fp = fStop;
			}
		}
		var span = fp - fi;
		if (!self.zSpanSt && span > 0 && span < this.spanMinMHz*1e6) {
			if (!target || (target && target.id == "fstart")) {
				fi = fp - this.spanMinMHz*1e6;
				if (fi < fStart) {
					fi = fStart;
					fp = fi + this.spanMinMHz*1e6;
				}
			} else {
				fp = fi + this.spanMinMHz*1e6;
				if (fp > fStop) {
					fp = fStop;
					fi = fp - this.spanMinMHz*1e6;
				}
			}
		}
		elS.value = (fi / 1e6).toFixed(span != 0 ? 1 : 6);
		elP.value = (fp / 1e6).toFixed(span != 0 ? 1 : 6);
		if (this.zSpanSt) {
			this.newFreqZspanHz = fi;
		} else {
			this.newFreqMinHz = fi;
			this.newFreqMaxHz = fp;
		}
	}
	this.createRbwForm = function() {
		var cont = document.getElementById("resBw");
		if (!cont)
			return;
		var el = document.createElement("select");
		el.id = "sel_resBw";
		el.name = el.id;
		el.style.fontSize = "10px";
		var opts = [];
		for (var i = 0; i < this.MAXRES; ++i) {
			var opt = document.createElement("option");
			opt.text = (this.FREQ_STEP_HZ * (1 << i)).toString();
			opt.value = i;
			el.options.add(opt);
		}
		var str = "RBW";
		el.selectedIndex = this.resBw;
		el.onchange = function(ev) {
			localStorage.setItem("spect_rbw_1dm6"+window.location.host, this.selectedIndex);
		}
		var t = document.createElement("span");
		t.innerHTML = str;
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
		t = document.createElement("span");
		t.innerHTML = " (Hz)";
		t.style.fontWeight = "bold";
		cont.appendChild(t);
		cont.style.paddingTop = "1px";
	}
	this.getRbw = function() {
		try {
			var el = document.getElementById("sel_resBw");
			var v = el.selectedIndex;
			this.resBwChanged = this.resBw != v;
			return v;
		} catch(err) {}
	}
	this.setRbw = function(v) {
		if (v < 0 || v >= this.MAXRES) {
			return;
		}
		try {
			var el = document.getElementById("sel_resBw");
			el.selectedIndex = v;
		} catch(err) {}
	}
	this.resBwEnable = function(en) {
		try {
			var el = document.getElementById("sel_resBw");
			el.disabled = !en;
			el.style.backgroundColor = el.disabled ? "#C0C0C0" : "white";
		} catch (err) {}
	}
	this.createSweepTime = function() {
		var cont = document.getElementById("spanStep");
		if (!cont)
			return;
		remove_children(cont);
		var el = document.createElement("span");
		el.id = "sel_spanStep";
		el.name = el.id;
		el.zspan = (this.FreqMinHz == this.FreqMaxHz) || this.zSpanSt;
		el.style.fontSize = "10px";
		el.style.width = "40px";
		el.style.eight = "20px";
		el.style.outline = "thin solid grey";
		el.style.backgroundColor = "#C0C0C0";
		el.style.color = "black";
		el.style.display = "inline-block";
		var str = "SWEEP"; 
		var t = document.createElement("span");
		t.innerHTML = str;
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
		t = document.createElement("span");
		t.innerHTML = " (ms)";
		t.style.fontWeight = "bold";
		cont.appendChild(t);
		cont.style.paddingTop = "1px";
	}
	this.isZSpan = function() {
		try {
			var el = document.getElementById("sel_spanStep");
			if (el.zspan != "undefined") {
				return el.zspan;
			} else {
				return false;
			}
		} catch(err) {return false;}
	}
	this.setSweepTime = function(v) {
		try {
			var el = document.getElementById("sel_spanStep");
			var v = ~~Math.round(this.nchannels * 1.18 * this.avg / (1 << this.resBw));
			el.innerHTML = v;
		} catch(err) {}
	}
	this.createAvgForm = function() {
		var cont = document.getElementById("avgCnt");
		if (!cont)
			return;
		var tip = "Min: 1, Max: 32";
		var el = document.createElement("input");
		el.type = "text";
		el.title = tip;
		el.id = "spectAvg";
		el.name = el.id;
		el.style.width = "25px";
		el.className = "number";
		el.style.display = "inline-block";
		el.style.marginLeft = "5px";
		el.style.marginRight = "5px";
		el.value = this.avg;
		el.onkeypress = function(ev) {
			ev = ev || window.event;
			if (ev.keyCode == 13) {
				this.onchange();
				return true;
			} else {
				return numbersOnly(ev); 
			}
		}
		el.onchange = function(ev) {
			var v = parseInt(this.value);
			if (typeof(v) === 'undefined' || isNaN(v)) {
				v = 1;
			} else if (v < 1 ) {
				v = 1;
			} else if (v > self.MAXAVG) {
				v = self.MAXAVG;
			}
			this.value = v;
			localStorage.setItem("spect_avg_1dm6"+window.location.host, v);
		}
		var t = document.createElement("span");
		t.innerHTML = "Avg.";
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
		cont.style.paddingTop = "1px";
	}
	this.getAvg = function() {
		try {
			var el = document.getElementById("spectAvg");
			var v = parseInt(el.value);
			if (typeof(v) === 'undefined' || isNaN(v)) {
				v = 1;
			} else if (v < 1 ) {
				v = 1;
			} else if (v > self.MAXAVG) {
				v = self.MAXAVG;
			}
			return v;
		} catch(err) { return 1; }
	}
	this.createChainForm = function() {
		var cont = document.getElementById("signalChain");
		if (!cont)
			return;
		var t = [], el = [];
		this.setChainTitle(this.chain);
		for (var i = 0; i < 2; ++i) {
			el.push(document.createElement("input"));
			el[i].type = "checkbox";
			el[i].id = "sigChain_"+i;
			el[i].name = el.id;
			el[i].checked = i == this.chain;
			el[i].elChain = i;
			el[i].onclick = function(ev) {
				var c = this.elChain == 0 ? 1 : 0;
				var othel = document.getElementById("sigChain_"+c);
				if (!othel)
					return;
				othel.checked = !this.checked;
				self.chain = this.checked ? this.elChain : othel.elChain;
				self.setChainTitle(self.chain);
				localStorage.setItem("spect_chain_1dm6_"+window.location.host, self.chain);
				self.initSettings();
				self.setBandLimits(self.FreqMinHz, self.FreqMaxHz);
				self.zspanSet(self.zSpanSt);
				var zspan = self.FreqMinHz == self.FreqMaxHz;
				if (zspan) {
					self.setRbw(self.resBw);
				}
				if (self.isZSpan() != zspan) {
					self.createSweepTime();
				}
				self.chainChanged = true;
				document.getElementById("ioSel_2").style.display = self.chain==1?"inline-block":"none";
				document.getElementById("ioSeltext_2").style.display = self.chain==1?"inline-block":"none";
				document.getElementById("ioSeltext_0").innerHTML = self.chain==1?"In1":"In";
			}
			t.push(document.createElement("span"));
			t[i].innerHTML = i == 0 ? "UL" : "DL";
			t[i].style.fontWeight = "bold";
			t[i].style.marginRight = "2px";
			t[i].style.marginLeft = "2px";
		}
		cont.appendChild(t[0]);
		for (var i = 0; i < 2; ++i)
			cont.appendChild(el[i]);
		cont.appendChild(t[1]);
	}
	this.nextIo2 = function() {
		var el = document.getElementById("ioSel_2");
		if (el && el.checked) {
			return 1;
		}
		return 0;
	}
	this.getChain = function() {
		var el = document.getElementById("sigChain_0");
		if (el && el.checked) {
			return 0;
		}
		return 1;
	}
	this.setChainTitle = function(chain) {
		try {
			var ttl = document.getElementById("chainTitle");
			ttl.innerHTML =  chain ? "DOWNLINK&nbsp;SPECTRUM" : "UPLINK&nbsp;SPECTRUM";
		} catch(err) {}
	}
	this.createIoForm = function(){
		var cont = document.getElementById("ioSel");
		if (!cont)
			return;
		var t = [], el = [];
		var ttext = ["In1","Out","In2"];
		for (var i = 0; i < 3; ++i) {
			el.push(document.createElement("input"));
			el[i].type = "checkbox";
			el[i].id = "ioSel_"+i;
			el[i].name = el.id;
			el[i].checked = this.ioSet[i];
			el[i].side = i;
			el[i].onclick = function(ev) {
				try {
					var c = this.side == 0 ? 1 : 0;
					if (self.chain==0){
						var othel = document.getElementById("ioSel_"+c);
						if (!this.checked) {
							if (!othel.checked) {
								othel.checked = true;
							}
						}
					}else{
						if ((this.side&0x1)==0){
							c = this.side == 0 ? 2 : 0;
							var othel = document.getElementById("ioSel_"+c);
							if (this.checked) {
								if (othel.checked) {
									othel.checked = false;
								}
							}
							if (!this.checked && !othel.checked) document.getElementById("ioSel_1").checked = true;
						}
						else{
							var othel = document.getElementById("ioSel_0");
							var othel2 = document.getElementById("ioSel_2");
							if (!this.checked) {
								if (!othel.checked && !othel2.checked) {
									othel.checked = true;
								}
							}
						}
					}
					var io = self.getIoChecked();
					self.render(self.spectBox, io[0]||io[2] ? self.inputSpectrum : null, io[1] ? self.outputSpectrum : null);
					localStorage.setItem("spect_io_1dm6_0"+window.location.host, io[0]? 1 : 0);
					localStorage.setItem("spect_io_1dm6_1"+window.location.host, io[1]? 1 : 0);
					localStorage.setItem("spect_io_1dm6_2"+window.location.host, io[2]? 1 : 0);
				} catch(err) {}
			}
			t.push(document.createElement("span"));
			t[i].innerHTML = ttext[i];
			t[i].id = "ioSeltext_"+i;
			t[i].style.fontWeight = "bold";
			t[i].style.marginRight = "2px";
			t[i].style.marginLeft = "2px";
		}
		cont.appendChild(t[0]);
		cont.appendChild(el[0]);
		cont.appendChild(t[2]);
		cont.appendChild(el[2]);
		cont.appendChild(t[1]);
		cont.appendChild(el[1]);

		document.getElementById("ioSel_2").style.display = this.chain?"inline-block":"none";
		document.getElementById("ioSeltext_2").style.display = this.chain?"inline-block":"none";
		document.getElementById("ioSeltext_0").innerHTML = this.chain?"In1":"In";
	}
	this.isIoChecked = function(n) {
		//var c = n ? 1 : 0;
		try {
			var el = document.getElementById("ioSel_"+n);
			return el.checked;
		} catch(err) {}
	}
	this.nextIo = function() {
		var n = (this.io == 0 ? 1 : 0);
		if (this.chain==0){
			if (this.isIoChecked(n)) {
				return n;
			}
		}else{
			if (n==0 && (this.isIoChecked(0)||this.isIoChecked(2))) return 0;
			if (n==1 && this.isIoChecked(1)) return 1;
		}
		return this.io;
	}
	this.getIoChecked = function() {
		var r = [];
		for (var i = 0; i < 3; ++i) {
			r.push(this.isIoChecked(i) ? true : false);
		}
		if (this.chain==0) r[2]=false;
		return r;
	}
	this.createZspanForm = function() {
		var cont = document.getElementById("zeroSpan");
		if (!cont)
			return;
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "zSpan";
		el.name = el.id;
		el.checked = this.zSpanSt;
		el.onclick = function(ev) {
			localStorage.setItem("spect_zspan_1dm6_"+window.location.host, this.checked ? 1 : 0);
			self.zSpanSt = this.checked;
			self.zspanSet(self.zSpanSt);
			self.zspanChanged = true;
		}
		var t = document.createElement("span");
		t.innerHTML = "Z.Span";
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
	}
	this.zspanSet = function(zspan) {
		var fst = document.getElementById("fstart");
		var fsp = document.getElementById("fstop");
		var fi, fp;
		if (zspan) { 
			fi = fp = this.FreqZspanHz;
		} else {
			fi = this.FreqMinHz;
			fp = this.FreqMaxHz;
		}
		try {
			fst.value = (fi / 1e6).toFixed(zspan ? 6 : 1);
			fsp.value = (fp / 1e6).toFixed(zspan ? 6 : 1);
			fsp.disabled = !!zspan;
			fsp.style.backgroundColor = zspan ? "grey" : "#FFFFFF"
		} catch (err) {}
		this.reSetBandLimits();
	}
	this.createRemoteForm = function() {
		var box = document.getElementById("remoteSel");
		if (!box) {
			return;
		}
		var el = document.createElement("select");
		el.id = "selRemote";
		el.name = el.id;
		el.className = "longopt";
		el.style.fontSize = "10px";
		var opts = [];
		var tags = new Tags();
		for (var i = 0, n = 1; i < window.top.MaxRemotesNr; ++i) {
			if (!(window.top.remotesBitmask & (1 << i))) {
				continue;
			}
			n = i + 1;
			var opt = document.createElement("option");
			var t = n;
			var tag = tags.val(tags.types.REMOTE, i);
			if (tag) {
				t += " - "+tag.trim();
			}
			opt.text = t;
			opt.value = i;
			if (window.top.master_rx_loss_alarm[n]) {
				opt.style.color = "grey";
			}
			n++;
			el.options.add(opt);
		}
		el.onchange = function(ev) {
			var val;
			try {
				var idx = this.selectedIndex;
				val = el.options[idx].value;
			} catch(err) { val = 0; }
			localStorage.setItem("spect_remote_1dm6_"+window.location.host, val);
		}
		el.selectedIndex = this.remote;
		box.appendChild(el);
	}
	this.getRemoteNr = function() {
		try {
			var el = document.getElementById("selRemote");
			var index = el.options.selectedIndex;
			var op = el.options[index];
			return {IX: index, NR: parseInt(op.innerHTML)};
		} catch(err) { return -1;}
	}
	this.setRemoteNr = function(r) {
		try {
			var el = document.getElementById("selRemote");
			for (var i = 0; i < el.options.length; ++i) {
				if (r == el.options[i].value) {
					el.options.selectedIndex = i;
					return;
				}
			}
			el.options.selectedIndex = 0;
		} catch(err) {}
	}
	this.isRemote = function() {
		return ((this.chain+this.io) != 1);
	}
	this.computeRbw = function(rbw1st) {
		for (var rbw = rbw1st; rbw < this.MAXRES; ++rbw) {
			var fstep = this.FREQ_STEP_HZ * (1 << rbw);
			var nch = ~~Math.round((this.FreqMaxHz - this.FreqMinHz) / fstep);
			if (nch <= this.graphsize.x) {
				break;
			}
		}
		if (rbw >= this.MAXRES)
			rbw = this.MAXRES - 1;
		return rbw;
	}
	this.getSettings = function() {
		var r = "";
		this.io = this.nextIo();
		this.chain = this.getChain();
		this.io2 = this.chain?this.nextIo2():0;
		this.avg = this.getAvg();
		if ((this.chain+this.io)!=1) {
			var rem = this.getRemoteNr();
			var n = rem.NR;
			var k = rem.IX;
			if (n < 1) {
				return null;
			}
			var cfg = new ConfigRemote();
			cfg.parse(window.parent.navi.configArray[k+1]);
			if (!window.top.master_rx_loss_alarm[k+1] && !cfg.isAE()) {
				showRemoteMessage("REMOTE&nbsp;SPECTRUM&nbsp;UNSUPPORTED", false, "Click on Status to update Remote capability");
				return null;
			}
			r = hexformat(n, 2)+"01";
		}
		r += this.getBandLimits();
		var span = Math.abs(this.FreqMaxHz - this.FreqMinHz);
		var zspan = span == 0 || this.zSpanSt;
		var rbw;
		if (zspan) {
			rbw = this.getRbw();
		} else {
			rbw = this.computeRbw(this.getRbw());
		}
		this.resBwChanged = rbw != this.resBw;
		this.spanStepChanged = this.resBwChanged;
		this.resBw = rbw;
		this.spanStep = this.resBw;
		this.setRbw(this.resBw);
		this.setSweepTime();
		this.FreqStepHz = this.FREQ_STEP_HZ * (1 << this.spanStep);
		if (zspan) {
			this.nchannels = this.graphsize.x + 1;
		} else {
			this.nchannels = ~~Math.round((this.FreqMaxHz - this.FreqMinHz) / this.FreqStepHz) + 1;
		}
		var k = ~~(this.graphsize.x / (this.nchannels - 1));
		this.ik = k || 1;
		this.nd = this.nchannels * this.ik;
		this.barwidth = ~~Math.round(this.graphsize.x / (this.nd - 1))+1;
		var s = 0;
		s |= this.io == 1 ? this.settingsBits.io : 0;
		s |= ((this.spanStep << this.settingsBits.fstepS) & this.settingsBits.fstep);
		s |= ((this.resBw << this.settingsBits.rbwS) & this.settingsBits.rbw);
		s |= this.io2 == 1 ? this.settingsBits.io2 : 0;
		//s |= this.settingsBits.chain;
		r += hexformat(s, 2);
		s = ((this.avg - 1) & this.settingsBits.avg);
		r += hexformat(s, 2);
		return r;
	}
	this.initSettings = function() {
		this.io = 1;
		var b = parseInt(localStorage.getItem("spect_chain_1dm6_"+window.location.host));
		if (isNaN(b) || b < 0 || b > 1) {
			b = 1;
			localStorage.setItem("spect_chain_1dm6_"+window.location.host, b);
		}
		this.chain = b;
		if (b == 1) {
			var fStart = factory.data.band[0].fStartDL;
			var fStop = factory.data.band[0].fStopDL;
		} else {
			var fStart = factory.data.band[0].fStartUL;
			var fStop = factory.data.band[0].fStopUL;
		}
		var fi = parseInt(localStorage.getItem("spect_fs_1dm6_"+b+window.location.host));
		var fp = parseInt(localStorage.getItem("spect_fp_1dm6_"+b+window.location.host));
		if (!isNaN(fi) && !isNaN(fp) && fp >= (fi+200000)
		    && fi >= fStart && fi <= fStop
		    && fp >= fStart && fp <= fStop) {
			this.FreqMinHz = this.newFreqMinHz = fi;
			this.FreqMaxHz = this.newFreqMaxHz = fp;
		} else {
			this.FreqMinHz = this.newFreqMinHz = fStart;
			this.FreqMaxHz = this.newFreqMaxHz = fStop;
			localStorage.setItem("spect_fs_1dm6_"+b+window.location.host, this.newFreqMinHz);
			localStorage.setItem("spect_fp_1dm6_"+b+window.location.host, this.newFreqMaxHz);
		}
		var fz = parseInt(localStorage.getItem("spect_fz_1dm6_"+b+window.location.host));
		if (isNaN(fz) || fz < fStart || fz > fStop) {
			fz = fStart;
			localStorage.setItem("spect_fz_1dm6_"+b+window.location.host, fz);
		}
		this.FreqZspanHz = this.newFreqZspanHz = fz;
		var zs = parseInt(localStorage.getItem("spect_zspan_1dm6_"+window.location.host));
		if (isNaN(zs) || zs < 0 || zs > 1) {
			zs = 0;
			localStorage.setItem("spect_zspan_1dm6_"+window.location.host, zs);
		}
		this.zSpanSt = zs != 0;
		var rbw = parseInt(localStorage.getItem("spect_rbw_1dm6"+window.location.host));
		if (isNaN(rbw) || rbw < 0 || rbw >= this.MAXRES) {
			rbw = this.MAXRES - 1;
			localStorage.setItem("spect_rbw_1dm6"+window.location.host, rbw);
		}
		this.resBw = rbw;
		this.spanStep = this.resBw;
		var v = parseInt(localStorage.getItem("spect_avg_1dm6"+window.location.host));
		if (isNaN(v) || v < 1 || v > this.MAXAVG) {
			v = 1;
			localStorage.setItem("spect_avg_1dm6"+window.location.host, v);
		}
		this.avg = v;
		this.ioSet = [];
		var allnotset = true;
		for (var i = 0; i < 3; ++i) {
			var io = parseInt(localStorage.getItem("spect_io_1dm6_"+i+window.location.host));
			if (isNaN(io) || (io < 0 || io >1 )) {
				io = 1;
				localStorage.setItem("spect_io_1dm6_"+i+window.location.host, io);
			}
			var numcheckinput = this.chain==1?3:2;
			if (io==1 && i<numcheckinput) allnotset = false;
			this.ioSet.push(io);
		}
		if ((this.ioSet[0]==1 && this.ioSet[2]==1) || (this.chain==0 && this.ioSet[2]==1)){
			this.ioSet[2]=0;
			localStorage.setItem("spect_io_1dm6_2"+window.location.host, 0);
			try{
				document.getElementById("ioSel_2").checked = false;
			} catch(err) {}

		}
		if (allnotset){
			this.ioSet[0]=1;
			localStorage.setItem("spect_io_1dm6_0"+window.location.host, 1);
			try{
				document.getElementById("ioSel_0").checked = true;
			} catch(err) {}
		}
		this.remote = localStorage.getItem("spect_remote_1dm6_"+window.location.host);
	}
	var self = this;
	this.contentbox = document.getElementById("contentbox");
	this.inYscale = {min: -130.0, max: -0.0 };
	this.outYscale = {min: -90, max: 40.0};
	this.divisions = {x: 10, y: 13};
	this.graphsize = {x: 800, y: 480};
	this.FREQ_STEP_HZ = 3125;
	this.FreqStepHz = this.FREQ_STEP_HZ;
	this.spanMinMHz = 0.2;
	this.countGets = 0;
	this.MAXCOUNTGETS = 30;
	this.MAXRES = 4;
	this.MAXAVG = 32;
	this.IN_LEVEL_OFFSET = 10;
	this.OUT_LEVEL_OFFSET = 0;
	this.settingsBits = {
		io: 	0x01,
		fstep: 	0x06,
		fstepS:	1,
		nr: 	0x1F,
		rbw: 	0x18,
		rbwS: 	3,
		io2:  0x20,
		avg: 	0x1F 
	}
	this.avg;
	this.chain;
	this.nr;
	this.FreqMinHz;
	this.FreqMaxHz;
	this.FreqZspanHz;
	this.resBw;
	this.spanStep;
	this.newFreqMinHz;
	this.newFreqMaxHz;
	this.newFreqZspanHz;
	this.nchannels;
	this.barwidth;
	this.ik;
	this.nd;
	this.io;
	this.io2;
	this.ioSet;
	this.zSpanSt;
	this.initSettings();
	this.createForm();
	this.bandChanged = false;
	this.resBwChanged = false;
	this.spanStepChanged = false;
	this.chainChanged = false;
	this.zspanChanged = false;
	this.remote;
}
function submitform() {
	spectrum.reSetBandLimits();
	if (this.nchannels > 1024)
		return;
	guiBlocked(true);
	showResultIcon(ERR_PENDING);
}

function Tags() {
	this.val = function(type, n) {
		switch (type) {
		case this.types.MASTER: return this.data.master;
		case this.types.EXPANSOR:
			if (typeof(n) != 'undefined' && n < window.top.MaxExpansorNr) {
				return this.data.expansor[n];
			} else {
				return null;
			}
			break;
		case this.types.REMOTE:
			if (typeof(n) != 'undefined' && n < window.top.MaxRemotesNr) {
				return this.data.remote[n];
			} else {
				return null;
			}
			break;
		default:
			return null;
		}
	}
	this.parse = function(str) {
		try {
			var arr = str.split("\t");
			for (var i = 0; i < arr.length; ++i) {
				var first = parseInt(arr[i].substr(0, 2), 16);
				var second = parseInt(arr[i].substr(2, 2), 16);
				var tag = arr[i].substr(4);
				tag = tag.substr(0, tag.length-1);
				if (first == 0) {
					if (second == 0) {
						this.data.master = tag;
					} else if (second <= window.top.MaxExpansorNr) {
						this.data.expansor[second-1] = tag;
					}
					continue;
				}
				if (first <= window.top.MaxRemotesNr) {
					this.data.remote[first-1] = tag;
				}
			}
		} catch(err) {}
	}
	this.TAGLEN = 30;
	this.types = {MASTER: 0, EXPANSOR: 1, REMOTE: 2};
	this.data = {
		master: null,
		expansor: [],
		remote: []
	};
	for (var i = 0; i < window.top.MaxExpansorNr; ++i) {
		this.data.expansor.push(null);
	}
	for (var i = 0; i < window.top.MaxRemotesNr; ++i) {
		this.data.remote.push(null);
	}
	var tagstr = localStorage.getItem("tags_1dm6"+window.location.host);
	var str = hex2a(tagstr);
	this.parse(str);
}
// -->
