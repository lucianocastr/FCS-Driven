var FILT90KSTEPKHZ = [225, 225];
var FilterTypes = [
	{
		'osc': "clk160",
		'filt': [
			{'name': "150K", 'data':   [ 159.9,	 195.5,	 253.8, 11.0]},
			{'name': "100K", 'data':   [  99.9,	 119.2,	 155.5, 13.8]},
			{'name': "75K", 'data':    [  74.9,	  89.0,	 116.3, 16.1]},
			{'name': "62K", 'data':    [  62.6,	  74.0,	  96.7, 18.0]},
			{'name': "50K", 'data':    [  50.0,	  59.2,	  77.4, 20.8]},
			{'name': "37K", 'data':    [  37.5,	  44.4,	  58.1, 25.5]},
			{'name': "25K", 'data':    [  25.0,	  29.6,	  38.6, 34.8]},
			{'name': "12K", 'data':    [  12.4,	  14.6,	  19.2, 63.1]},
			{'name': "2_150K", 'data': [ 363.5,	 414.6,	 475.5, 12.3]},
			{'name': "3_150K", 'data': [ 588.5,	 639.6,	 700.5, 11.2]},
			{'name': "4_150K", 'data': [ 813.4,	 864.6,	 925.4, 12.3]},
			{'name': "5_150K", 'data': [1038.5,	1089.6,	1150.5, 11.2]}
		]
	},
	{
		'osc': "clk150", 
		'filt': [
			{'name': "150K", 'data':   [161.2,	197.6,  256.4,  11.1]},
			{'name': "100K", 'data':   [100.0,	119.2, 	155.6,	13.9]},
			{'name': "75K", 'data':    [ 75.0,	 89.1, 	116.2,	16.3]},
			{'name': "62K", 'data':    [ 62.4,	 74.1, 	 96.7,	18.2]},
			{'name': "50K", 'data':    [ 50.1,	 59.2, 	 77.3,	21.0]},
			{'name': "37K", 'data':    [ 37.6,	 44.4, 	 58.0,	25.6]},
			{'name': "25K", 'data':    [ 25.0,	 29.7, 	 38.7,	34.9]},
			{'name': "12K", 'data':    [ 12.7,   14.9,   19.7, 	62.2]},
			{'name': "2_150K", 'data': [ 352.9,	 414.8,  477.3, 12.5]},
			{'name': "3_150K", 'data': [ 577.7,	 639.9,  702.3, 11.3]},
			{'name': "4_150K", 'data': [ 802.7,	 864.9,  927.3, 12.5]},
			{'name': "5_150K", 'data': [1027.7,	1089.9, 1152.3, 11.3]}
		]
	}
];

var AdjFilterTypes = [
	{'name': "BW0.2MHz",  'data': [ 0.19,  0.28,  0.41, 6.3]},
	{'name': "BW0.5MHz",  'data': [ 0.50,  0.62,  0.76, 5.0]},
	{'name': "BW1.0MHz",  'data': [ 1.00,  1.12,  1.25, 4.3]},
	{'name': "BW2.0MHz",  'data': [ 2.00,  2.12,  2.26, 3.8]},
	{'name': "BW5.0MHz",  'data': [ 5.00,  5.12,  5.26, 3.4]},
	{'name': "BW10.0MHz", 'data': [10.00, 10.12, 10.26, 3.2]},
	{'name': "BW18.0MHz", 'data': [18.00, 18.12, 18.26, 3.2]}
];

function FhelpGui(osc, clk, adj) {
	var self = this;
	this.osc = osc;
	this.clkNr = clk;
	this.adj = adj;
	this.filterTitles = [
		"BW@1dB&nbsp;(KHz)",
		"BW@3dB&nbsp;(KHz)",
		"BW@10dB&nbsp;(KHz)",
		"Delay&nbsp;(us)"
	];
	this.adjFilterTitles = [
		"BW@1dB&nbsp;(MHz)",
		"BW@3dB&nbsp;(MHz)",
		"BW@10dB&nbsp;(MHz)",
		"Delay&nbsp;(us)"
	];
	this.filterTypes = FilterTypes;
	this.adjFilterTypes = AdjFilterTypes;
	this.create = function() {
		var box = document.getElementById("fhFiltBox");
		remove_children(box);
		this.createFHelp(box);
	}
	this.createFHelp = function(box) {
		var n = self.clkNr;
		var filt = self.adj ? self.adjFilterTypes : self.filterTypes[n]['filt'];
		for (var i = 0; i < filt.length; ++i) {
			var tr = document.createElement("tr");
			box.appendChild(tr);
			var td = document.createElement("td");
			tr.appendChild(td);
			var el = document.createElement("img");
			var picname = "/"+filt[i].name;
			if (!adj) {
				picname += "clk150";
			}
			picname += ".png";
			el.src = picname;
			el.className = "fhelp";
			td.appendChild(el);

			td = document.createElement("td");
			tr.appendChild(td);
			var fdata = filt[i].data;
			var dataTble = self.createFhDataTable(fdata);
			var dbox = document.createElement("div");
			dbox.appendChild(dataTble);
			td.appendChild(dbox);
		}
	}
	this.createFhDataTable = function(fdata) {
		var tbl = document.createElement("table");
		tbl.className = "fhelp";
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var titles = self.adj ? self.adjFilterTitles : self.filterTitles;
		for (var r = 0; r < titles.length; ++r) {
			var tr = document.createElement("tr");
			tb.appendChild(tr);
			var td = document.createElement("th");
			td.innerHTML = titles[r];
			td.className = "fhelp";
			tr.appendChild(td);
			var td = document.createElement("td");
			td.innerHTML = fdata[r].toFixed(1);
			td.className = "fhelp";
			tr.appendChild(td);
		}
		return tbl;
	}
}

var fhGui;
function fhonload() {
	//document.title = "";
	var osc, clk, adj;
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
	if (q['adj']) {
		var a = entify(q['adj']);
		adj = (a == "true");
	} else {
		adj = false;
	}
	fhGui = new FhelpGui(osc, clk, adj);
	fhGui.create();
}

