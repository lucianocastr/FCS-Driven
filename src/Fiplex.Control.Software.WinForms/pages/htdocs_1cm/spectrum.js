<!--
var maxChNr = window.top.MaxChNr;
var factory;
var config;
var spectrum;
var tmrId;

function onloadInit() {
	factory = new Factory();
	var factfrm = localStorage.getItem("factory_1cm"+window.location.host);
	factory.parse(factfrm);
	config = new Config(maxChNr);
	var cfgfrm = localStorage.getItem("cfg_1cm"+window.location.host);
	config.parse(cfgfrm);
	spectrum = new Spectrum(maxChNr);
	showResultIcon(ERR_PENDING);
	request_spectrum();
}
function reloadData(){
	clearTimeout(tmrId);
	spectrum.countGets = 0;
	factReq();
}
function factReq() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_fact(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { factReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.open("POST", "/spectrum.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					factory.parse(serverResponse);
					if (typeof(spectrum) === "undefined" || !spectrum)
						spectrum = new Spectrum(maxChNr);
					confReq();
				} else {
					tmrId = setTimeout(function() { load_fact(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function confReq() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				setTimeout(function() { load_conf(); }, 1000);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.open("POST", "/spectrum.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("conf_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_conf() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var serverResponse = this.responseText;
				config.parse(serverResponse);
				request_spectrum();
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
			if (this.readyState == 4 && this.status == 200) {
				tmrId = setTimeout(function() { load_spectrum(); }, 1000);
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
		var bandspect = spectrum.getBandLimits();
		xhr.open("POST", "/spectrum.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("spect_band="+bandspect+"&spect_req=1");
		xhr = null;
	} catch (err) {}
}
function load_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				var serverResponse = this.responseText;
				if (typeof(spectrum) === "undefined" || !spectrum)
					spectrum = new Spectrum(maxChNr);
				if (serverResponse.length != (spectrum.nchannels + 2)*2) {
					if (++spectrum.countGets < spectrum.MAXCOUNTGETS) {
						tmrId = setTimeout(function() { load_spectrum(); }, 1000);
						return;
					}
				} else {
					spectrum.parse(serverResponse);
					showResultIcon(ERR_NONE);
					showRefresh();
				}
				spectrum.countGets = 0;
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
			document.getElementById("spectRefreshed").src = "blank.gif";
		}, 1000);
		
	} catch (e) {}
}

function Spectrum(maxChNr) {
	this.parse = function(sr) {
		if (!this.rawInput)
			this.rawInput = new Array(this.nchannels + 1);
		if (!this.inputSpectrum)
			this.inputSpectrum = new Array(this.nchannels + 1);
		if (this.bandChanged) {
			this.rawInput.length = 0;
			this.rawInput = new Array(this.nchannels + 1);
			this.inputSpectrum.length = 0;
			this.inputSpectrum = new Array(this.nchannels + 1);
		}
		var k = factory.data.uplinkCoupling == 1 ? 1 : 0;
		var dnYscale = this.inYscale[k];
		if (!this.inSpectBox || this.bandChanged) {
			var dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
			this.inSpectBox = this.getNewGraphBox("inSpectBox", dnYscale, dnXscale);
			document.getElementById("inContentbox").appendChild(this.inSpectBox);
			this.graphAddDivs(this.inSpectBox);
			this.createChannelBars(this.inSpectBox);
			this.bandChanged = false;
		}
		for (var ch = 0, n = 0; ch <= this.nchannels && n < sr.length; ++ch) {
			try {
				var num = parseInt(sr.substr(n, 2), 16);
				this.rawInput[ch] = (isNaN(num) ? dnYscale.min : cSignedByte(num));
				n += 2;
			} catch (err) { }
		}
		this.computeInput(this.rawInput);
		this.render(this.inSpectBox, this.inputSpectrum);
	}
	this.getNewGraphBox = function(id, yScale, xScale) {
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = this.graphsize.y+"px";
		box.h = this.graphsize.y;
		box.ymin = yScale.min;
		box.ymax = yScale.max;
		box.xmin = xScale.min;
		box.xmax = xScale.max;
		box.xstep = ~~Math.round((xScale.max - xScale.min) /this.graphsize.x);
		box.onmousemove = function(ev) {
			ev = ev || window.event;
			var box = document.getElementById("inSpectBox");
			var n = getCursorRelPosX(box, ev);
			var fr = "";
			if (n >= 0) {
				var f = n * box.xstep + box.xmin;
				f = ~~Math.round(f / xScale.step) * xScale.step;
				fr = (f / 1e6).toFixed(6)+"&nbsp;MHz"
			}
			var tip = document.getElementById("inSpectTip");
			if (tip) tip.innerHTML = fr;
		}
		box.onmouseout = function(ev) {
			ev = ev || window.event;
			var tip = document.getElementById("inSpectTip");
			if (tip) tip.innerHTML = "";
		}
		return box;
	}
	this.graphAddDivs = function(box) {
		var divSize = this.graphsize.y / this.divisions.y;
		var divVal = (box.ymax - box.ymin) / this.divisions.y;
		for (var i = 0; i <= this.divisions.y; ++i) {
			if (i > 0 && i < this.divisions.y) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphxdiv";
				line.style.bottom = (i*divSize)+"px";
			}
			var txt = document.createElement("div");
			box.appendChild(txt);
			txt.innerHTML = (box.ymin + i*divVal).toFixed(0);
			txt.style.position = "absolute";
			txt.style.bottom = (i*divSize-5)+"px";
			txt.style.left = "-30px";
			txt.style.textAlign = "right";
		}
		divSize = ~~Math.round(this.graphsize.x / this.divisions.x);
		divVal = (box.xmax - box.xmin) / this.divisions.x;
		for (var i = 0, pos = 0; i <= this.divisions.x; ++i) {
			if (i > 0 && i <= this.divisions.x) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphydiv";
				pos = ~~Math.round(i * divSize);
				line.style.left = pos+"px";
			}
			var txt = document.createElement("div");
			box.appendChild(txt);
			txt.innerHTML = ((box.xmin + i*divVal)/1.0e6).toFixed(1);
			txt.style.left = (i*divSize-15)+"px";
			txt.style.bottom = "-20px";
			txt.style.position = "absolute";
		}
	}
	this.createChannelBars = function(box) {
		for (var c = 0; c < config.maxChannels; ++c) {
			if (!config.conf.ch[c].enable)
				continue;
			var fr = config.conf.ch[c].fr;
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
	this.render = function(cont, data) {
		var id = "cont"+cont.id;
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = cont.style.height;
		box.ymin = cont.ymin;
		box.ymax = cont.ymax;
		box.h = cont.h;
		cont.appendChild(box);
		for (var i = 0; i < this.nchannels; ++i) {
			this.renderChannel(box, i, data[i]);
		}
	}
	this.renderChannel = function(box, ch, val) {
		var height, bar;
		if (val < box.ymin)
			height = 0;
		else if (val > box.ymax)
			height = box.h;
		else
			height = box.h * (val - box.ymin)/(box.ymax - box.ymin);
		height = ~~Math.round(height);
		var xpos = ~~Math.round(ch * this.graphsize.x / this.nchannels);
		if (height > 0) {
			bar = document.createElement('div');
			bar.className = "spectnormalbar"; 
			bar.id = box.id+ch;
			bar.h = height;
			bar.channelNr = ch;
			bar.style.width = this.barwidth + "px";
			bar.style.height = "1px";
			bar.style.top = (this.graphsize.y - height).toString()+"px";
			bar.style.left = xpos+"px";
			box.appendChild(bar);
		}
		this.interpolate(box, ch);
	}
	this.interpolate = function(box, ch) {
		var bc = document.getElementById(box.id + ch.toString());
		var bp = document.getElementById(box.id + (ch-1).toString());
		if (!bc && !bp)
			return;
		var xs = ch > 0 ? ~~Math.round((ch-1) * this.graphsize.x / this.nchannels) : 0;
		var xp = ~~Math.round(ch * this.graphsize.x / this.nchannels);
		var ys = bp ? bp.h : 0;
		var yp = bc ? bc.h : 0;
		var ln = document.createElement("div");
		ln.className = "spectnormalbar";
		ln.channelNr = ch;
		ln.style.width = "1px";
		ln.style.height = ~~Math.abs(Math.round(yp - ys)) + "px";
		ln.style.left = bc ? bc.style.left : xp+"px" ;
		var ym = yp > ys ? yp : ys;
		ln.style.top = (this.graphsize.y - ym).toString() + "px";
		box.appendChild(ln);
	}
	this.computeInput = function(rawData) {
		for (var i = 0; i <= this.nchannels; ++i) {
			this.inputSpectrum[i] = rawData[i];
		}
	}
	this.createBandLimitsForm = function() {
		var cont = document.getElementsByTagName("body");
		var tab = document.createElement("table");
		tab.style.marginLeft = "15px";
		tab.style.marginTop = "10px";
		cont[0].appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var tr = document.createElement("tr");
		tb.appendChild(tr)
		var td = document.createElement("th");
		tr.appendChild(td);
		td.innerHTML = "SPECTRUM&nbsp;FREQUENCY&nbsp;SPAN";
		td = document.createElement("th");
		tr.appendChild(td);
		td.innerHTML = "(1,&nbsp;2,&nbsp;3,&nbsp;4&nbsp;or&nbsp;5&nbsp;MHz)";
		var fstartspec = localStorage.getItem("start_spec_1dm"+window.location.host);
		var fstopspec = localStorage.getItem("stop_spec_1dm"+window.location.host);
		if (fstartspec==null)
			fstartspec=factory.data.band[1].fStart;
		else{
			fstartspec = fstartspec<factory.data.band[1].fStart?factory.data.band[1].fStart:fstartspec;
			fstartspec = fstartspec>factory.data.band[1].fStop?factory.data.band[1].fStart:fstartspec;
		}
		if (fstopspec==null)
			fstopspec=factory.data.band[1].fStop;
		else{
			fstopspec = fstopspec>factory.data.band[1].fStop?factory.data.band[1].fStop:fstopspec;	
			fstopspec = fstopspec<factory.data.band[1].fStart?factory.data.band[1].fStop:fstopspec;	
		}
		fstartspec = ~~fstartspec;
		fstopspec = ~~fstopspec;
		var center = ~~(Math.round((fstartspec + fstopspec)/2e5)*1e5);
		var span = ~~(Math.round((fstopspec - fstartspec)/1e5)*1e5);
		if (this.spanMaxMHz * 1e6 < span) {
			span = this.spanMaxMHz * 1e6;
		}
		var halfspan = ~~(Math.floor(span/2e5)*1e5);
		this.FreqMinHz = this.newFreqMinHz = center - halfspan;
		this.FreqMaxHz = this.newFreqMaxHz = center + halfspan;
		this.nchannels = ~~Math.round(span / this.FreqStepHz) + 1;
		this.barwidth = ~~Math.round(this.graphsize.x / (this.nchannels - 1));
		for (var i = 0; i < 2; ++i) {
			tr = document.createElement("tr");
			tb.appendChild(tr)
			td = document.createElement("td");
			tr.appendChild(td);
			td.innerHTML = i == 0 ? "START&nbsp;FREQUENCY&nbsp;(MHz)" : "STOP&nbsp;FREQUENCY&nbsp;(MHz)";
			td = document.createElement("td");
			tr.appendChild(td);
			var el = document.createElement("input");
			el.type = "text";
			el.id = i == 0 ? "fstart" : "fstop";
			el.name = el.id;
			el.size = 11;
			el.onkeypress = function(ev) {
				ev = ev || window.event;
				if (ev.keyCode == 13) {
					spectrum.reSetBandLimits(ev);
					return true;
				} else {
					return isKeyDecimalNumber(ev); 
				}
			}
			var val = i == 0 ? this.FreqMinHz : this.FreqMaxHz;
			el.value = (val / 1e6).toFixed(1);
			td.appendChild(el);
		}
		localStorage.setItem("start_spec_1dm"+window.location.host,this.FreqMinHz);
		localStorage.setItem("stop_spec_1dm"+window.location.host,this.FreqMaxHz);
	};
	this.setBandLimits = function(fs, fp) {
		var s = document.getElementById("fstart");
		s.value = (fs / 1e6).toFixed(1);
		var p = document.getElementById("fstop");
		var f = Math.min(fp, fs + this.spanMaxMHz*1e6);
		p.value = (f / 1e6).toFixed(1);
	}
	this.getBandLimits = function() {
		this.bandChanged = this.FreqMinHz != this.newFreqMinHz || this.FreqMaxHz != this.newFreqMaxHz;
		if (this.bandChanged) {
			this.FreqMinHz = this.newFreqMinHz;
			this.FreqMaxHz = this.newFreqMaxHz;
			this.nchannels = ~~Math.round((this.FreqMaxHz - this.FreqMinHz) / this.FreqStepHz) + 1;
			this.barwidth = ~~Math.round(this.graphsize.x / (this.nchannels - 1));
		}
		var r = hexformat(this.FreqMinHz, 8);
		r += hexformat(this.FreqMaxHz, 8);
		return r;
	}
	this.reSetBandLimits = function(ev) {
		var target = ev ? ev.target || false : false;
		var fs, fp;
		if (!target || (target && target.id == "fstart")) {
			var el = document.getElementById("fstart");
			fs = ~~Math.round(parseFloat(el.value)*10)*1e5;
			if (fs < factory.data.band[1].fStart) {
				fs = factory.data.band[1].fStart;
			} else if (fs >= factory.data.band[1].fStop) {
				fs = this.FreqMinHz;
			}
			el = document.getElementById("fstop");
			fp = ~~Math.round(parseFloat(el.value)*10)*1e5;
			var diff = ~~Math.round((fp - fs)/1e6);
			if (diff < this.spanMinMHz)
				diff = this.spanMinMHz;
			else if (diff > this.spanMaxMHz)
				diff = this.spanMaxMHz;
			fp = fs + diff*1e6;
			if (fp > factory.data.band[1].fStop) {
				fp = factory.data.band[1].fStop;
				fs = fp - diff*1e6;
			}
		} else {
			var el = document.getElementById("fstop");
			fp = ~~Math.round(parseFloat(el.value)*10)*1e5;
			if (fp > factory.data.band[1].fStop) {
				fp = factory.data.band[1].fStop;
			} else if (fp <= factory.data.band[1].fStart) {
				fp = this.FreqMaxHz;
			}
			el = document.getElementById("fstart");
			fs = ~~Math.round(parseFloat(el.value)*10)*1e5;
			var diff = ~~Math.round((fp - fs)/1e6);
			if (diff < this.spanMinMHz)
				diff = this.spanMinMHz;
			else if (diff > this.spanMaxMHz)
				diff = this.spanMaxMHz;
			fs = fp - diff*1e6;
			if (fs < factory.data.band[1].fStart) {
				fs = factory.data.band[1].fStart;
				fp = fs + diff*1e6;
			}
		}
		this.newFreqMinHz = fs;
		this.newFreqMaxHz = fp;
		localStorage.setItem("start_spec_1dm"+window.location.host,this.newFreqMinHz);
		localStorage.setItem("stop_spec_1dm"+window.location.host,this.newFreqMaxHz);		
		var el = document.getElementById("fstart");
		el.value = (this.newFreqMinHz / 1e6).toFixed(1);
		el = document.getElementById("fstop");
		el.value = (this.newFreqMaxHz / 1e6).toFixed(1);
	}
	this.maxChNr = maxChNr;
	this.inContentbox = document.getElementById("inContentbox");
	this.inYscale = [{min: -60.0, max: 30.0 }, {min: -90.0, max: 0.0 }];
	this.divisions = {x: 10, y: 9};
	this.graphsize = {x: 800, y: 240};
	this.FreqStepHz = 6250;
	this.spanMinMHz = 1;
	this.spanMaxMHz = 5;
	this.FreqMinHz;
	this.FreqMaxHz;
	this.newFreqMinHz;
	this.newFreqMaxHz;
	this.nchannels;
	this.createBandLimitsForm();
	this.countGets = 0;
	this.MAXCOUNTGETS = 10;
	this.bandChanged = false;
	this.barwidth;
}
function submitform() {
	spectrum.reSetBandLimits();
}
// -->