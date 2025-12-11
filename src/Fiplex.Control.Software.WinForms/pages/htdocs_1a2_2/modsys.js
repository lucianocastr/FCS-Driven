<!--
function Modsys() {
	this.FRAMELEN = 370;
	this.modsysMaxNr = 10;
	this.modeBitsNr = 8;
	this.currentFrame = "";
	this.formExist = false;
	this.Bandwidths = ['90KHz', '45KHz', '30KHz', '20KHz', '15KHz'];
	this.sysnameLen = 15;
	this.data = {
		index:		0,
		bwmask:		0,
		ftrackth:	0,
		mumax:		0,
		tautrack: 	[],
		mode:		0,
		kfactor:	0,
		sysname:	0,
		disabled:	true,
	}
	this.frameMap = [];
	this.frameMap.push( {id:'index', 	pos:  0, len:  2, data: 0} );
	this.frameMap.push( {id:'bwmask', 	pos:  2, len:  2, data: 0} );
	this.frameMap.push( {id:'ftrackth', 	pos:  4, len:  2, data: 0} );
	this.frameMap.push( {id:'mumax', 	pos:  6, len:  2, data: 0} );
	for (var i = 0; i < this.Bandwidths.length; ++i) {
		this.frameMap.push( {id:'tautrack', pos: 8+i*2, len:  2, data: 0} );
	}
	this.frameMap.push( {id:'mode', 	pos: 18, len:  2, data: 0} );
	this.frameMap.push( {id:'kfactor', 	pos: 20, len:  2, data: 0} );
	this.frameMap.push( {id:'sysname', 	pos: 22, len: this.sysnameLen, data: 0} );
	this.formMap = [];
	this.formMap.push({id:'index',		label:'MODULATION&nbsp;SYSTEM&nbsp;INDEX&nbsp;'	});
	this.formMap.push({id:'enabled',	label:'SYSTEM&nbsp;ENABLED&nbsp;'		});
	this.formMap.push({id:'sysname',	label:'MODULATION&nbsp;SYSTEM&nbsp;NAME&nbsp;'	});
	this.formMap.push({id:'ftrackth',	label:'FAST&nbsp;TRACK&nbsp;THRESHOLD&nbsp;'	});
	this.formMap.push({id:'mumax',		label:'MU&nbsp;MAX&nbsp;'			});
	for (var i = 0; i < this.Bandwidths.length; ++i) {
		this.formMap.push({id:'bw'+this.Bandwidths[i], label:'ENABLE&nbsp;BANDWIDTH&nbsp;'+this.Bandwidths[i] });
	}
	for (var i = 0; i < this.Bandwidths.length; ++i) {
		this.formMap.push({id:'tautrack'+this.Bandwidths[i], label:'TAU&nbsp;TRACK&nbsp;'+this.Bandwidths[i] });
	}
	this.formMap.push({id:'mode',		label:'MODE&nbsp;'	});
	this.formMap.push({id:'kfactor',	label:'K-FACTOR&nbsp;'	});
	this.createMainTable = function() {
		var mainTab = document.getElementById("MainTable");
		if (mainTab)
			return;
		mainTab = document.createElement("table");
		mainTab.id = "MainTable";
		var cont = document.getElementById("page");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		for (var i = 0; i < this.formMap.length; ++i) {
			var row = document.createElement("tr");
			row.id = 'row'+this.formMap[i].id;
			mainTb.appendChild(row);
			var cell = document.createElement("th");
			cell.innerHTML = this.formMap[i].label;
			row.appendChild(cell);
		}
	}
	this.createForm = function() {
		if (this.formExist)
			return;
		this.formExist = true;
		this.createMainTable();
		for (var i = 0; i < this.formMap.length; ++i) {
			var el;
			var row = document.getElementById('row'+this.formMap[i].id);
			var cell = document.createElement("td");
			row.appendChild(cell);
			if (this.formMap[i].id == 'index') {
				el = document.createElement("select");
				el.className = "centered";
				for (var k = 0; k < this.modsysMaxNr; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = k;
					opt.value = k;
				}
				el.selectedIndex = 0;
				el.onchange = function(ev) {
					ev = ev || window.event;
					var target = ev.target ? ev.target : ev.srcElement;
					modsys.render(target.selectedIndex);
				}
			} else if (this.formMap[i].id == 'mode') {
				el = document.createElement("select");
				el.className = "centered";
				for (var k = 0; k < this.modeBitsNr; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = k;
					opt.value = k;
				}
				el.style.fontSize = "10px";
			} else {
				el = document.createElement("input");
				el.className = "number";
			}
			el.id = this.formMap[i].id;
			el.name = el.id;
			if (this.formMap[i].id == 'enabled' || this.formMap[i].id.substr(0,2) == 'bw') {
				el.type = 'checkbox';
			} else if (this.formMap[i].id != 'index' && this.formMap[i].id != 'mode') {
				el.type = 'text';
				if (this.formMap[i].id == 'sysname') {
					el.style.textAlign = "center";
					el.style.fontWeight = "bold";
					el.size = 15;
				} else {
					el.size = 10;
				}
				el.onkeypress = function(ev) {
					ev = ev || window.event;
					var target = ev.target ? ev.target : ev.srcElement;
					if (target.id == 'mumax')
						return isKeyDecimalNumber(ev);
					else if (target.id != 'sysname')
						return numbersOnly(ev);
				}

			}
			cell.appendChild(el);
		}
	}
	this.getBwIndex = function(n) {
		try {
			for (var i = 0; i < this.Bandwidths.length; ++i) {
				if (this.formMap[n].id == 'bw'+this.Bandwidths[i])
					return i;
			}
			return -1;
		} catch (err) { return -1; }
	}
	this.getTautrackIndex = function(n) {
		try {
			for (var i = 0; i < this.Bandwidths.length; ++i) {
				if (this.formMap[n].id == 'tautrack'+this.Bandwidths[i])
					return i;
			}
			return -1;
		} catch(err) { return -1; }
	}
	this.read = function(sr) {
		this.currentFrame = sr;
	}
	this.unitFrameLength = function() {
		var n = this.frameMap.length-1;
		var unitLen = this.frameMap[n].pos + this.frameMap[n].len;
		return unitLen;
	}
	this.parse = function(nr) {
		var n = this.frameMap.length-1;
		var unitLen = this.frameMap[n].pos + this.frameMap[n].len;
		var sr = this.currentFrame;
		var startPos = unitLen*nr;
		if (sr.len < startPos + unitLen)
			return false;
		for (var i = 0; i < n; ++i) {
			try {
				var num = parseInt(sr.substr(startPos+this.frameMap[i].pos, this.frameMap[i].len), 16);
				this.frameMap[i].data = num;
			} catch (err) { return false; }
		}
		this.frameMap[n].data = new String(sr.substr(startPos+this.frameMap[n].pos, this.frameMap[n].len));
		this.frameMap[n].data = this.frameMap[n].data.trim();
		n = 0;
		this.data.index =  this.frameMap[n].data & 0x7F;
		this.data.disabled = (this.frameMap[n].data & 0x80) != 0;
		this.data.bwmask = this.frameMap[++n].data;
		this.data.ftrackth=this.frameMap[++n].data;
		this.data.mumax	 = cSignedByte(this.frameMap[++n].data)/4;
		for (var i = 0; i < this.Bandwidths.length; ++i) {
			this.data.tautrack[i] = this.frameMap[++n].data;
		}
		this.data.mode =  this.frameMap[++n].data & 0x07;
		this.data.kfactor= this.frameMap[++n].data;
		this.data.sysname =  this.frameMap[++n].data;
		return true;
	}
	this.enabledSystemsNr = function() {
		var nsystems = 0;
		for (var i = 0; i < this.modsysMaxNr; ++i) {
			this.parse(i);
			if (this.data.disabled)
				continue;
			nsystems++;
			this.defaultSystem = i;
		}
		return nsystems
	}
	this.render = function(nr) {
		this.createForm();
		if (typeof(nr) == "undefined") {
			el = document.getElementById('index');
			nr = isNaN(el.selectedIndex) ? 0 : el.selectedIndex;
		}
		var parsedOK = this.parse(nr);
		for (var i = 0; i < this.formMap.length; ++i) {
			try {
				var el = document.getElementById(this.formMap[i].id);
				var n;
				if (this.formMap[i].id == 'index')
					el.selectedIndex = nr;
				else if (this.formMap[i].id == 'enabled')
					el.checked = !this.data.disabled;
				else if (this.formMap[i].id == 'sysname')
					el.value = this.data.sysname;
				else if (this.formMap[i].id == 'ftrackth')
					el.value = this.data.ftrackth;
				else if (this.formMap[i].id == 'mumax')
					el.value = this.data.mumax;
				else if (this.formMap[i].id == 'mode')
					el.selectedIndex = this.data.mode;
				else if (this.formMap[i].id == 'kfactor')
					el.value = this.data.kfactor;
				else if ((n = this.getBwIndex(i)) >= 0)
					el.checked = ((1 << n) & this.data.bwmask);
				else if ((n = this.getTautrackIndex(i)) >= 0)
					el.value = this.data.tautrack[n];
			} catch (err) { continue; }
		}
	}
	this.format = function() {
		var frm = "";
		var el, num, n;
		var unitLen = this.unitFrameLength();
		var currentSubFrm;
		try {
			el = document.getElementById('index');
			if (el) {
				n = el.selectedIndex;
				currentSubFrm = this.currentFrame.substr(n*unitLen, unitLen);
			} else {
				currentSubFrm = this.currentFrame.substr(0, unitLen);
			}
			num = el.selectedIndex;
			el = document.getElementById('enabled');
			if (!el.checked)
				num |= 0x80;
			frm += hexformat(num, 2);
		} catch(err) { frm += currentSubFrm.substr(frm.length, 2); }
		try {
			num = 0
			for (var i = 0; i < this.Bandwidths.length; ++i) {
				el = document.getElementById('bw'+this.Bandwidths[i]);
				if (el.checked)
					num |= (1 << i);
			}
			frm += hexformat(num, 2);
		} catch (err) { frm += currentSubFrm.substr(frm.length, 2); }
		try {
			el = document.getElementById('ftrackth');
			num = parseInt(el.value);
			frm += hexformat(num, 2);
		} catch (err) { frm += currentSubFrm.substr(frm.length, 2); }
		try {
			el = document.getElementById('mumax');
			num = parseFloat(el.value);
			num = rSignedByte(Math.round(num*4));
			frm += hexformat(num, 2);
		} catch (err) { frm += currentSubFrm.substr(frm.length, 2); }
		for (var i = 0; i < this.Bandwidths.length; ++i) {
			try {
				el = document.getElementById('tautrack'+this.Bandwidths[i]);
				num = parseInt(el.value);
				frm += hexformat(num, 2);
			} catch (err) { frm += currentSubFrm.substr(frm.length, 2); }
		}
		try {
			el = document.getElementById('mode');
			num = el.selectedIndex & 0x07;
			frm += hexformat(num, 2);
		} catch (err) { frm += currentSubFrm.substr(frm.length, 2); }
		try {
			el = document.getElementById('kfactor');
			num = parseInt(el.value);
			frm += hexformat(num, 2);
		} catch (err) { frm += currentSubFrm.substr(frm.length, 2); }
		try {
			el = document.getElementById('sysname');
			var str = new String(el.value);
			str = str.trim();
			while (str.length < this.sysnameLen)
				str += ' ';
			frm += str;
		} catch (err) { frm += currentSubFrm.substr(frm.length, this.sysnameLen); }
		return frm;
	}
}
// -->