<!--
var maxChNr = window.top.MaxChNr;
var factory;
var config;
var monit;
var spectrum;
var timerId;

function onloadInit() {
	factory = new Factory();
	factory.parse(window.top.fiplexFactStr);
	config = new Config(maxChNr);
	config.parse(window.top.fiplexConfStr);
	monit = new Monitor(maxChNr);
	spectrum = new Spectrum(maxChNr);
	load_status();
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
		xhr.open("POST", "/spectrum.zhtml", true);
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
					var serverResponse = this.responseText;
					factory.parse(serverResponse);
					if (typeof(spectrum) === "undefined" || !spectrum)
						spectrum = new Spectrum(maxChNr);
					confReq(true);
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
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
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
		xhr.open("POST", "/spectrum.zhtml", true);
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
					var serverResponse = this.responseText;
					config.parse(serverResponse);
					load_status();
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
function load_status() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					monit.parse(serverResponse);
					request_spectrum();
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
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
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					if (typeof(spectrum) === "undefined" || !spectrum)
						spectrum = new Spectrum(maxChNr);
					if (serverResponse.length != (2*spectrum.nchannels + 2)*2) {
						if (++spectrum.countGets < spectrum.MAXCOUNTGETS) {
							tmrId = setTimeout(function() { load_spectrum(); }, 1000);
							return;
						}
					} else {
						spectrum.parse(serverResponse);
					}
					spectrum.countGets = 0;
				}
				tmrId = setTimeout(function() { load_status(); }, 100);
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
function Spectrum(maxChNr) {
	this.parse = function(sr) {
		if (!this.rawInput)
			this.rawInput = new Array(this.nchannels + 1);
		if (!this.inputSpectrum)
			this.inputSpectrum = new Array(this.nchannels + 1);
		if (!this.outputSpectrum)
			this.outputSpectrum = new Array(this.nchannels + 1);
		if (!this.adjacentChannelsWarn)
			this.adjacentChannelsWarn = new Array(this.nchannels + 1);
		if (this.bandChanged) {
			this.rawInput.length = 0;
			this.rawInput = new Array(this.nchannels + 1);
			this.inputSpectrum.length = 0;
			this.inputSpectrum = new Array(this.nchannels + 1);
			this.outputSpectrum.length = 0;
			this.outputSpectrum = new Array(this.nchannels + 1);
			this.adjacentChannelsWarn.length = 0;
			this.adjacentChannelsWarn = new Array(this.nchannels + 1);
		}
		if (!this.inSpectBox || this.bandChanged) {
			var dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
			this.inSpectBox = this.getNewGraphBox("inSpectBox", this.inYscale, dnXscale);
			document.getElementById("inContentbox").appendChild(this.inSpectBox);
			this.graphAddDivs(this.inSpectBox);
			this.createChannelBars(this.inSpectBox);
		}
		if (!this.outSpectBox || this.bandChanged) {
			var dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
			this.outSpectBox = this.getNewGraphBox("outSpectBox", this.outYscale, dnXscale);
			document.getElementById("outContentbox").appendChild(this.outSpectBox);
			this.graphAddDivs(outSpectBox);
			this.createChannelBars(this.outSpectBox);
		}
		this.bandChanged = false;
		for (var ch = 0, n = 0; ch <= this.nchannels && n < sr.length; ++ch) {
			try {
				var num = parseInt(sr.substr(n, 4), 16);
				this.rawInput[ch] = (isNaN(num) ? this.inYscale.min : to_float(num));
				n += 4;
			} catch (err) { }
		}
		this.computeInput(this.rawInput);
		this.computeOutput(this.inputSpectrum);
		this.render(this.inSpectBox, this.inputSpectrum);
		this.render(this.outSpectBox, this.outputSpectrum);
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
			var box = document.getElementById("outSpectBox");
			var n = getCursorRelPosX(box, ev);
			var fr = "";
			if (n >= 0) {
				var f = n * box.xstep + box.xmin;
				f = ~~Math.round(f / xScale.step) * xScale.step;
				fr = (f / 1e6).toFixed(6)+"&nbsp;MHz"
			}
			var tip = document.getElementById("outSpectTip");
			if (tip) tip.innerHTML = fr;
			tip = document.getElementById("inSpectTip");
			if (tip) tip.innerHTML = fr;
		}
		box.onmouseout = function(ev) {
			ev = ev || window.event;
			var tip = document.getElementById("outSpectTip");
			if (tip) tip.innerHTML = "";
			tip = document.getElementById("inSpectTip");
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
			if (!config.conf.band[1].ch[c].enable)
				continue;
			var frNr = config.conf.band[1].ch[c].frqNr;
			var fr = config.computeChFreq(frNr, 1);
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
	this.tableFilters = [[
1.000000 ,
				1.016678 ,
				1.061021 ,
				1.109984 ,
				1.116782 ,
				1.041478 ,
				0.899731 ,
				0.734357 ,
				0.568942 ,
				0.415877 ,
				0.289137 ,
				0.195918 ,
				0.132457 ,
				0.090574 ,
				0.062973 ,
				0.044552 ,
				0.032032 ,
				0.023359 ,
				0.017240 ,
				0.012849 ,
				0.009652 ,
				0.007292 ,
				0.005530 ,
				0.004202 ,
				0.003192 ,
				0.002419 ,
				0.001823 ,
				0.001362 ,
				0.001003 ,
				0.000724 ,
				0.000507 ,
				0.000337 ,
				0.000205 ,
				0.000103 ,
				0.000024 ,
				0.000036 ,
				0.000082 ,
				0.000116 ,
				0.000140 ,
				0.000157 ,
				0.000169 ,
				0.000175 ,
				0.000178 ,
				0.000178 ,
				0.000176 ,
				0.000172 ,
				0.000167 ,
				0.000160 ,
				0.000154 ,
				0.000146 ,
				0.000139 ,
				0.000131 ,
				0.000123 ,
				0.000115 ,
				0.000108 ,
				0.000101 ,
				0.000093 ,
				0.000087 ,
				0.000080 ,
				0.000074 ,
				0.000068 ,
				0.000062 ,
				0.000057 ,
				0.000052 ,
				0.000047 ,
				0.000043 ,
				0.000039 ,
				0.000035 ,
				0.000032 ,
				0.000028 ,
				0.000025 ,
				0.000023 ,
				0.000020 ,
				0.000018 ,
				0.000016 ,
				0.000014 ,
				0.000012 ,
				0.000010 ,
				0.000009 ,
				0.000008 ,
				0.000007 ,
				0.000006 ,
				0.000005 ,
				0.000004 ,
				0.000003 ,
				0.000002 ,
				0.000002 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 
				],
				[
				1.000000 ,
				1.016677 ,
				1.061018 ,
				1.109977 ,
				1.116769 ,
				1.041460 ,
				0.899709 ,
				0.734332 ,
				0.568917 ,
				0.415853 ,
				0.289117 ,
				0.195902 ,
				0.132444 ,
				0.090563 ,
				0.062965 ,
				0.044545 ,
				0.032026 ,
				0.023354 ,
				0.017236 ,
				0.012846 ,
				0.009649 ,
				0.007289 ,
				0.005528 ,
				0.004201 ,
				0.003191 ,
				0.002418 ,
				0.001822 ,
				0.001361 ,
				0.001003 ,
				0.000724 ,
				0.000506 ,
				0.000337 ,
				0.000205 ,
				0.000103 ,
				0.000024 ,
				0.000036 ,
				0.000082 ,
				0.000116 ,
				0.000140 ,
				0.000157 ,
				0.000168 ,
				0.000175 ,
				0.000178 ,
				0.000178 ,
				0.000176 ,
				0.000172 ,
				0.000166 ,
				0.000160 ,
				0.000153 ,
				0.000146 ,
				0.000138 ,
				0.000131 ,
				0.000123 ,
				0.000115 ,
				0.000108 ,
				0.000100 ,
				0.000093 ,
				0.000086 ,
				0.000080 ,
				0.000074 ,
				0.000068 ,
				0.000062 ,
				0.000057 ,
				0.000052 ,
				0.000047 ,
				0.000043 ,
				0.000039 ,
				0.000035 ,
				0.000031 ,
				0.000028 ,
				0.000025 ,
				0.000022 ,
				0.000020 ,
				0.000018 ,
				0.000015 ,
				0.000014 ,
				0.000012 ,
				0.000010 ,
				0.000009 ,
				0.000008 ,
				0.000006 ,
				0.000005 ,
				0.000004 ,
				0.000004 ,
				0.000003 ,
				0.000002 ,
				0.000002 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000000 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001
				],
				[
				1.000000 ,
				0.988646 ,
				1.055249 ,
				0.451446 ,
				0.142172 ,
				0.056994 ,
				0.026424 ,
				0.013351 ,
				0.007099 ,
				0.003870 ,
				0.002110 ,
				0.001112 ,
				0.000532 ,
				0.000190 ,
				0.000011 ,
				0.000129 ,
				0.000194 ,
				0.000228 ,
				0.000241 ,
				0.000241 ,
				0.000234 ,
				0.000223 ,
				0.000209 ,
				0.000193 ,
				0.000177 ,
				0.000161 ,
				0.000146 ,
				0.000131 ,
				0.000118 ,
				0.000105 ,
				0.000092 ,
				0.000081 ,
				0.000071 ,
				0.000061 ,
				0.000052 ,
				0.000044 ,
				0.000037 ,
				0.000030 ,
				0.000024 ,
				0.000018 ,
				0.000013 ,
				0.000008 ,
				0.000004 ,
				0.000000 ,
				0.000003 ,
				0.000006 ,
				0.000009 ,
				0.000012 ,
				0.000014 ,
				0.000016 ,
				0.000018 ,
				0.000019 ,
				0.000020 ,
				0.000021 ,
				0.000022 ,
				0.000023 ,
				0.000024 ,
				0.000024 ,
				0.000025 ,
				0.000025 ,
				0.000025 ,
				0.000025 ,
				0.000025 ,
				0.000025 ,
				0.000025 ,
				0.000025 ,
				0.000024 ,
				0.000024 ,
				0.000024 ,
				0.000023 ,
				0.000023 ,
				0.000022 ,
				0.000022 ,
				0.000021 ,
				0.000021 ,
				0.000020 ,
				0.000019 ,
				0.000019 ,
				0.000018 ,
				0.000018 ,
				0.000017 ,
				0.000016 ,
				0.000016 ,
				0.000015 ,
				0.000015 ,
				0.000014 ,
				0.000013 ,
				0.000013 ,
				0.000012 ,
				0.000012 ,
				0.000011 ,
				0.000011 ,
				0.000010 ,
				0.000010 ,
				0.000009 ,
				0.000009 ,
				0.000008 ,
				0.000008 ,
				0.000007 ,
				0.000007 ,
				0.000006 ,
				0.000006 ,
				0.000006 ,
				0.000005 ,
				0.000005 ,
				0.000005 ,
				0.000004 ,
				0.000004 ,
				0.000004 ,
				0.000004 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001
				],
				[
				1.000000 ,
				1.067628 ,
				0.187444 ,
				0.032618 ,
				0.009258 ,
				0.003286 ,
				0.001307 ,
				0.000545 ,
				0.000225 ,
				0.000085 ,
				0.000024 ,
				0.000001 ,
				0.000005 ,
				0.000003 ,
				0.000003 ,
				0.000011 ,
				0.000019 ,
				0.000027 ,
				0.000034 ,
				0.000041 ,
				0.000047 ,
				0.000052 ,
				0.000056 ,
				0.000060 ,
				0.000064 ,
				0.000067 ,
				0.000069 ,
				0.000071 ,
				0.000073 ,
				0.000074 ,
				0.000075 ,
				0.000076 ,
				0.000077 ,
				0.000077 ,
				0.000077 ,
				0.000077 ,
				0.000077 ,
				0.000077 ,
				0.000076 ,
				0.000076 ,
				0.000075 ,
				0.000074 ,
				0.000073 ,
				0.000072 ,
				0.000071 ,
				0.000070 ,
				0.000069 ,
				0.000068 ,
				0.000067 ,
				0.000065 ,
				0.000064 ,
				0.000063 ,
				0.000061 ,
				0.000060 ,
				0.000059 ,
				0.000057 ,
				0.000056 ,
				0.000054 ,
				0.000053 ,
				0.000051 ,
				0.000050 ,
				0.000049 ,
				0.000047 ,
				0.000046 ,
				0.000044 ,
				0.000043 ,
				0.000041 ,
				0.000040 ,
				0.000039 ,
				0.000037 ,
				0.000036 ,
				0.000035 ,
				0.000034 ,
				0.000032 ,
				0.000031 ,
				0.000030 ,
				0.000029 ,
				0.000028 ,
				0.000026 ,
				0.000025 ,
				0.000024 ,
				0.000023 ,
				0.000022 ,
				0.000021 ,
				0.000020 ,
				0.000019 ,
				0.000018 ,
				0.000018 ,
				0.000017 ,
				0.000016 ,
				0.000015 ,
				0.000014 ,
				0.000014 ,
				0.000013 ,
				0.000012 ,
				0.000012 ,
				0.000011 ,
				0.000010 ,
				0.000010 ,
				0.000009 ,
				0.000009 ,
				0.000008 ,
				0.000008 ,
				0.000007 ,
				0.000007 ,
				0.000006 ,
				0.000006 ,
				0.000006 ,
				0.000005 ,
				0.000005 ,
				0.000005 ,
				0.000004 ,
				0.000004 ,
				0.000004 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001
				],
				[
				1.000000 ,
				1.048925 ,
				0.488559 ,
				0.083283 ,
				0.023656 ,
				0.008652 ,
				0.003632 ,
				0.001644 ,
				0.000767 ,
				0.000353 ,
				0.000149 ,
				0.000048 ,
				0.000001 ,
				0.000022 ,
				0.000029 ,
				0.000028 ,
				0.000022 ,
				0.000015 ,
				0.000007 ,
				0.000001 ,
				0.000009 ,
				0.000016 ,
				0.000022 ,
				0.000028 ,
				0.000034 ,
				0.000039 ,
				0.000043 ,
				0.000047 ,
				0.000050 ,
				0.000053 ,
				0.000055 ,
				0.000057 ,
				0.000059 ,
				0.000061 ,
				0.000062 ,
				0.000063 ,
				0.000064 ,
				0.000064 ,
				0.000064 ,
				0.000065 ,
				0.000065 ,
				0.000064 ,
				0.000064 ,
				0.000064 ,
				0.000063 ,
				0.000063 ,
				0.000062 ,
				0.000061 ,
				0.000060 ,
				0.000059 ,
				0.000059 ,
				0.000057 ,
				0.000056 ,
				0.000055 ,
				0.000054 ,
				0.000053 ,
				0.000052 ,
				0.000051 ,
				0.000049 ,
				0.000048 ,
				0.000047 ,
				0.000046 ,
				0.000044 ,
				0.000043 ,
				0.000042 ,
				0.000041 ,
				0.000039 ,
				0.000038 ,
				0.000037 ,
				0.000036 ,
				0.000034 ,
				0.000033 ,
				0.000032 ,
				0.000031 ,
				0.000030 ,
				0.000029 ,
				0.000028 ,
				0.000026 ,
				0.000025 ,
				0.000024 ,
				0.000023 ,
				0.000022 ,
				0.000021 ,
				0.000020 ,
				0.000020 ,
				0.000019 ,
				0.000018 ,
				0.000017 ,
				0.000016 ,
				0.000015 ,
				0.000015 ,
				0.000014 ,
				0.000013 ,
				0.000012 ,
				0.000012 ,
				0.000011 ,
				0.000011 ,
				0.000010 ,
				0.000009 ,
				0.000009 ,
				0.000008 ,
				0.000008 ,
				0.000007 ,
				0.000007 ,
				0.000007 ,
				0.000006 ,
				0.000006 ,
				0.000005 ,
				0.000005 ,
				0.000005 ,
				0.000004 ,
				0.000004 ,
				0.000004 ,
				0.000004 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000003 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000002 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001
				],
				[
				1.000000 ,
				0.975885 ,
				0.086436 ,
				0.008795 ,
				0.000106 ,
				0.001045 ,
				0.000947 ,
				0.000650 ,
				0.000363 ,
				0.000126 ,
				0.000064 ,
				0.000214 ,
				0.000332 ,
				0.000426 ,
				0.000502 ,
				0.000562 ,
				0.000611 ,
				0.000650 ,
				0.000682 ,
				0.000707 ,
				0.000727 ,
				0.000743 ,
				0.000755 ,
				0.000764 ,
				0.000770 ,
				0.000774 ,
				0.000775 ,
				0.000775 ,
				0.000774 ,
				0.000771 ,
				0.000767 ,
				0.000761 ,
				0.000755 ,
				0.000748 ,
				0.000740 ,
				0.000731 ,
				0.000722 ,
				0.000712 ,
				0.000702 ,
				0.000691 ,
				0.000680 ,
				0.000669 ,
				0.000657 ,
				0.000645 ,
				0.000632 ,
				0.000620 ,
				0.000607 ,
				0.000594 ,
				0.000581 ,
				0.000568 ,
				0.000554 ,
				0.000541 ,
				0.000528 ,
				0.000514 ,
				0.000501 ,
				0.000488 ,
				0.000474 ,
				0.000461 ,
				0.000448 ,
				0.000435 ,
				0.000422 ,
				0.000409 ,
				0.000396 ,
				0.000384 ,
				0.000371 ,
				0.000359 ,
				0.000347 ,
				0.000335 ,
				0.000324 ,
				0.000312 ,
				0.000301 ,
				0.000290 ,
				0.000279 ,
				0.000268 ,
				0.000258 ,
				0.000248 ,
				0.000238 ,
				0.000228 ,
				0.000219 ,
				0.000210 ,
				0.000201 ,
				0.000192 ,
				0.000183 ,
				0.000175 ,
				0.000167 ,
				0.000160 ,
				0.000152 ,
				0.000145 ,
				0.000138 ,
				0.000131 ,
				0.000124 ,
				0.000118 ,
				0.000112 ,
				0.000106 ,
				0.000101 ,
				0.000095 ,
				0.000090 ,
				0.000085 ,
				0.000080 ,
				0.000076 ,
				0.000071 ,
				0.000067 ,
				0.000063 ,
				0.000059 ,
				0.000056 ,
				0.000052 ,
				0.000049 ,
				0.000046 ,
				0.000043 ,
				0.000040 ,
				0.000037 ,
				0.000035 ,
				0.000032 ,
				0.000030 ,
				0.000028 ,
				0.000026 ,
				0.000024 ,
				0.000022 ,
				0.000021 ,
				0.000019 ,
				0.000018 ,
				0.000016 ,
				0.000015 ,
				0.000014 ,
				0.000013 ,
				0.000012 ,
				0.000011 ,
				0.000010 ,
				0.000009
				],
				[
				1.000000 ,
				0.086436 ,
				0.000106 ,
				0.000947 ,
				0.000363 ,
				0.000064 ,
				0.000332 ,
				0.000502 ,
				0.000611 ,
				0.000682 ,
				0.000727 ,
				0.000755 ,
				0.000770 ,
				0.000775 ,
				0.000774 ,
				0.000767 ,
				0.000755 ,
				0.000740 ,
				0.000722 ,
				0.000702 ,
				0.000680 ,
				0.000657 ,
				0.000632 ,
				0.000607 ,
				0.000581 ,
				0.000554 ,
				0.000528 ,
				0.000501 ,
				0.000474 ,
				0.000448 ,
				0.000422 ,
				0.000396 ,
				0.000371 ,
				0.000347 ,
				0.000324 ,
				0.000301 ,
				0.000279 ,
				0.000258 ,
				0.000238 ,
				0.000219 ,
				0.000201 ,
				0.000183 ,
				0.000167 ,
				0.000152 ,
				0.000138 ,
				0.000124 ,
				0.000112 ,
				0.000101 ,
				0.000090 ,
				0.000080 ,
				0.000071 ,
				0.000063 ,
				0.000056 ,
				0.000049 ,
				0.000043 ,
				0.000037 ,
				0.000032 ,
				0.000028 ,
				0.000024 ,
				0.000021 ,
				0.000018 ,
				0.000015 ,
				0.000013 ,
				0.000011 ,
				0.000009 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001
				],
				[
				1.000000 ,
				0.000106 ,
				0.000363 ,
				0.000332 ,
				0.000611 ,
				0.000727 ,
				0.000770 ,
				0.000774 ,
				0.000755 ,
				0.000722 ,
				0.000680 ,
				0.000632 ,
				0.000581 ,
				0.000528 ,
				0.000474 ,
				0.000422 ,
				0.000371 ,
				0.000324 ,
				0.000279 ,
				0.000238 ,
				0.000201 ,
				0.000167 ,
				0.000138 ,
				0.000112 ,
				0.000090 ,
				0.000071 ,
				0.000056 ,
				0.000043 ,
				0.000032 ,
				0.000024 ,
				0.000018 ,
				0.000013 ,
				0.000009 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001 ,
				0.000001
				]];
	this.computeInput = function(rawData) {
		for (var i = 0; i <= this.nchannels; ++i) {
			this.inputSpectrum[i] = rawData[i];
		}
	}
	this.findNearestActiveChannelIndexInRange = function(chNr, range) {
		var minFrqNr = config.computeChNum(factory.data.band[1].fStart, 1);
		var maxFrqNr = config.computeChNum(factory.data.band[1].fStop, 1);
		for (var i = 0; i < range; ++i) {
			for (j = 0; j < 2; ++j) {
				var num = chNr + i*(j ? 1 : -1);
				if (num < minFrqNr || num > maxFrqNr)
					continue;
				var idxList = config.indexOfChannel(1, num);
				for (var k = 0; k < idxList.length; ++k) {
					if (!this.isChannelOnAndActive(idxList[k]))
						continue;
					return idxList[k];
				}					
			}
		}
		return -1;
	}
	this.isChannelOnAndActive = function(idx) {
		return config.isChannelOnAndActive(1, idx, monit.stat.band[1].ch[idx].signalIn);
	}
	this.computeOutput = function(inData) {
		for (var i = 0; i < this.nchannels; ++i) {
			var fr = this.FreqMinHz + this.FreqStepHz * i;
			var gain = this.computeGain(fr);
			this.outputSpectrum[i] = inData[i] + 20 * Math.log(gain) / Math.LN10;
		}
	}
	this.computeGain = function(fr) {
		var MINGAIN = 1.0e-6;
		if (!config.conf.band[1].hpaEnable)
			return (MINGAIN * this.maxChNr);
		var gain = MINGAIN;
		var frqNr = config.computeChNum(fr, 1);
		var fstepfactor = factory.data.fstep==3125?2:1;
		var range = (this.tableFilters[0].length - 1)*fstepfactor;
		var idx = this.findNearestActiveChannelIndexInRange(frqNr, range);
		for (var i = 0; i < this.maxChNr; ++i) {
			if (!this.isChannelOnAndActive(i)) {
				gain += MINGAIN;
				continue;
			}
			var gainch = Math.pow(10, monit.stat.band[1].ch[i].gain / 20);
			if (i == idx) {
				var bw = config.conf.band[1].ch[idx].bandwidth;
				var ch_offset = ~~Math.round(Math.abs(frqNr - config.conf.band[1].ch[idx].frqNr) / fstepfactor);
				gain += gainch * this.tableFilters[bw][ch_offset];
			} else {
				gain += gainch * MINGAIN;
			}
		}
		if (gain == 0) {
			gain = MINGAIN;
		}
		return gain;
	}
	this.createBandLimitsForm = function() {
		var cont = document.getElementsByTagName("body");
		var tab = document.createElement("table");
		tab.style.marginLeft = "15px";
		tab.style.marginTop = "50px";
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
		var fstartspec = localStorage.getItem("start_spec_1c"+window.location.host);
		var fstopspec = localStorage.getItem("stop_spec_1c"+window.location.host);
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
		localStorage.setItem("start_spec_1c"+window.location.host,this.FreqMinHz);
		localStorage.setItem("stop_spec_1c"+window.location.host,this.FreqMaxHz);
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
		localStorage.setItem("start_spec_1c"+window.location.host,this.newFreqMinHz);
		localStorage.setItem("stop_spec_1c"+window.location.host,this.newFreqMaxHz);
		var el = document.getElementById("fstart");
		el.value = (this.newFreqMinHz / 1e6).toFixed(1);
		el = document.getElementById("fstop");
		el.value = (this.newFreqMaxHz / 1e6).toFixed(1);
	}
	this.maxChNr = maxChNr;
	this.inContentbox = document.getElementById("inContentbox");
	this.outContentbox = document.getElementById("outContentbox");
	this.inYscale = {min: -100.0, max: 0.0 };
	this.outYscale = {min: -50.0, max: 50.0};
	this.divisions = {x: 10, y: 10};
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
	this.MAXCOUNTGETS = 30;
	this.bandChanged = false;
	this.barwidth;
}
function submitform() {
	spectrum.reSetBandLimits();
}
// -->
