var FILT90KSTEPKHZ = [93.75, 93.75, 93.75, 93.75];
var FilterTypes = [
	{
		'osc': "clk160",
		'filt': [
			{'name': "90K", 'data':   [ 83.6,  98.9, 129.4, 14.4]},
			{'name': "60K", 'data':   [ 54.9,  64.7,  84.8, 18.8]},
			{'name': "45K", 'data':   [ 40.3,  47.6,  62.3, 23.3]},
			{'name': "30K", 'data':   [ 28.1,  33.6,  43.3, 30.9]},
			{'name': "20K", 'data':   [ 18.3,  21.4,  28.1, 44.9]},
			{'name': "15K", 'data':   [ 14.6,  17.1,  22.0, 54.9]},
			{'name': "2_90K", 'data': [167.2, 188.6, 219.7, 13.2]},
			{'name': "3_90K", 'data': [255.1, 281.4, 313.1, 13.3]},
			{'name': "4_90K", 'data': [349.1, 374.8, 406.5, 13.2]},
			{'name': "5_90K", 'data': [443.1, 468.8, 500.5, 13.3]}
		]
	},
	{
		'osc': "clk150", 
	 	'filt': [
			{'name': "90K", 'data':   [ 84.1,  99.6, 130.5, 14.7]},
			{'name': "60K", 'data':   [ 55.5,  65.2,  85.3, 19.1]},
			{'name': "45K", 'data':   [ 40.6,  48.1,  62.9, 23.7]},
			{'name': "30K", 'data':   [ 28.0,  33.2,  43.5, 31.4]},
			{'name': "20K", 'data':   [ 18.3,  21.2,  28.0, 45.4]},
			{'name': "15K", 'data':   [ 14.3,  16.6,  21.7, 56.2]},
			{'name': "2_90K", 'data': [171.7, 190.5, 222.0, 13.4]},
			{'name': "3_90K", 'data': [258.1, 282.7, 314.1, 13.6]},
			{'name': "4_90K", 'data': [352.5, 376.5, 408.0, 13.4]},
			{'name': "5_90K", 'data': [445.7, 470.4, 501.8, 13.6]}
		]
	},
	{
		'osc': "clk67.5", 
	 	'filt': [
			{'name': "90K", 'data':   [ 85.5, 102.0, 132.9, 15.2]},
			{'name': "60K", 'data':   [ 56.1,  66.4,  86.5, 19.6]},
			{'name': "45K", 'data':   [ 40.8,  48.2,  63.1, 24.2]},
			{'name': "30K", 'data':   [ 28.2,  33.3,  43.6, 31.9]},
			{'name': "20K", 'data':   [ 18.2,  21.2,  27.8, 45.9]},
			{'name': "15K", 'data':   [ 14.3,  16.7,  21.9, 56.2]},
			{'name': "2_90K", 'data': [175.6, 193.6, 225.0, 14.2]},
			{'name': "3_90K", 'data': [263.7, 285.3, 317.2, 14.0]},
			{'name': "4_90K", 'data': [357.4, 379.5, 411.0, 14.1]},
			{'name': "5_90K", 'data': [451.1, 473.3, 505.2, 14.0]}
		]
	},
	{
		'osc': "clk153.6", 
	 	'filt': [
			{'name': "90K", 'data':   [ 83.8,  99.6, 130.1, 14.6]},
			{'name': "60K", 'data':   [ 56.8,  66.8,  87.3, 18.6]},
			{'name': "45K", 'data':   [ 41.6,  49.2,  64.5, 23.1]},
			{'name': "30K", 'data':   [ 28.7,  34.0,  44.5, 30.6]},
			{'name': "20K", 'data':   [ 18.8,  21.7,  28.7, 44.4]},
			{'name': "15K", 'data':   [ 14.6,  17.0,  22.3, 54.9]},
			{'name': "2_90K", 'data': [169.9, 189.8, 220.9, 13.3]},
			{'name': "3_90K", 'data': [257.2, 281.8, 314.1, 13.5]},
			{'name': "4_90K", 'data': [351.0, 375.6, 407.8, 13.3]},
			{'name': "5_90K", 'data': [444.7, 469.3, 501.6, 13.5]}
		]
	}
];

function FhelpGui(osc, clk) {
	var self = this;
	this.osc = osc;
	this.clkNr = clk;
	this.filterTitles = [
		"BW@1dB&nbsp;(KHz)",
		"BW@3dB&nbsp;(KHz)",
		"BW@10dB&nbsp;(KHz)",
		"Delay&nbsp;(us)"
	];
	this.filterTypes = FilterTypes;
	this.create = function() {
		var box = document.getElementById("fhFiltBox");
		remove_children(box);
		this.createFHelp(box);
	}
	this.createFHelp = function(box) {
		var n = self.clkNr;
		var filt = self.filterTypes[n]['filt'];
		for (var i = 0; i < filt.length; ++i) {
			var tr = document.createElement("tr");
			box.appendChild(tr);
			var td = document.createElement("td");
			tr.appendChild(td);
			var el = document.createElement("img");
			var picname = "/"+filt[i].name+"clk150"+".png";
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
		for (var r = 0; r < self.filterTitles.length; ++r) {
			var tr = document.createElement("tr");
			tb.appendChild(tr);
			var td = document.createElement("th");
			td.innerHTML = self.filterTitles[r];
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
	var osc, clk;
	var q = param();
	if (q['osc']) {
		osc = entify(q['osc']);
	} else {
		osc = 150;
	}
	if (q['clk']) {
		clk = entify(q['clk']);
	} else {
		clk = 1;
	}
	fhGui = new FhelpGui(osc, clk);
	fhGui.create();
}

