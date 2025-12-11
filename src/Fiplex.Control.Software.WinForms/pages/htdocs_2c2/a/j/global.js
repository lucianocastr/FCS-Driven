var config = new ConfigBDA();
var NFPAcfg = new NFPAconf(); 
var cnfToSend;
var monitor = new Monitor();
var factory = new Factory();
var version = new Version();
var bsGui = new bsToolGui();
var wtGui = new walkthroughGui();
var n_retry;
var waitAns=false;
var mouse = false;
var tmrIdStat;
var waitIcon;
var indexHome = 0;
var bandGUI;
var nbadjGUI;
var firstnet;
var pageAst = new PageAssisted();
var pageAdv = new Page();
var statCount = 0;
var commissioning = false;
var WAITINGACKCCH = 1;
var COMMISSIONING = 2;
var WAITINGACKCONF = 3;
var WAITINGACKCONFGAIN = 4;
var NUMCOMMMEAS = 10;
var rssiComm = [-140,-140,-140];
var signalComm = [false,false,false];
var maxAllowComm = [0,0,0];
var naComm = [0,0,1];
var serial;
var eventLog;
var stepc;
var locurl = 0;
var dash;
//spectrum
var canvas = document.getElementById("canvas1");
var color = "";
var ctx = document.getElementById("canvas1").getContext("2d");
var spec = new Spectrum();
var initAlarmConfig = false;
var mode2ndq = true;
function PageAssisted() {
	this.createSpectrumSettings = function(band,na,num) {
		var y,r,c,e,k,o;
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('SPECTRUM ANALYZER<br>SETTINGS').prop("colSpan",3);r.append(c);
		r = $('<tr/>').css("height","10px");y.append(r);
		//band
		
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Band");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<select/>',{id:"band"}).css("width","100%").prop("dir","rtl");c.append(e);
		o = [{val:0, text:factory.bandNames[0]}, {val:1, text:factory.bandNames[1]}];
		$(o).each(function() {e.append($("<option>").attr('value',this.val).text(this.text));});
		e.change(function(ev) {
			spec.band = $(this).prop("selectedIndex");
			spec.initSettings(true);
			spec.getSettings();
		});
		r = $('<tr/>').css("height","10px");y.append(r);
		//fstart
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Freq.Start");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<input/>',{id:'fstart',class:"number"}).prop({"size":"10"});c.append(e);
		e.change(function(ev) {
			spec.fstart = (~~$(this).val())*1e6;
			spec.getSettings();
		});
		c = $('<td/>',{class:'tdBlue'}).html("MHz");r.append(c);
		//fstop
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Freq.Stop");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<input/>',{id:'fstop',class:"number"}).prop({"size":"10"});c.append(e);
		e.change(function(ev) {
			spec.fstop = (~~$(this).val())*1e6;
			spec.getSettings();
		});
		c = $('<td/>',{class:'tdBlue'}).html("MHz");r.append(c);
		r = $('<tr/>').css("height","10px");y.append(r);
		//rbw
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("RBW");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<select/>',{id:"rbw"}).css("width","100%").prop("dir","rtl");c.append(e);
		o = [{val:0, text:'3125'}, {val:1, text:'6250'}, {val:2, text:'12500'}, {val:3, text:'25000'}, {val:4, text:'50000'}];
		$(o).each(function() {e.append($("<option>").attr('value',this.val).text(this.text));});
		e.change(function(ev) {
			spec.rbw = $(this).prop("selectedIndex");
			spec.getSettings();
		});
		e.prop("selectedIndex",0); 
		c = $('<td/>',{class:'tdBlue'}).html("Hz");r.append(c);
		r = $('<tr/>').css("height","10px");y.append(r);
		//navg
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Num.AVG");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<input/>',{id:'navg',class:"number"}).prop({"size":"10"});c.append(e);
		e.change(function(ev) {
			spec.avg = ~~$(this).val();
			spec.getSettings();
		});
		r = $('<tr/>').css("height","10px");y.append(r);
		//inout
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Signal");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<select/>',{id:"inout"}).css("width","100%").prop("dir","rtl");c.append(e);
		o = [{val:0, text:'IN'}, {val:1, text:'OUT'}];
		$(o).each(function() {e.append($("<option>").attr('value',this.val).text(this.text));});
		e.change(function(ev) {
			spec.io = $(this).prop("selectedIndex");
			spec.getSettings();
		});
		e.prop("selectedIndex",spec.io); 
		r = $('<tr/>').css("height","10px");y.append(r);
		//uldl
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Link");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<select/>',{id:"uldl"}).css("width","100%").prop("dir","rtl");c.append(e);
		o = [{val:0, text:'UL'}, {val:1, text:'DL'}];
		$(o).each(function() {e.append($("<option>").attr('value',this.val).text(this.text));});
		e.change(function(ev) {
			spec.chain = $(this).prop("selectedIndex");
			spec.initSettings(true);
			spec.getSettings();
		});
		e.prop("selectedIndex",0);
		r = $('<tr/>').css("height","10px");y.append(r);
		//highlight
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Highlight filters bandpass");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<input/>',{id:'highlight',class:"number",type:"checkbox"}).prop('checked',false);c.append(e); //recuperar de localstorage
		e.click(function(ev) {
			localStorage.setItem("hl"+Prjstr+window.location.host, $('#highlight').prop("checked")?1:0);
		});
		//maxhold
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:'tdBlue'}).html("Max Hold");r.append(c);
		c = $('<td/>');r.append(c);
		e = $('<input/>',{id:'maxhold',class:"number",type:"checkbox"}).prop('checked',false);c.append(e); //recuperar de localstorage
		r = $('<tr/>');y.append(r);
		c = $('<td/>').prop("colSpan",3).css("textAlign","center");r.append(c);
		e = $('<input/>',{id:'btnRestart',type:"button",class:"btnazul"}).val('Restart Max Hold');c.append(e);
		e.click(function(ev) {
			spec.clearMaxHold();
		});
		//save spect image for report
		r = $('<tr/>');y.append(r);
		r = $('<tr/>').css("height","10px");y.append(r);
		c = $('<td/>').prop("colSpan",3).css("textAlign","center");r.append(c);
		e = $('<input/>',{id:'btnSaveSpecImage',type:"button",class:"btnazul"}).val('Save Trace');c.append(e);
		e.click(function(ev) {
			var num = ~~$("input[name='ntrace']:checked").val();
			save_image(num);
		});
		//clear spect image for report
		r = $('<tr/>');y.append(r);
		r = $('<tr/>').css("height","10px");y.append(r);
		c = $('<td/>').prop("colSpan",3).css("textAlign","center");r.append(c);
		e = $('<input/>',{id:'btnClearSpecImage',type:"button",class:"btnazul"}).val('Clear Trace');c.append(e);
		e.click(function(ev) {
			var num = ~~$("input[name='ntrace']:checked").val();
			var img="";
			localStorage.setItem("img"+num,img);
			$('#imgspec'+num).prop("src","i/blank.gif");

		});
		//num traces
		r = $('<tr/>');y.append(r);
		r = $('<tr/>').css({"height":"10px","textAlign":"center"});y.append(r);
		c = $('<td/>').prop("colSpan",3);r.append(c);
		var ntraces = ['A','B','C','D'];
		for (k=1;k<=4;k++){
			e = $('<input/>',{id:'ntrace',name:'ntrace',type:"radio"}).val(k);
			if (k==1) e.prop("checked",true);
			c.append(e);
			c.append($('<span/>').html(ntraces[k-1]));
		}
		for (k=1;k<=4;k++){
			var img = localStorage.getItem("img"+k);
			if (img!=null){
				if (img.length>10){
					$('#imgspec'+k).prop("src",img);
				}else{
					$('#imgspec'+k).prop("src","i/blank.gif");
				}
			}else{
				$('#imgspec'+k).prop("src","i/blank.gif");
			}
		}
		return y;
	}
	this.createRSSIFilterTables = function(band,na,num) {
		var t,y,r,c,str,k,j;
		t = $('<table/>',{class:"bt"}).css("padding","1px");
		y = $('<tbody/>',{id:"TableFilter_"+band+"_"+na});t.append(y);
		r = $('<tr/>');y.append(r);
		//header
		if (na==1){
			$('<td/>').appendTo(r);
			$('<td/>').appendTo(r);
			c = $('<td/>',{class:"tdBlack"}).html('UPLINK');r.append(c);
			c.prop("colSpan",6);
			c = $('<td/>',{class:"tdBlack"}).html('DOWNLINK');r.append(c);
			c.prop("colSpan",6);
			r = $('<tr/>');y.append(r);
			var headNames = ['Nr','CCH','START FREQ','STOP FREQ','RSSI','START FREQ','STOP FREQ','RSSI'];
		}else{
			var headNames = ['Nr','CCH','UPLINK FREQUENCY','RSSI','DOWNLINK FREQUENCY','RSSI'];
		}
		for (k=0;k<headNames.length;k++){
			c = $('<td/>',{class:"tdBlack"}).html(headNames[k]);r.append(c);
			if (k>1) c.prop("colSpan",2);
			if (headNames[k].search("RSSI")>=0) c.css("paddingLeft","10px");
		}
		for (k=0;k<(na==0?2*config.CHNR:factory.numADJFilters);k++){
			var sh = k<num;
			r = $('<tr/>').css("display",sh?"table-row":"none");y.append(r);
			//Num Filter
			c = $('<td/>').html(k+1).css({"textAlign":"center","padding":"2px"});r.append(c);
			//CCH
			r.append(this.createCCHEnable(band,na,k,false));
			//Uplink freq
			if (na==0){
				r.append(this.createFiltFrequency(0,band,k,sh,false));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
			}else{
				r.append(this.createAdjFiltFrequency(0,band,k,0,sh,false));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
				r.append(this.createAdjFiltFrequency(0,band,k,1,sh,false));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
			}
			//RSSI
			c = $(createMetCell("level_"+na+"_"+band+"_0_"+k,chRfIn_settings[0]));c.css({"paddingLeft":"10px"});r.append(c);
			c = $(createTextCell("level_"+na+"_"+band+"_0_"+k,chRfIn_settings[0]));c.css({"paddingLeft":"10px","paddingRight":"10px"});r.append(c);
			//c = $('<td/>',{id:"level_"+na+"_"+band+"_0_"+k}).html('---').css({"textAlign":"center","paddingLeft":"10px"});
			//c = $('<td/>').html("dBm").css({"textAlign":"left","paddingRight":"10px"});r.append(c);
			//Downlink freq
			if (na==0){
				r.append(this.createFiltFrequency(1,band,k,sh,false));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
			}else{
				r.append(this.createAdjFiltFrequency(1,band,k,0,sh,false));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
				r.append(this.createAdjFiltFrequency(1,band,k,1,sh,false));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
			}
			//RSSI
			c = $(createMetCell("level_"+na+"_"+band+"_1_"+k,chRfIn_settings[1]));c.css({"paddingLeft":"10px"});r.append(c);
			c = $(createTextCell("level_"+na+"_"+band+"_1_"+k,chRfIn_settings[1]));c.css({"paddingLeft":"10px","paddingRight":"10px"});r.append(c);
			//c = $('<td/>',{id:"level_"+na+"_"+band+"_1_"+k}).html('---').css({"textAlign":"center","paddingLeft":"10px"});r.append(c);
			//c = $('<td/>').html("dBm").css({"textAlign":"left","paddingRight":"10px"});r.append(c);
		}
		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		r = $('<tr/>');y.append(r);
		c = $('<td/>');r.append(c);
		c = $('<td/>');r.append(c);
		c = $('<td/>',{class:"tdBlack"}).html('Uplink AGC Broadband').css("text-align","center");c.prop("colSpan",na==1?4:2);r.append(c);
		c = $(createMetCell("bbAgc_"+band+"_0", bbAgcSettings));c.css({"paddingLeft":"10px"});r.append(c);
		c = $(createTextCell("bbAgc_"+band+"_0", bbAgcSettings));c.css({"paddingLeft":"10px","paddingRight":"10px"});r.append(c);
		c = $('<td/>',{class:"tdBlack"}).html('Downlink AGC Broadband').css("text-align","center");c.prop("colSpan",na==1?4:2);r.append(c);
		c = $(createMetCell("bbAgc_"+band+"_1", bbAgcSettings));c.css({"paddingLeft":"10px"});r.append(c);
		c = $(createTextCell("bbAgc_"+band+"_1", bbAgcSettings));c.css({"paddingLeft":"10px","paddingRight":"10px"});r.append(c);
		return t;
	}
	this.createFilterTables = function(band,na,num,disableFreqs) {
		var t,y,r,c,str,k,j;
		t = $('<table/>',{class:"bt"}).css("padding","1px");
		y = $('<tbody/>',{id:"TableFilter_"+band+"_"+na});t.append(y);
		r = $('<tr/>');y.append(r);
		//header
		if (na==1){
			$('<td/>').appendTo(r);
			$('<td/>').appendTo(r);
			c = $('<td/>',{class:"tdBlack"}).html('DOWNLINK FREQUENCY');r.append(c);
			c.prop("colSpan",4);
			r = $('<tr/>');y.append(r);
			var headNames = ['Nr','CCH','START FREQ','STOP FREQ'];
		}else{
			var headNames = ['Nr','CCH','DOWNLINK FREQUENCY'];
		}
		
		for (k=0;k<headNames.length;k++){
			c = $('<td/>',{class:"tdBlack"}).html(headNames[k]);r.append(c);
			if (k>1) c.prop("colSpan",2);
		}
		for (k=0;k<(na==0?2*config.CHNR:factory.numADJFilters);k++){
			var sh = k<num;
			r = $('<tr/>').css("display",sh?"table-row":"none");y.append(r);
			//Num Filter
			c = $('<td/>').html(k+1).css({"textAlign":"center","padding":"2px"});r.append(c);
			//CCH
			r.append(this.createCCHEnable(band,na,k,true));
			//Downlink freq
			if (na==0){
				r.append(this.createFiltFrequency(1,band,k,sh,disableFreqs));
				c = $('<td/>').html("MHz").css("textAlign","left");r.append(c);
			}else{
				r.append(this.createAdjFiltFrequency(1,band,k,0,sh,disableFreqs));
				c = $('<td/>').html("MHz").css({"textAlign":"left","paddingRight":"10px"});r.append(c);
				r.append(this.createAdjFiltFrequency(1,band,k,1,sh,disableFreqs));
				c = $('<td/>').html("MHz").css({"textAlign":"left","paddingRight":"10px"});r.append(c);
			}


		}
		return t;
	}
	this.createCCHEnable = function(band,na,c,en) {
		var d = $('<td/>').css({"paddingLeft":"20px","paddingRight":"20px"});
		var idc = "cchEn_"+na+"_"+band+"_"+c;
		var isFn = false;
		if (band==0 && c==0 && na==1 && config.firstADJisFirstNet){
			isFn = true;
			idc = "cchEn_Fn";
		}
		var e = $('<input/>',{id:idc,type:"checkbox"}).prop("disabled",!en).appendTo(d);
		if (na==0){
			if (c==(config.controlChannel[band]-1))
				e.prop("checked",true); //controlchannel es el nº de filtro para clase A
		}else{
			if (c==(-config.controlChannel[band]-1))
				e.prop("checked",true); //controlchannel es el nº de filtro para clase B con signo negativo
		}
		e.prop({"name":e.prop("id"),"band":band,"ch":c,"na":na})
		if (isFn){
			e.prop({"checked":true,"disabled":true});
		}
		e.change(function(ev) {
			var b = $(this).prop("band");
			var c = $(this).prop("ch");
			var na = $(this).prop("na");
			for(var k=0;k<64;k++){
				try{
					if (k!=c) $('#cchEn_'+na+'_'+b+'_'+k).prop('checked',false);
				} catch (err) {}
			}
			//los filtros de la otra clase todos no chequeados
			for(var k=0;k<64;k++){
				try{
					$('#cchEn_'+(1-na)+'_'+b+'_'+k).prop('checked',false);
				} catch (err) {}
			}
		});
		return d;
	}
	this.createAdjFiltFrequency = function(b, band, c, ss, on, en) {
		var e = $('<td/>');
		var f = $('<input/>',{id:"chAdjFreq_"+c+"_"+b+"_"+band+"_"+ss,class:"number",type:"text"}).prop({"disabled":!en,"size":"10"});e.append(f);
		var freq = ss==0?config.fstartHzAdjFilter[band][b][c]:config.fstopHzAdjFilter[band][b][c];
		if (on)
			f.val((freq/1e6).toFixed(3));
		else
			f.val('');
		f.prop({"ch":c,"dn":b,"band":band,"ss":ss});
		f.prop({"name":f.prop("id"),"title":"Min: "+(factory.fstart[2*band+b]/1e6)+", Max: "+(factory.fstop[2*band+b]/1e6)+" MHz"});
		f.keypress(function(ev) {
			return isKeyDecimalNumber(ev);
		});
		f.change(function(ev) {
			var dn = $(this).prop("dn");
			var c = $(this).prop("ch");
			var b = $(this).prop("band");
			var ss = $(this).prop("ss");
			var fr = ~~Math.round($(this).val()*1e6);
			if (fr < factory.fstart[2*b+dn]) fr = factory.fstart[2*b+dn];
			if (fr > factory.fstop[2*b+dn]) fr = factory.fstop[2*b+dn];
			if (ss==0){
				var foth = ~~Math.round($("#chAdjFreq_"+c+"_"+dn+"_"+b+"_1").val()*1e6);
				if (fr > (foth-1e5)) fr = (foth-1e5);
			}else{
				var foth = ~~Math.round($("#chAdjFreq_"+c+"_"+dn+"_"+b+"_0").val()*1e6);
				if (fr < (foth+1e5)) fr = (foth+1e5);
			}
			fr = ~~Math.round(fr/factory.fstepAdj);
			fr *= factory.fstepAdj;
			$(this).val((fr/1e6).toFixed(3));
		});
		return e;
	}
	this.createFiltFrequency = function(b, band, c, on, en) {
		var e = $('<td/>');
		var f = $('<input/>',{id:"chFreq_"+c+"_"+b+"_"+band,class:"number",type:"text"}).prop({"disabled":!en,"size":"10"});e.append(f);
		if (on)
			f.val((config.freqHz[band][b][c]/1e6).toFixed(6));
		else
			f.val('');
		f.prop({"ch":c,"dn":b,"band":band});
		f.prop({"name":f.prop("id"),"title":"Min: "+(factory.fstart[2*band+b]/1e6)+", Max: "+(factory.fstop[2*band+b]/1e6)+" MHz"});
		f.keypress(function(ev) {
			return isKeyDecimalNumber(ev);
		});
		f.change(function(ev) {
			var dn = $(this).prop("dn");
			var c = $(this).prop("ch");
			var b = $(this).prop("band");
			var fr = ~~Math.round($(this).val()*1e6);
			if (fr < factory.fstart[2*b+dn]) fr = factory.fstart[2*b+dn];
			if (fr > factory.fstop[2*b+dn]) fr = factory.fstop[2*b+dn];
			fr = ~~Math.round(fr/factory.fstep);
			fr *= factory.fstep;
			$(this).val((fr/1e6).toFixed(6));
		});
		return e;
	}
	this.clearFreqs = function(band,na){
		for (var c=0;c<(na==0?2*config.CHNR:factory.numADJFilters);c++){
			$('#cchEn_'+na+'_'+band+'_'+c).prop('checked',false);
			for (var i=0;i<2;i++){
				if (na==0){
					$("#chFreq_"+c+"_"+i+"_"+band).val('');
				}else{
					$("#chAdjFreq_"+c+"_"+i+"_"+band+"_0").val('');
					$("#chAdjFreq_"+c+"_"+i+"_"+band+"_1").val('');
				}
			}
		}
	}
	this.refreshFreqs = function(band,na){
		for (var c=0;c<(na==0?2*config.CHNR:factory.numADJFilters);c++){
			if (na==0){
				if (c==(config.controlChannel[band]-1))$('#cchEn_'+na+'_'+band+'_'+c).prop('checked',true);
			}else{
				if (c==(-config.controlChannel[band]-1))$('#cchEn_'+na+'_'+band+'_'+c).prop('checked',true);
			}
			for (var i=0;i<2;i++){
				if (na==0){
					$("#chFreq_"+c+"_"+i+"_"+band).val((config.freqHz[band][i][c]/1e6).toFixed(6));
				}else{
					$("#chAdjFreq_"+c+"_"+i+"_"+band+"_0").val((config.fstartHzAdjFilter[band][i][c]/1e6).toFixed(3));
					$("#chAdjFreq_"+c+"_"+i+"_"+band+"_1").val((config.fstopHzAdjFilter[band][i][c]/1e6).toFixed(3));
				}
			}
		}
	}
	this.refreshSquelch = function(band,na){
		for (var i=0;i<2;i++){
			var min = config.sqThrLimits(false, i).MIN;
			var max = config.sqThrLimits(false, i).MAX;
			var e = $('#'+(i==0?'u':'d')+'lsquelchset');
			e.val(config.sqChThreshold[na][band][i][0]).prop("title","Min: "+min+", Max: "+max+" dBm");
			e.prop({'min':min,'max':max});
			e.change(function(ev) {
				var min = ~~$(this).prop("min");
				var max = ~~$(this).prop("max");
				var val = ~~$(this).val();
				if (val<min) val=min;
				if (val>max) val=max;
				$(this).val(~~Math.round(val));
			});
		}
	}
	this.refreshPower = function(band){
		for (var i=1;i<2;i++){ //solo DL
			var r= $('#'+(i==0?'u':'d')+'lpoweropt');
			r.html('');
			$('<td/>',{class:"tdBlack"}).html((i==0?'UP':'DOWN')+'LINK:').appendTo(r);
			var dist=1000;
			var pconf;
			for (var k=0;k<5;k++){
				var c = $('<td/>').appendTo(r);
				var pow = factory.powerlimit[2*band+i]-3*k;
				c.append($('<input/>',{id:(i==0?'u':'d')+'lpower',name:(i==0?'u':'d')+'lpower',type:"radio"}).val(pow));
				c.append($('<span/>').html(pow+'dBm'));
				if (Math.abs(pow-config.power[band][i])<dist){
					dist = Math.abs(pow-config.power[band][i]);
					pconf = pow;
				}
			}		
			$("input[name='"+(i==0?'u':'d')+"lpower'][value=" + pconf + "]").prop('checked', true);
			
		}
	}	
	this.readConf = function(cnf,band,na){
		var optpower = $("input[name='dlpower']:checked").val();

		cnf.forcePaOn[band] = [true,true]; //PA ON
		cnf.paEnabled[band] = [true,true]; //PA ON
		cnf.power[band][1] = ~~optpower; //potencia DL configurada por usuario
		cnf.gain[band][1] = factory.gainlimit[2*band+1]; //se fuerza gain max DL
		
		if (na==0){
			for (var k=0;k<2*config.CHNR;k++){
				cnf.sqChThreshold[0][band][1][k] = ~~$('#dlsquelchset').val(); //SQ DL configurado por usuario
			}
		}else{
			for (var k=0;k<factory.numADJFilters;k++){
				cnf.sqChThreshold[1][band][1][k] = ~~$('#dlsquelchset').val();
			}
		}
	}
	this.readConfAlarm = function(cnf){
		cnf.oscTimeThSeconds[0] = pageAdv.getAbnSqTime();
		cnf.autoUlPaOffTimer = pageAdv.getAutoPaUlOffTime();	
		cnf.oscActionAfterAlarm[0] = pageAdv.opfModeGet();
		cnf.oscRetryTimeHours[0] = pageAdv.getRetryTime();
		cnf.extremeTempAction = pageAdv.readExtremeTemperatureAction();
	}
	this.checkFirstNetAndFilters = function(){
		var nb=false;
		for (var c=0;c<2*config.CHNR;c++){
			if (config.filterEnabled[0][0][1][c]){
				nb=true;
				continue;
			}
		}
		if (nb && config.filterEnabled[1][0][1][0]) return true;
		return false;
	}
	this.readControlChannel = function(cnf,band){
		var cch=0;
		cnf.uldlLinkedFreq[band]			= true;
		cnf.muteModeLinked[band]			= false;
		cnf.simplexMode[band]				= false;
		cnf.allSameSquelch[band]			= true;
		cnf.allChSameBW[band]				= [true,true];
		//cnf.paEnabled[band]					= [true,true]; //En commissioning no se encienden PAs
		//cnf.forcePaOn[band]					= [true,true]; //En commissioning no se encienden PAs
		for (var na=0;na<(na==0?2*cnf.CHNR:cnf.ADJNR);na++){
			for (var c=0;c<(na==0?2*config.CHNR:factory.numADJFilters);c++){
				try{
					if (cnf.filterEnabled[na][band][1][c]){
						if ($('#cchEn_'+na+'_'+band+'_'+c).prop('checked'))
							cch = na==0?c+1:-c-1;
					}
				}catch (err){}
			}
		}
		cnf.controlChannel[band] = cch;	
	}
	this.readFreqs = function(cnf,band,na,forceFn) {
		pageAdv.init(factory,config);
		//defaults values para basic user
		var lic = [factory.chBandEnabled[0]||factory.adjBandEnabled[0],factory.chBandEnabled[1]||factory.adjBandEnabled[1]];
		cnf.uldlLinkedFreq[band]			= true;
		cnf.muteModeLinked[band]			= false;
		cnf.simplexMode[band]				= false;
		cnf.allSameSquelch[band]			= true;
		cnf.allChSameBW[band]				= [true,true];
		//se apaga lo que no tenga licencia
		for (var b=0;b<2;b++){
			cnf.agcBandMode[b][0] = false; //stable coverage
			cnf.agcBandMode[b][1] = false; //stable coverage
			cnf.squelchAdjBwMode[b] = false; //sq mode adj = normal
			for (var nbadj=0;nbadj<2;nbadj++){
				if (!lic[b]){
					cnf.paEnabled[b] = [false,false];
					cnf.forcePaOff[b] = [true,true];
				}
				for (var i=0;i<2;i++){
					for (var c=0;c<(nbadj==0?2*cnf.CHNR:cnf.ADJNR);c++){
						if (!lic[b]) cnf.filterEnabled[nbadj][b][i][c] = false;
					}
				}
			}
		}
		var bw = computeIndexFromBW($('#idbw').val());
		if ( typeof(forceFn) === 'undefined'){
			if (na==1 && band==0) cnf.firstADJisFirstNet = false; //si se configura classB700 se desactiva Band14
			for (var nbadj=0;nbadj<2;nbadj++){
				for (var i=0;i<2;i++){
					for (var c=0;c<(nbadj==0?2*cnf.CHNR:cnf.ADJNR);c++){
						cnf.sqChEnabled[nbadj][band][i][c] = true;
						cnf.fineGainFilter[nbadj][band][i][c] = 0;
						if (!(band==0 && cnf.firstADJisFirstNet && nbadj==1 && c==0)) //sólo se conserva ADJBW1 si Band14 estuviese activado
							cnf.filterEnabled[nbadj][band][i][c] = false;
						if (nbadj==0){
							cnf.bwIndex[band][i][c] = bw;
						}
					}
				}
			}
			var cch = 0;
			if (na==0){
				for (var c=0;c<2*cnf.CHNR;c++){
					var el = $("#chFreq_"+c+"_1_"+band);
					if (el.val().length>0){
						if ($('#cchEn_'+na+'_'+band+'_'+c).prop('checked')) cch=c+1;
						cnf.freqHz[band][1][c] = el.val()*1e6;
						cnf.freqHz[band][0][c] = cnf.freqHz[band][1][c]-factory.fstart[2*band+1]+factory.fstart[2*band];
						for (var i=0;i<2;i++)
							cnf.filterEnabled[0][band][i][c] = true;
					}else{
						for (var i=0;i<2;i++){
							//cnf.freqHz[band][i][c] = (factory.fstart[2*band+i]+factory.fstop[2*band+i])/2;
							cnf.filterEnabled[0][band][i][c] = false;
						}
					}
				}
				
				for (var b=0;b<2;b++){
					cnf.numberOfFilterNonGrouped[band][b] = pageAdv.computeFilterCombineReduction(cnf, b, band);
					for (var c=0;c<2*cnf.CHNR;c++){
						cnf.isFilterGrouped[band][b][c] = pageAdv.filterBelongsToCombination(cnf, b, c, band);
					}
				}
					
			}else{
				for (var c=0;c<factory.numADJFilters;c++){
					var el1 = $("#chAdjFreq_"+c+"_1_"+band+"_0");
					var el2 = $("#chAdjFreq_"+c+"_1_"+band+"_1");
					if (el1.val().length>0 && el2.val().length>0){
						if ($('#cchEn_'+na+'_'+band+'_'+c).prop('checked')) cch=-c-1;
						cnf.fstartHzAdjFilter[band][1][c] = el1.val()*1e6;
						cnf.fstopHzAdjFilter[band][1][c] = el2.val()*1e6;
						cnf.fstartHzAdjFilter[band][0][c] = cnf.fstartHzAdjFilter[band][1][c]-factory.fstart[2*band+1]+factory.fstart[2*band];
						cnf.fstopHzAdjFilter[band][0][c] = cnf.fstopHzAdjFilter[band][1][c]-factory.fstart[2*band+1]+factory.fstart[2*band];
						if (band==0 && c==0 && cnf.fstartHzAdjFilter[0][1][0]==758000000 && cnf.fstopHzAdjFilter[0][1][0]==768000000) cnf.firstADJisFirstNet = true;
						for (var i=0;i<2;i++)
							cnf.filterEnabled[na][band][i][c] = true;
					}else{
						for (var i=0;i<2;i++){
							cnf.freqHz[band][i][c] = (factory.fstart[2*band+i]+factory.fstop[2*band+i])/2;
							cnf.filterEnabled[na][band][i][c] = false;
						}
					}
				}
			}
			cnf.controlChannel[band] = cch;
		}else{
			
			cnf.firstADJisFirstNet = forceFn;
			for (var i=0;i<2;i++){
				cnf.filterEnabled[1][0][i][0] = forceFn;
			}
			if (forceFn){
				cnf.fstartHzAdjFilter[0][0][0] = 788000000;
				cnf.fstopHzAdjFilter[0][0][0] = 798000000;
				cnf.fstartHzAdjFilter[0][1][0] = 758000000;
				cnf.fstopHzAdjFilter[0][1][0] = 768000000;
				for (var i=0;i<2;i++)
					cnf.fineGainFilter[1][0][i][0] = 0;
			}
		}
		//control overlap
		var fov = [];
		var ovlp = [];
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < 2*config.CHNR; ++c) {
				ovlp[b].push([]);
			}
		}
		for (var k=0;k<6;k++){ //se hace así para pasar como parámetro a setWarningMessage un array de 6 elementos
			fov.push({'check': false, 'ovlp': ovlp});
		}
		var maxChannels = cnf.CHNR;
		var filtSepKhz = pageAdv.FILTSEP90K;
		var filtAdjSepKhz = pageAdv.FILTSEPADJKHZ;
		var filtNbAdjSepKhz = pageAdv.FILTSEPNBADJKHZ;
		if (factory.singleBandEnabled[band]) maxChannels*=2;
		
		if (na==0){
			fov[band] = pageAdv.computeFiltersOverlap(cnf, band);
			if (band==0 && cnf.firstADJisFirstNet) fov[4] = pageAdv.computeNBAdjFiltersOverlap(cnf, 0);
		}else{
			fov[band+2] = pageAdv.computeAdjFiltersOverlap(cnf, band);
			if (forceFn){
				fov[band+4] = pageAdv.computeNBAdjFiltersOverlap(cnf, band);
			}
		}
		if (fov[0]['check'] || fov[1]['check'] || fov[2]['check'] || fov[3]['check'] || fov[4]['check'] || fov[5]['check']) {
			var warn = pageAdv.warningBox.setWarningMessage(fov, filtSepKhz, filtAdjSepKhz, filtNbAdjSepKhz, maxChannels, factory, [true,true], false);
			warn = warn.replace("ADJ.BW Filter 1","Band14 Filter");
			warn = warn.replace("ADJ.BW filter","ADJ.BW filter (or Band 14 Filter)");
			warn = warn.replace("SETTING ADJ.BW","SETTING ADJ.BW (OR BAND 14 FILTER)");
			warn = warn.replace("AND ADJ.BW FILTERS","AND ADJ.BW FILTERS (OR BAND 14 FILTER)");
			if (typeof(forceFn)!=="undefined" && forceFn) warn+='<br><br><a href="javascript:buildGUI(2);" style="color:#0563c1">GO TO 700MHZ BAND SECTION TO ADJUST FILTER FREQUENCIES</a>';
			if (band==0 && fov[4]['check'] && typeof(forceFn)==="undefined") warn+='<br><br><a href="javascript:buildGUI(4);" style="color:#0563c1">GO TO BAND 14 SECTION TO DISABLE BAND 14 FILTER</a>';
			if ((fov[0]['check'] || fov[1]['check']) && typeof(forceFn)==="undefined")
				warn+='<br><br><a href="std.html" style="color:#0563c1">GO TO STANDARD GUI (FILTER TOOL SECTION) TO PROGRAM FREQUENCY FILTERS WITHOUT OVERLAPS</a>';
			warn += "<br><br>";
			return warn; 
		}
		return "";
		
	}
	function computeIndexFromBW(bwkhz){
		var ind;
		if (bwkhz>=125.0) ind=0;
		else if (bwkhz>=87.5) ind=1;
		else if (bwkhz>=68.75) ind=2;
		else if (bwkhz>=56.25) ind=3;	
		else if (bwkhz>=43.75) ind=4;
		else if (bwkhz>=31.25) ind=5;
		else if (bwkhz>=18.75) ind=6;
		else ind=7;
		return ind;
	}
	this.createRelayConfigTable = function(){
		var y,r,c,k;
		pageAdv.init(factory,config);
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"}).prop("colSpan",5);r.append(c);
		c.append(this.relayTable(1));
		/*
		c = $('<td/>').css("width","5px").prop("rowSpan",3);r.append(c);
		c = $('<td/>',{class:"contentcell"}).prop("rowSpan",3);r.append(c);
		c.append($(pageAdv.createOpfSettingsOscDet()));
		c = $('<td/>').css("width","5px").prop("rowSpan",3);r.append(c);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append($(pageAdv.createAutoPaUlOffContent()));
		r = $('<tr/>').css("height","7px");y.append(r);
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append($(pageAdv.createExtremeTempActionContent()));*/
		return y;
	}
	this.createExtremeTempTable = function(){
		var y,r,c,k;
		pageAdv.init(factory,config);
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append($(pageAdv.createExtremeTempActionContent()));
		return y;
	}
	this.createAutoUlPaOffTable = function(){
		var y,r,c,k;
		pageAdv.init(factory,config);
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append($(pageAdv.createAutoPaUlOffContent()));
		return y;
	}
	this.createOscDetectionTable = function(){
		var y,r,c,k;
		pageAdv.init(factory,config);
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append($(pageAdv.createOpfSettingsOscDet()));
		return y;
	}
	this.createIsolTable = function(){
		var y,r,c,k;
		pageAdv.init(factory,config);
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append($(pageAdv.createOpfSettingsAntIsol()));
		return y;
	}
	this.redrawAlarmConfig = function(){ //functión para customizar el estilo de los cuadros heredados de render.js
		var e;
		e = $('#isolVerif');e.css("display","none");
		//e.prop('onclick',null); //se cambia la función de click
		//e.click(function(ev) {save_config(true,false)});
		e = $('#isolClearAlarm');e.prop("class","btnazul");
		e.prop('onclick',null); //se cambia la función de click
		e.click(function(ev) {save_config(false,true)});
		$('#anteisolth').prop("class","tdBlack").css("paddingTop","10px");
		$('#oscdetth').prop("class","tdBlack").css("paddingTop","10px");
		$('#autoulth').prop("class","tdBlack").css("paddingTop","10px");
		$('#extremeth').prop("class","tdBlack").css("paddingTop","10px");
		$('#opfMode').css("width","100%");
		$('#extremeTempAction').css("width","100%");
		$('#txt_isol').css("width","120px");
	}
	this.createAlarmStatusTable = function() {
		var t,y,r,c,str,k,j;
		y = $('<tbody/>');
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append(this.relayTable(0)).prop("colSpan",3);
		r = $('<tr/>').css("height","7px");y.append(r);
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell","width":"75%"});r.append(c);
		c.append(this.agcTable);
		c = $('<td/>').css("width","5px");r.append(c);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append(this.tempTable);
		r = $('<tr/>').css("height","7px");y.append(r);
		r = $('<tr/>');y.append(r);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append(this.paTable);
		c = $('<td/>').css("width","5px");r.append(c);
		c = $('<td/>',{class:"contentcell"});r.append(c);
		c.append(this.alLog);
		return y;
	}
	this.alLog = function(){
		var t,r,c,e;
		t = $('<table/>',{class:"contenttable"});
		r = $('<tr/>');t.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('ALARM LOG');r.append(c);
		r = $('<tr/>');t.append(r);
		c = $('<td/>');r.append(c);
		r = $('<tr/>');t.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('Download Alarm Log in<br>CSV file format');r.append(c);
		r = $('<tr/>');t.append(r);
		c = $('<td/>');r.append(c);
		e = $('<input/>',{id:'alLogToCSV',class:'btnazul',type:'button'}).val('Alarm Log');c.append(e);
		e.click(function(ev) {
			showResultIcon(ERR_PENDING,indexHome);
			eventLog = new EventLog();
			eventLog.reqLogData();
			setTimeout(function() { pageAst.downloadCSVFile(); }, 1000);
		});
		r = $('<tr/>');t.append(r);
		c = $('<td/>').html('<img src="/i/blank.gif" alt="" width="45" height="45" id="cmdResult3">');r.append(c);
		return t;
	}
	this.downloadCSVFile = function(){
		if (eventLog.loaded){
			eventLog.gui.saveButton.onclick();
			showResultIcon(ERR_OK,indexHome);
			setTimeout(function() { showResultIcon(ERR_NONE,indexHome); }, 2000);
		}else{
			setTimeout(function() { pageAst.downloadCSVFile(); }, 1000);
		}
	}
	this.paTable = function(){
		var t,r,c,k,i;
		t = $('<table/>',{class:"contenttable"});
		r = $('<tr/>');t.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('PA STATUS').prop("colSpan",3);r.append(c);
		//header
		r = $('<tr/>');t.append(r);
		headNames = ['Band','Status','Comment'];
		for (k=0;k<headNames.length;k++){
			c = $('<td/>',{class:"tdBlack"}).html(headNames[k]);r.append(c);
			if (k==headNames.length-1) c.css("textAlign","left");
		}
		//band rows
		for (i=0;i<2;i++){
			for (k=0;k<2;k++){
				if (factory.chBandEnabled[k] || factory.adjBandEnabled[k]){
					r = $('<tr/>').css("height","20px");t.append(r);
					c = $('<td/>',{class:"tdBlack"}).css({"width":"60px"}).html(factory.bandNames[k]+(i==0?' UL':' DL'));r.append(c);
					c = $('<td/>',{id:'paStat_'+k+'_'+i}).css({"width":"140px"}); r.append(c);
					c = $('<td/>',{id:'paStatCom_'+k+'_'+i}).css({"textAlign":"left","paddingLeft":"20px"});r.append(c);
				}
			}
		}

		return t;		
	}
	this.tempTable = function(){
		var t,r,c,k;
		t = $('<table/>',{class:"contenttable"});
		r = $('<tr/>');t.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('TEMPERATURE').prop("colSpan",4);r.append(c);
		r = $('<tr/>').css("height","50px");t.append(r);
		c = $(createTempBar());c.css("width","80px");r.append(c);
		c = $(createTextCell('temp'));c.css({"marginRight":"10px","width":"50px"});r.append(c);
		return t;
	}
	this.agcTable = function(){
		var t,r,c,k;
		t = $('<table/>',{id:"agctab",class:"contenttable"});
		r = $('<tr/>');t.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('INPUT DOWNLINK AGC STATUS').prop("colSpan",4);r.append(c);
		//header
		r = $('<tr/>');t.append(r);
		headNames = ['Band','Broadband AGC Value','Comment'];
		for (k=0;k<headNames.length;k++){
			c = $('<td/>',{class:"tdBlack"}).html(headNames[k]).prop("colSpan",k==1?2:1);r.append(c);
			if (k==headNames.length-1) c.css("textAlign","left");
		}
		//band rows
		for (k=0;k<2;k++){
			if (factory.chBandEnabled[k] || factory.adjBandEnabled[k]){
			r = $('<tr/>');t.append(r);
			c = $('<td/>',{class:"tdBlack"}).css({"width":"60px"}).html(factory.bandNames[k]);r.append(c);
			c = $(createAGCBar(k)); c.css({"width":"80px"}); r.append(c);
			c = $(createTextCell('agc_'+k)); c.css({"width":"50px"}); r.append(c);
			c = $('<td/>',{id:'agcComm_'+k}).css({"textAlign":"left","paddingLeft":"20px"});r.append(c);
			}
		}
		return t;
	}
	this.tempSet = function(val) {
		setMetValue("temp", val,"undefined",1,"&ordm;C");
	}
	this.bbAgcSet = function(band,dn,val){
		var col;
		if (val>=10)
			col = "#e20000";
		else if (val>=5)
			col = "#f2b200";
		else
			col = "#00a500";
		if (dn==0) col = "#00a500";
		setMetValue("bbAgc_"+band+"_"+dn, val,col,0,"dB");
	}
	this.agcSet = function(band, val) {
		var col;
		if (val>=10){
			col = "#e20000";
			$('#agcComm_'+band).html('Excessive gain reduction. External filtering is strongly recommended');
		}
		else if (val>=5){
			col = "#f2b200";
			$('#agcComm_'+band).html('Main gain slightly reduced. Consider external filtering and/or attenuation');
		}
		else{
			col = "#00a500";
			$('#agcComm_'+band).html('RF Performance is good');
		}
			
		setMetValue("agc_"+band, val,col,0,"dB");
	}
	this.relayTable = function(mode){ //mode=0 stat, mode=1 config
		var t,r,c,k;
		t = $('<table/>',{class:"contenttable"});
		r = $('<tr/>');t.append(r);
		c = $('<td/>',{class:"tdBlack"}).html('RELAY STATUS').prop("colSpan",5);r.append(c);
		//header
		r = $('<tr/>');t.append(r);
		headNames = ['#','Status','Alarm Condition Assignment'];
		
		for (k=0;k<headNames.length;k++){
			if (k!=1 || mode==0){ //en mode = 1, no se representa nada en columna 2
				c = $('<td/>',{class:"tdBlack"}).html(headNames[k]).prop("colSpan",k==1?3:1);r.append(c);
				if (k==headNames.length-1) c.css({"textAlign":"left","paddingLeft":"20px"});
			}
		}
		//relay rows
		for (k=0;k<getNrOfRelaysSupported(config,factory,version);k++){
			r = $('<tr/>');t.append(r);
			c = $('<td/>',{class:"tdBlack"}).html('RELAY'+(k+1));r.append(c);
			if (mode==0){
				c = $('<td/>',{id:'relStat_'+k}).css({"width":"70px"});r.append(c);
				c = $('<td/>',{id:'relStatImg_'+k}).css({"width":"38px","height":"25px"});r.append(c);
				c = $('<td/>',{id:'relStatOC_'+k}).css({"width":"70px"});r.append(c);
			}

			c = $('<td/>',{id:'alDescrip'+k}).css({"textAlign":"left","paddingLeft":"20px"});r.append(c);
		}
		if (mode!=0){
			r = $('<tr/>').css("height","20px");t.append(r);
			if (!isBbuSerialMode(config,factory,version)) {
				r = $('<tr/>');t.append(r);
				c = $('<td/>');r.append(c);
				c = $('<td/>',{class:"tdBlack"}).css("text-align","left").html('<a href="javascript:void(0);" style="color:#0563c1">Note 1: This alarm setup aligns with the Fiplex BBU configuration. Changes are not required if using a Fiplex BBU.</a>');r.append(c);
			} else {
				document.getElementById("step-1a").style.height="auto";
				document.getElementById("step-1a").style.minHeight="450px";
			}
			r = $('<tr/>');t.append(r);
			c = $('<td/>');r.append(c);
			if (isBbuSerialMode(config,factory,version)) {
				c = $('<td/>',{class:"tdBlack"}).css("text-align","left").html('<a href="std.html" style="color:#0563c1">Note 1: To modify these relay settings go to the "ALARM CONFIG" section selecting the Standard GUI option that<br>appears when connecting to the device</a>');r.append(c);
			} else {
				c = $('<td/>',{class:"tdBlack"}).css("text-align","left").html('<a href="std.html" style="color:#0563c1">Note 2: To modify these relay settings go to the "ALARM CONFIG" section selecting the Standard GUI option that<br>appears when connecting to the device</a>');r.append(c);
			}
		}
		return t;
	}
	this.showAlarmAssign = function(){
		for (var k=0;k<getNrOfRelaysSupported(config,factory,version);k++){
			var mess = "";
			for (var i=0;i<NFPAcfg.alarmNames[0].length;i++){
				if (NFPAcfg.alarmNames[0][i].length>0 && NFPAcfg.relayAssignGlobalAlarm[i][k] && NFPAcfg.globalAlarmsEnabled[i])
					mess+=NFPAcfg.alarmNames[0][i]+", ";
			}
			for (var i=0;i<NFPAcfg.alarmNames[1].length;i++){
				if (NFPAcfg.alarmNames[1][i].length>0 && NFPAcfg.relayAssignBandAlarm[i][k] && NFPAcfg.bandAlarmsEnabled[i])
					mess+=NFPAcfg.alarmNames[1][i]+", ";
			}
			if (isBbuSerialMode(config,factory,version)) {
				for (var i=0;i<NFPAcfg.alarmNames[2].length;i++){
					if (NFPAcfg.alarmNames[2][i].length>0 && NFPAcfg.relayAssignBbuAlarm[i][k] && NFPAcfg.bbuAlarmsEnabled[i])
						mess+=NFPAcfg.alarmNames[2][i]+", ";
				}
			}
			if (mess.length>2) mess = mess.substring(0,mess.length-2);
			$('#alDescrip'+k).html(mess);
		}
	}
	this.showAlarmConfig = function(){
		pageAdv.setAbnSqTime(config.oscTimeThSeconds[0]);
		pageAdv.setAutoPaUlOffTime(config.autoUlPaOffTimer);	
		pageAdv.opfModeSet(config.oscActionAfterAlarm[0]);
		pageAdv.setRetryTime(config.oscRetryTimeHours[0]);
		pageAdv.showExtremeTempAction(config.extremeTempAction);
	}
	this.relayStateSet = function(nrelay,openclose,onoff){
		var isNormalACPowerRelay = isBbuSerialMode(config,factory,version) && NFPAcfg.isRelayAssignNormalACpowerExclusive(nrelay);
		if (!isNormalACPowerRelay) {
			$("#relStat_"+nrelay).html(onoff?"Alarm ON":"Alarm OFF");
			$("#relStatImg_"+nrelay).html("<img src=/i/"+(openclose?"open":"closed")+".png>").css("backgroundColor",onoff?"#df4040":"white");
		} else {
			$("#relStat_"+nrelay).html("");
			$("#relStatImg_"+nrelay).html("<img src=/i/"+(openclose?"open":"closed")+".png>").css("backgroundColor","white");
		}
		$("#relStatOC_"+nrelay).html(openclose?"Open":"Closed");
	}
	this.paStateSet = function(band,dn,val){
		$("#paStat_"+band+"_"+dn).html("<img src=/i/"+(val?"paon":"paoff")+".png>");
		if (val){
			$("#paStatCom_"+band+"_"+dn).html('Normal operation');
		}else{
			if (factory.extremeTempActionEnable && config.extremeTempAction==2 && monitor.extremeTempActionOn)
				$("#paStatCom_"+band+"_"+dn).html('Turned off due to extreme high temperature');
			else if (NFPAcfg.globalAlarmsEnabled[11] && monitor.gralAlarm[11])
				$("#paStatCom_"+band+"_"+dn).html('Externally forced');
			else if (monitor.maxAllowGain[band]<(factory.gainlimit[2*band+dn]+config.GmainRange[dn]))
				$("#paStatCom_"+band+"_"+dn).html('Turned off due to poor isolation');
			else if (!config.paEnabled[band][dn])
				$("#paStatCom_"+band+"_"+dn).html('Turned off by user');
			else if (dn==0 && config.autoUlPaOffTimer>0){
				var mess = 'Turned off because UL signal was not detected during ' + config.autoUlPaOffTimer + ' minute';
				if (config.autoUlPaOffTimer>1) mess+='s';
				$("#paStatCom_"+band+"_"+dn).html(mess);
			}	
			else
				$("#paStatCom_"+band+"_"+dn).html('');
		}
	}
}

function Spectrum() {
	this.npoints;
	this.band;
	this.fstart;
	this.fstop;
	this.io;
	this.chain;
	this.maxhold;
	this.avg;
	this.rbw;
	this.MAXRES = 5;
	this.prevNpoints;
	this.prevFstart;
	this.prevFstop;
	this.prevIo;
	this.prevBand;
	this.prevChain;
	this.prevAvg;
	this.prevRbw;
	this.valsMax = [];
	this.nMaxHolds = 0;
	this.clearMaxHold = function(){
		this.nMaxHolds = 0
		this.valsMax = [];
		for (var k=0;k<801;k++)
			this.valsMax.push(-140);
	}
	
	this.checkSettings = function(){
		
		this.fstart = Math.floor(this.fstart/1e5)*1e5;
		this.fstop = Math.ceil(this.fstop/1e5)*1e5;
		var fm = [factory.fstart[2*this.band+this.chain],factory.fstop[2*this.band+this.chain]];
		fm[0] = Math.floor(fm[0]/1e5)*1e5;
		fm[1] = Math.ceil(fm[1]/1e5)*1e5;
		if (this.fstart<fm[0]) this.fstart = fm[0];
		if (this.fstop>fm[1]) this.fstop = fm[1];
		if (this.fstart!=this.fstop){
			if (this.fstop<(this.fstart+0.2e6)){
				this.fstop=this.fstart+0.2e6;
			}
		}
		if (this.fstop==this.fstart)
			this.npoints = 801;
		else{
			this.npoints = (this.fstop-this.fstart)/(3125*(1<<this.rbw))+1;
			while (this.npoints>801 && this.rbw<(this.MAXRES-1)){
				this.rbw++;
				this.npoints = (this.fstop-this.fstart)/(3125*(1<<this.rbw))+1;
			}
		}
		if (this.avg<1) this.avg = 1;
		if (this.avg>32) this.avg = 32;
		$('#fstart').val((this.fstart/1e6).toFixed(1));
		$('#fstop').val((this.fstop/1e6).toFixed(1));
		$('#inout').prop("selectedIndex",this.io);
		$('#rbw').prop("selectedIndex",this.rbw);
		$('#uldl').prop("selectedIndex",this.chain);
		$('#band').prop("selectedIndex",this.band);
		$('#navg').val(this.avg);
	}
	this.getSettings = function(){
		this.clearMaxHold();
		this.fstart = (~~$('#fstart').val())*1e6;
		this.fstop = (~~$('#fstop').val())*1e6;
		this.avg = ~~$('#navg').val();
		this.band = $('#band').prop("selectedIndex");
		this.chain = $('#uldl').prop("selectedIndex");
		this.io = $('#inout').prop("selectedIndex");
		this.rbw = $('#rbw').prop("selectedIndex");
		var band = this.band;
		var b = this.chain;
		this.checkSettings();
		localStorage.setItem("spect_io_a"+Prjstr+window.location.host, this.io);
		localStorage.setItem("spect_chain"+Prjstr+window.location.host, this.chain);
		localStorage.setItem("spect_band"+Prjstr+window.location.host, this.band);
		localStorage.setItem("spect_fs"+Prjstr+band+b+window.location.host, this.fstart);
		localStorage.setItem("spect_fp"+Prjstr+band+b+window.location.host, this.fstop);
		localStorage.setItem("spect_avg"+Prjstr+window.location.host, this.avg);
		localStorage.setItem("spect_rbw"+Prjstr+window.location.host, this.rbw);		
	}
	this.initSettings = function(keepBandIo){
		this.clearMaxHold();
		//highlight
		var hl = parseInt(localStorage.getItem("hl"+Prjstr+window.location.host));
		if (!isNaN(hl))
			$('#highlight').prop("checked",hl!=0);
		//input/output
		var io = parseInt(localStorage.getItem("spect_io_a"+Prjstr+window.location.host));
		if (isNaN(io) || io < 0 || io > 1) {
			io = 0;
		}
		this.io = io;
		//ul/dl
		if (!keepBandIo){
			var b = parseInt(localStorage.getItem("spect_chain"+Prjstr+window.location.host));
			if (isNaN(b) || b < 0 || b > 1) {
				b = 0;
			}
			this.chain = b;
			//band
			var band = parseInt(localStorage.getItem("spect_band"+Prjstr+window.location.host));
			if (isNaN(band) || band < 0 || band > 1) {
				band = 0;
			}
			this.band = band;
		}
		b = this.chain;
		band = this.band;
		//fstart/fstop			
		var fi = parseInt(localStorage.getItem("spect_fs"+Prjstr+band+b+window.location.host));
		var fp = parseInt(localStorage.getItem("spect_fp"+Prjstr+band+b+window.location.host));
		var fm = [factory.fstart[2*band+b],factory.fstop[2*band+b]];
		fm[0] = Math.floor(fm[0]/1e5)*1e5;
		fm[1] = Math.ceil(fm[1]/1e5)*1e5;
		if (!isNaN(fi) && !isNaN(fp) && fp >= fi
			&& fi >= fm[0] && fi <= fm[1]
			&& fp >= fm[0] && fp <= fm[1]) {
			this.fstart = fi;
			this.fstop = fp;
		} else {
			this.fstart = fm[0];
			this.fstop = fm[1];
		}
		//rbw
		var rbw = parseInt(localStorage.getItem("spect_rbw"+Prjstr+window.location.host));
		if (isNaN(rbw) || rbw < 0 || rbw >= this.MAXRES) {
			rbw = this.MAXRES - 1;
		}
		this.rbw = rbw;
		//avg
		var v = parseInt(localStorage.getItem("spect_avg"+Prjstr+window.location.host));
		if (isNaN(v) || v < 1 || v > this.MAXAVG) {
			v = 1;
		}
		this.avg = v;
		this.checkSettings();
		if (!keepBandIo){
			this.prevNpoints = this.npoints;
			this.prevFstart = this.fstart;
			this.prevFstop = this.fstop;
			this.prevIo = this.io;
			this.prevBand = this.band;
			this.prevChain = this.chain;
			this.prevAvg = this.avg;
			this.prevRbw = this.rbw;
		}

	}
}

	
function check_result(op){
	$.get( "/result.shtml?c="+Date.now(), function( data ) {
		if (data!="0" && n_retry<10){
			n_retry++;
			if (!dash) setTimeout(function() { check_result(op); }, 1000);
		}else{
			if (op!=COMMISSIONING){
				if (n_retry<10){
					showResultIcon(ERR_OK,indexHome);
				}else{
					showResultIcon(ERR_FAIL,indexHome);
				}
			}
			setTimeout(function() { loadpage(op);	}, 1000);
		}
	});
}
function loadpage(op){
	console.log('loadpage '+op);
	waitAns = false;
	if (locurl==9 ){ //spectrum
		indexHome=1;
		getGlobalConfiguration();
	}
	if (locurl==1){//project related
		getProjConfig();
	}
	if (locurl>=2 && locurl<=4){ //700,800,Band14
		indexHome=2;
		getGlobalConfiguration(op);	
	}
	if (locurl==8){ //alarmstat
		indexHome=3;
		getGlobalConfiguration();
	}
	if (locurl==5){ //alarmconfig
		indexHome=4;
		getGlobalConfiguration();
	}
	if (locurl==7){ //commissioning
		indexHome=5;
		getGlobalConfiguration(op);
	}
	if (locurl==6){ //ul adjustment
		indexHome=7;
		getGlobalConfiguration();
	}
	if (locurl==10){ //reports
		indexHome=6;
		$('#genreport').show("swing");
	}
	if (op!=COMMISSIONING){
		waitIcon = new MovingIcon(document.getElementById("cmdResult"+indexHome));
		showResultIcon(ERR_NONE,indexHome);
	}

}
function getGlobalConfiguration(op){
	if (indexHome == 5){
		$('.toolbar-bottom').hide();
	}
	if ( typeof(op) === 'undefined') op=0;
	$('#global_req').val("1");
	$.post( "home.html", { global_req:"1"}).done(function( data ) {

		$.get( "/global_conf.shtml?c="+Date.now(), function( str ) {
			if ( typeof(str) === 'undefined' || str === null ) {
				alert("Error 3");
				showResultIcon(ERR_FAIL,indexHome);
				return;
			}
			str = correctASCII(str);
			var srarr = str.split('\t');
			if (srarr.length < 7) {
				alert("Error 4");
				showResultIcon(ERR_FAIL,indexHome);
				return;
			}
			var srConf = srarr[0];
			var srFact = srarr[1];
			var srNFPA = srarr[6]; 
			
			serial = srarr[3].trim();
			version.parse(srarr[5]);
			
			localStorage.setItem("Conf"+Prjstr+window.location.host, srConf);
			localStorage.setItem("Factory"+Prjstr+window.location.host, srFact);
			localStorage.setItem("NFPAConf"+Prjstr+window.location.host, srNFPA);
			config.parse(srConf);
			factory.parse(srFact);
			NFPAcfg.parse(srNFPA);
			
			if (locurl==9){ //spectrum
				$('#spectrumsettingstab').append(pageAst.createSpectrumSettings());
				spec.initSettings(false); //se espera a tener los datos de factory.bandNames
				request_spectrum(); 
			}
			if (locurl==8){ //alarmstat
				pageAst.showAlarmAssign();
				load_status();
			}
			if (locurl==5){ //alarmconfig
				if (!initAlarmConfig){
					$('#smartwizard_al').smartWizard("reset");
					initAlarmConfig = true;
				}
				if (!document.getElementById("txt_isol")){
					$('#divAlarmConfigTab2').append(pageAst.createIsolTable()); //se espera a tener los datos de factory.bandNames
					pageAst.redrawAlarmConfig();
					pageAst.showAlarmConfig();
					pageAst.showAlarmAssign();
				}
				load_status();
				if (op!=WAITINGACKCONFGAIN) $('.toolbar-bottom').show();
			}
			if (locurl>=2 && locurl<=4){ //700,800,BAND14
				if(op==WAITINGACKCONF){
					showStep4();
				}else{
					$('#stpYes').css("display","inline");
					$('#stpNo').css("display","inline");
					pageAst.refreshPower(bandGUI);
				}
			}
			if (locurl==6){ //ul adjustment
				bsGui.create();
				redrawBSTable(false);
				wtGui.monitoring = false;
			}
			if (locurl==7){ //commissioning
				if(op==WAITINGACKCCH){
					active_comm_step12(0);
					active_comm_step12(1);
					$('#btnrun').show();
					if(stepc==3) $('.toolbar-bottom').hide();
				}else if (op==COMMISSIONING){
					runcomm2();
				}else if (op==WAITINGACKCONFGAIN){
					$("#smartwizardc").smartWizard("goToStep",4);
					showResultIcon(ERR_NONE,indexHome);
				}else{
					redrawSmartWizardC();
					$('.toolbar-bottom').show("swing");
				}
			}
			if (locurl==10){ //reports
				load_status();
			}
			
		});
	});
}
function getProjConfig(){
	if (indexHome==6) showResultIcon(ERR_PENDING,indexHome);
	
	$('#proj_req').val("1");
	$.post( "home.html", { proj_req:"1"}).done(function( data ) {
		
		$.get( "/update_proj.shtml?c="+Date.now(), function( str ) {
			if ( typeof(str) === 'undefined' || str === null ) {
				alert("Error 1");
				showResultIcon(ERR_FAIL,indexHome);
				return;
			}
			if (str.length<700){
				alert("Error 2");
				showResultIcon(ERR_FAIL,indexHome);
				return;
			}
			str=parseProjConfig(str);
			for (var k=0;k<7;k++){
				$("#prjinfo_"+k).val((str.substr(k*95,95)).trim());
			}
			$("#prjinfo_"+7).val((str.substr(665,35)).trim());
			$("#prjinfo_"+8).val((str.substr(700,30)).trim());
			if (indexHome==6){
				getGlobalConfiguration();
			}
		});
	});
}
function parseProjConfig(sr){
	var ret = "";
	try {
		
		for (var i = 0; i < sr.length; i += 2) {
			var hexnum = sr.substr(i, 2);
			var num = parseInt(hexnum, 16);
			if (isNaN(num))
				ret += " ";
			else
				ret += String.fromCharCode(num);
		}
	} catch(err) { }
	return ret;
}
function formatProjConfig(str){
	var ret='';
	str = str.trim();
	for (var j = 0; j < 730; ++j)
		str += ' ';
	str = str.slice(0, 730);
	for (var j = 0; j < 730; ++j) {
		var num = str.charCodeAt(j);
		var hexnum;
		if (!isNaN(num))
			hexnum = '00' + num.toString(16);
		else
			hexnum =  '20';
		ret += hexnum.slice(-2);
	}
	return ret;
}

function load_status(){
	$.get( "/update.shtml?c="+Date.now(), function( data ) {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		statCount++;
		monitor.parse(data);
		for (var c=0;c<(nbadjGUI==0?2*config.CHNR:factory.numADJFilters);c++){
			for (var b=0;b<2;b++){
				try{
				setMetValue("level_"+nbadjGUI+"_"+bandGUI+"_"+b+"_"+c,monitor.level[nbadjGUI][bandGUI][b][c],"undefined",1,"dBm");
				//$("#level_"+nbadjGUI+"_"+bandGUI+"_"+b+"_"+c).html(monitor.level[nbadjGUI][bandGUI][b][c].toFixed(1));
				} catch (err) {}
			}
		}	
		for (var k=0;k<getNrOfRelaysSupported(config,factory,version);k++){
			try{
				pageAst.relayStateSet(k,monitor.relayOpenClosed[k],monitor.relayONOFF[k]);
			} catch (err) {}		
		}
		for (var b=0;b<2;b++){
			try{ pageAst.agcSet(b,monitor.bbAgc[b][1]);} catch (err) {}
			for (var i=0;i<2;i++){
				try{ pageAst.bbAgcSet(b,i,monitor.bbAgc[b][i]);} catch (err) {}
				try{ pageAst.paStateSet(b,i,monitor.statePaOn[b][i]);} catch (err) {}
			}		
		}
		try{
			pageAst.tempSet(monitor.boardTemp);
		} catch (err) {}
		if (indexHome==4){
			pageAdv.opfRoutineRunningSet(monitor.isolMeasRunning[0]);		
			pageAdv.setIsolGain(monitor.maxAllowGain);
			pageAdv.setLastRetryTime(monitor.retryTime[0]);
			pageAdv.showExtremeTempStatus(monitor.extremeTempActionOn);
			pageAdv.extremeTempActionStatusOn = monitor.extremeTempActionOn;
		}
		if (commissioning){
			$('#progcomm').html('('+statCount+'/'+NUMCOMMMEAS+' measures)');
			getRSSILevels();
		}
		if (!commissioning || statCount<NUMCOMMMEAS){
			if (indexHome==3){
				if (!dash) tmrIdStat = setTimeout(function() { getGlobalConfiguration(); }, 500);
			}else if (indexHome!=6){
				if (!dash) tmrIdStat = setTimeout(function() { load_status(); }, (isEthernetMode? 1500 : 500));
			}
		}else if (commissioning){
			commissioning = false;
			runcomm3();
		}
		if (indexHome==6){
			eventLog = new EventLog();
			eventLog.reqLogData();
			setTimeout(function() { getAlarmLogForPdf(); }, 1000);
		}
	});
	
}
function checkDLGains(){//devuelve true si la DL gain no es max allowable gain
	var check = false;
	try{
		for (var band=0;band<2;band++){
			if ((factory.chBandEnabled[band] || factory.bandEnabled[band]) && monitor.configGain[band][1]<monitor.maxAllowGain[band]) check = true;
		}
		return check;
	}catch (err) {return false;}
}
function getAlarmLogForPdf(){
		if (eventLog.loaded){
			setTimeout(function() { genReport(); }, 100);
		}else{
			setTimeout(function() { getAlarmLogForPdf(); }, 1000);
		}
	}
function getRSSILevels(){
	var k,max,cchExists,c,na;
	for (k=0;k<2;k++){
		max=-128;
		cchExists = false;
		cch = config.controlChannel[k];
		if (k==0 && config.firstADJisFirstNet && cch==-1) cch=0; //se considera que no hay CCH si está fijado en Band14
		if (Math.abs(cch)<(2*config.CHNR)){
			if (cch>0){
				na=0;
				c=cch-1;
				cchExists = config.filterEnabled[na][k][1][c];
			}
			if (cch<0){
				na=1;
				c=-cch-1;
				cchExists = config.filterEnabled[na][k][1][c];
			}
		}
		if (cchExists){
			max = monitor.level[na][k][1][c];
			naComm[k]=na;
			if (monitor.signalDet[na][k][1][c]) signalComm[k]=true;
		}else{
			for (na=0;na<2;na++){
				for (c=0;c<(na==0?2*config.CHNR:factory.numADJFilters);c++){
					var isFn = (k==0 && c==0 && na==1 && config.firstADJisFirstNet)
					if (config.filterEnabled[na][k][1][c] && monitor.level[na][k][1][c]>max && !isFn){
						max=monitor.level[na][k][1][c];
						naComm[k]=na;
						if (monitor.signalDet[na][k][1][c]) signalComm[k]=true;
					}
				}
			}
		}

		if (max>rssiComm[k]) rssiComm[k]=max;
		maxAllowComm[k]=monitor.maxAllowGain[k];
	}
	if (config.filterEnabled[1][0][1][0] && config.firstADJisFirstNet){
		if (monitor.level[1][0][1][0]>rssiComm[2]) rssiComm[2]=monitor.level[1][0][1][0];
		maxAllowComm[2]=monitor.maxAllowGain[0];
		naComm[2] = 1;
		if (monitor.signalDet[1][0][1][0]) signalComm[k]=true;
	}
	for (k=0;k<3;k++)
		console.log('rssiComm['+k+']='+rssiComm[k]);
}
function request_spectrum(){
	if (!waitAns){
		spec.prevNpoints = spec.npoints;
		spec.prevFstart = spec.fstart;
		spec.prevFstop = spec.fstop;
		spec.prevIo = spec.io;
		spec.prevBand = spec.band;
		spec.prevChain = spec.chain;
		spec.prevAvg = spec.avg;
		spec.prevRbw = spec.rbw;
		waitAns = true;
		var spectstr = "";
		spectstr += hexformat(spec.fstart,8);
		spectstr += hexformat(spec.fstop,8);
		var mask = 0;
		mask |= spec.io & 0x1;
		mask |= (spec.rbw & 0x7)<<1;
		mask |= (spec.chain & 0x1)<<5;
		mask |= (spec.band & 0x1)<<6;
		spectstr += hexformat(mask,2);
		spectstr += hexformat((spec.avg-1) & 0x1f,2);
		$("#spect_band").val(spectstr);
		$("#spect_req").val("1");
		$.post( "home.html", {spect_band:spectstr,spect_req:"1"}).done(function( data ) {
			n_retry=0;
			if (!dash) tmrIdStat = setTimeout(function() { load_spectrum(); }, 200);
		});
	}
}

function load_spectrum(){
	$.get( "/update_spct.shtml?c="+Date.now(), function( data ) {
		if (data.length<(2*spec.prevNpoints) && n_retry<40){
			n_retry++;
			if (!dash) tmrIdStat = setTimeout(function() { load_spectrum(); }, 500);
		}else{
			var x = [];
			var y = [];
			var val;
			var mh = $('#maxhold').prop("checked");
			for(var k=0;k<spec.prevNpoints;k++){
				x.push(k);
				var offset = spec.prevIo ==0?-10:0;
				val = offset+cSignedByte(parseInt(data.substr(2*k,2),16));
				var max = spec.prevIo ==1?40:0;
				var min = spec.prevIo ==1?-90:-130;
				if (val>max) val = max;
				if (val<min) val = min;
				if (mh){
					if (val>spec.valsMax[k])
						spec.valsMax[k]=val;
					else
						val=spec.valsMax[k];
				}
				y.push(val); 
			}
			if (mh) spec.nMaxHolds++;
			drawGraph(x,y,spec.prevNpoints);
			waitAns = false;
			request_spectrum();
		}
	});
}
function clearGraph(){
	var x = [0,1];
	var y = [-140,-140]
	drawGraph(x,y,2);
}
function drawGraph(x,y,n){
	var cnv = document.getElementById("canvas1");
	cnv.height = 420; 
	cnv.width = 720;
	
	
	ctx.lineWidth = 1;
	ctx.beginPath();
	var reflevel = spec.prevIo==0?0:40;
	for (var k=0;k<n-1;k++){
		ctx.moveTo(canvas.width/11.5+x[k]*canvas.width*10/11.5/(n-1), ((reflevel-y[k])/130)*canvas.height*13/14.5+0.5*canvas.height/14.5); //eje y desde -130dBm a 0dBm
		ctx.lineTo(canvas.width/11.5+x[k+1]*canvas.width*10/11.5/(n-1), ((reflevel-y[k+1])/130)*canvas.height*13/14.5+0.5*canvas.height/14.5);
		ctx.strokeStyle = "#00ff00";
		ctx.stroke();
	}
	if ($('#highlight').prop("checked")) drawCHmarks(10,13, 2, "#ffffff");
	drawGrid(10,13, 1, "#00ff00");
}
function drawCHmarks(nX, nY, anchoLinea, color) {
	ctx.globalAlpha = 0.4;
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = anchoLinea;
	var b = spec.prevBand;
	var ud = spec.prevChain;
	var k;
	try{
		for (k=0;k<2*config.CHNR;k++){
			if (config.filterEnabled[0][b][1][k]){
				var i = 10.0*(config.freqHz[b][ud][k]-spec.prevFstart)/(spec.prevFstop-spec.prevFstart);
				var bw = config.bwKHz[b][ud][k]*1e4/(spec.prevFstop-spec.prevFstart);
				var x1 = (i-bw/2+1)*canvas.width/(nX+1.5);
				var x2 = (i+bw/2+1)*canvas.width/(nX+1.5);
				if ((x2-x1)<4){ //para visualizar bw estrechos
					var m = (x1+x2)/2;
					x1=m-2;
					x2=m+2;
				}
				if (x2<canvas.width/(nX+1.5)) continue;
				if (x1>(canvas.width*(nX+1)/(nX+1.5))) continue;
				if (x1<canvas.width/(nX+1.5)) x1=canvas.width/(nX+1.5);
				if (x2>(canvas.width*(nX+1)/(nX+1.5))) x2=canvas.width*(nX+1)/(nX+1.5);
				ctx.beginPath();
				ctx.fillRect(x1,0.5*canvas.height/(nY+1.5),x2-x1,canvas.height*13/14.5);
				ctx.stroke();
			}
		}
		for (k=0;k<factory.numADJFilters;k++){
			if (config.filterEnabled[1][b][1][k]){
				var i = 10.0*(config.fstartHzAdjFilter[b][ud][k]-spec.prevFstart)/(spec.prevFstop-spec.prevFstart);
				var bw = 10.0*(config.fstopHzAdjFilter[b][ud][k]-spec.prevFstart)/(spec.prevFstop-spec.prevFstart)-i;
				var x1 = (i+1)*canvas.width/(nX+1.5);
				var x2 = (i+bw+1)*canvas.width/(nX+1.5);
				if (x2<canvas.width/(nX+1.5)) continue;
				if (x1>(canvas.width*(nX+1)/(nX+1.5))) continue;
				if (x1<canvas.width/(nX+1.5)) x1=canvas.width/(nX+1.5);
				if (x2>(canvas.width*(nX+1)/(nX+1.5))) x2=canvas.width*(nX+1)/(nX+1.5);
				ctx.beginPath();
				ctx.fillRect(x1,0.5*canvas.height/(nY+1.5),x2-x1,canvas.height*13/14.5);
				ctx.stroke();
			}
		}
	}catch (err){}
	ctx.globalAlpha = 1;
}
function drawGrid(nX, nY, anchoLinea, color) {
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = anchoLinea;
	ctx.font = "12px arial";
	var s;
	var drawLabel = true;
	if (typeof(spec.prevFstart)==='undefined' ){
		spec.prevIo=0;
		drawLabel = false;
	}
	var lblx = spec.prevFstart/1e6;
	var step = (spec.prevFstop/1e6-lblx)/nX;
	var lbly = spec.prevIo==0?0:40;
	
	for (i = 0; i <= nX; i ++) {
		ctx.beginPath();
		ctx.moveTo((i+1)*canvas.width/(nX+1.5), 0.5*canvas.height/(nY+1.5));
		ctx.lineTo((i+1)*canvas.width/(nX+1.5), canvas.height*(nY+0.5)/(nY+1.5));
		ctx.stroke();
		s = lblx.toFixed(2);
		if (drawLabel) ctx.fillText(s , Math.round( -13+(i+1)*canvas.width/(nX+1.5)),405);
		lblx = lblx +step;		
	}
	for (i = 0; i <= nY; i ++) {
		ctx.beginPath();
		ctx.moveTo(canvas.width/(nX+1.5), (i+0.5)*canvas.height/(nY+1.5));
		ctx.lineTo(ctx.canvas.width*(nX+1)/(nX+1.5), (i+0.5)*canvas.height/(nY+1.5));
		ctx.stroke();
		ctx.fillText((lbly>0?"+":"")+lbly.toFixed(1), 6,Math.round(3+(i+0.5)*canvas.height/(nY+1.5)));
		lbly = lbly -10;
	}
	if (drawLabel){
		var lbl = factory.bandNames[spec.prevBand]+"  ";
		lbl += spec.prevChain==1?"DOWNLINK  ":"UPLINK  "
		lbl += spec.prevIo==1?"OUT  ":"IN  ";
		lbl += "RBW="+(3.125*(1<<spec.prevRbw))+"KHz  ";
		lbl += "N.AVG="+(spec.prevAvg)+"  ";
		if ($('#maxhold').prop("checked")){
			lbl += "Max Hold of "+(spec.nMaxHolds)+" traces  ";
		}
		var d = new Date();
		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		lbl += getCurrentDate(false)+"  ";
		ctx.fillText(lbl, canvas.width/(nX+1.5),12);
	}
}
function getCurrentDate(formatfile){
	var d = new Date();
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var lbl="";
	if (!formatfile){
		lbl += d.getDate()+"/"+months[d.getMonth()]+"/"+d.getFullYear()+"  ";
		lbl += d.getHours()+":"+("0"+d.getMinutes()).substr(-2,2)+":"+("0"+d.getSeconds()).substr(-2,2);	
	}else{
		lbl += ("0"+d.getFullYear()).substr(-4,4)+("0"+(d.getMonth()+1)).substr(-2,2)+("0"+(d.getDate())).substr(-2,2)+"_";
		lbl += ("0"+d.getHours()).substr(-2,2)+("0"+d.getMinutes()).substr(-2,2)+("0"+(d.getSeconds())).substr(-2,2);
	}

	return lbl;
}
function initSpectrum(){
	if (canvas && canvas.getContext) {
		var ctx = canvas.getContext("2d");	
		if (ctx) {
			/*$("#canvas1").click(function(e){
				getPosition(e); 
			});*/
			clearGraph();		
		} else {
			alert("No se pudo cargar el contexto");
		}
	}	  
}
function initNumChSel(band,na){
	var e = $('#idcuantoch');
	var n=0;
	var num;
	$('#idcuantoch').empty();
	if (na==0){
		num = factory.singleBandEnabled[band]?64:32;
	}else{
		num = factory.numADJFilters;
	}
	var first = true;
	for (k=0;k<=num;k++){
		e.append($("<option>").attr('value',k).text(k));
		if (config.filterEnabled[na][band][1][k]){
			n++;
			if (first){
				first = false;
				$('#idbw').val(config.bwKHz[band][1][k]);
				$('#classBnot').css("display",config.bwKHz[band][1][k]>75?"table-cell":"none");
			}
		}
	}
	e.val(n);
}
function numEnabledFilts(band,na){
	var n=0;
	var num;
	if (na==0){
		num = factory.singleBandEnabled[band]?64:32;
	}else{
		num = factory.numADJFilters;
	}
	for (k=0;k<=num;k++){
		if (config.filterEnabled[na][band][1][k]) n++;
	}
	return n;
}
function loadjscssfile(filename, filetype){
    if (filetype=="js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}
function createMetCell(id, s) {
	var tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	return tdNode;
}

function mMeter(min, max, loA, hiA, loW, hiW) {
	this.mMax = max;
	this.mMin = min;
	this.mVal = max;
	this.mLowAlarm = loA;
	this.mHighAlarm = hiA;
	this.mLowWarning = loW;
	this.mHighWarning = hiW;
	this.colorNormal = "#00a500";
	this.colorWarn = "#f2b200";
	this.colorAlarm = "#e20000";
	this.mDiv = document.createElement("div");
	this.mSpan = document.createElement("span");
	this.mDiv.appendChild(this.mSpan);
	this.mDiv.className = "meter";
	this.mDiv.style.width = "40px";
	this.getDiv = function ()  {
		return this.mDiv;
	}
	this.attachTo = function(parent) {
		try {
			parent.mMeter = this;
			parent.appendChild(this.mDiv);
		} catch (err) {}
	}
	this.valueSet = function(val, color) {
		try {
			var percent;
			if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)) || val <= this.mMin)
				percent = 0;
			else if (val >= this.mMax)
				percent = 100;
			else
				percent = 100*(val - this.mMin)/(this.mMax - this.mMin);
			this.mSpan.style.width = ""+percent.toFixed(0)+"%";
			var bColor;
			if (typeof(color) === 'undefined') {
				if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)))
					bColor = this.colorNormal;
				else if (val < this.mLowAlarm)
					bColor = this.colorAlarm;
				else if (val < this.mLowWarning)
					bColor = this.colorWarn;
				else if (val > this.mHighAlarm)
					bColor = this.colorAlarm;
				else if (val > this.mHighWarning)
					bColor = this.colorWarn;
				else
					bColor = this.colorNormal;
			} else
				bColor = color;
			this.mSpan.style.backgroundColor = bColor;
		} catch (err) {}
	}
}
function createAGCBar(band){
		var settings = {min: 0, low_alarm: 20, low_warn: 10, high_warn: 20, high_alarm: 31, max: 31 };
		return createMetCell('agc_'+band, settings);
}
function createTempBar(){
		var settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
		return createMetCell('temp', settings);
}
function setMetRange(id, settings) {
	try {
		var met = document.getElementById("met_"+id).mMeter;
		if (!met) {
			return;
		}
		met.mMax = settings.max;
		met.mMin = settings.min;
		met.mLowAlarm = settings.loA;
		met.mHighAlarm = settings.hiA;
		met.mLowWarning = settings.loW;
		met.mHighWarning = settings.hiW;
	} catch (err) { }
}

function setMetValue(id, val, opt, precision,units) {
	try {
		var met = document.getElementById("met_"+id).mMeter;
		if (met) {
			var color;
			if (typeof(opt) !== "undefined") {
				if (opt.toLowerCase() == "normal") {
					color = met.colorNormal;
				} else if (opt.toLowerCase() == "warning") {
					color = met.colorWarn;
				} else if (opt.toLowerCase() == "alarm") {
					color = met.colorAlarm;
				} else {
					color = opt;
				}
			}
			met.valueSet(val, color);
		}
		var txt = document.getElementById("txt_"+id);
		if (txt) {
			if (isNaN(val)) {
				txt.innerHTML = val;
			} else {
				var p = 1;
				if (typeof(precision) !== 'undefined' 
					&& !isNaN(precision)
					&& (precision == 0 || precision == 1 || precision == 2 || precision == 3))
				{
					p = precision;
				}
				txt.innerHTML = val.toFixed(p)+units;
			}
		}
	} catch (err) { }
}

function createTextCell(id) {
	var tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.style.width ="36px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	return tdNode;
}
function setMaxAllowGain(){
	clearTimeout(tmrIdStat);
	waitAns = true;
	cnfToSend = new ConfigBDA();
	cnfToSend.parse(config.frm);
	for (var band=0;band<2;band++){
		if (factory.chBandEnabled[band] || factory.adjBandEnabled[band]) cnfToSend.gain[band][1] = monitor.maxAllowGain[band];
	}
	showResultIcon(ERR_PENDING,indexHome);
	$("#ctl_conf_str").val(cnfToSend.getFrm());
	$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
		n_retry=0;
		setTimeout(function() { check_result(WAITINGACKCONFGAIN); }, 1000);
	});

}
function save_config(doIsolMeas, doClearAlarm, forceDLMaxGain){
	clearTimeout(tmrIdStat);
	waitAns = true;
	cnfToSend = new ConfigBDA();
	cnfToSend.parse(config.frm);
	if ( typeof(doIsolMeas) === 'undefined') doIsolMeas = false;
	if ( typeof(doClearAlarm) === 'undefined') doClearAlarm = false;
	if ( typeof(forceDLMaxGain) === 'undefined') forceDLMaxGain = false;
	if (doIsolMeas || doClearAlarm){
		cnfToSend.runIsolationMeas[0] = doIsolMeas;
		cnfToSend.clearOscAlarm[0] = doClearAlarm;
		if (doIsolMeas) cnfToSend.forceDLMaxGain = forceDLMaxGain;
	}else{
		if (indexHome == 4){
			pageAst.readConfAlarm(cnfToSend);
		}else{
			pageAst.readConf(cnfToSend,bandGUI,nbadjGUI);
		}
	}
	if (config.compare(cnfToSend)>=0){
		showResultIcon(ERR_PENDING,indexHome);
		$("#ctl_conf_str").val(cnfToSend.getFrm());
		$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
			n_retry=0;
			if (!dash) setTimeout(function() { check_result(); }, 1000);
		});
	}else{
		showResultIcon(ERR_OK,indexHome);
		setTimeout(function() { showResultIcon(ERR_NONE,indexHome); }, 2000);
	}
}
function save_image(num){
	var img = document.getElementById("canvas1").toDataURL('image/JPEG');
	$('#imgspec'+num).prop("src",img);
	localStorage.setItem("img"+num,img); 
	localStorage.setItem("imgserial"+num,serial); 
}
function commResult() {
	this.serial;
	this.time;
	this.enabledBand = [false,false,false];
	this.isolMeas = ['','',''];
	this.maxAllowGain = ['','',''];
	this.rssiCch = ['','',''];
	this.maxOutPow = ['','',''];
	this.actMaxOutPow = ['','',''];
}
function setGainAndDisplayCommResults(){
 	var apow,poorIsol,p,showIsolTip=false,showLevelTip=false,showSqTip=false,na;
	var gain = [0,0,0];
	var n=[0,0];
	var pmax=[0,0];
	var pmaxband = [0,0,0];
	var curDate = getCurrentDate(false);
 	$('#timecomm').html(curDate);
	var result = new commResult();
	result.serial = serial;
	result.time = curDate;
	var enabled = [false,false,false];
	//se anticipa cálculo gain para tomar el max entre 700 y band14
	for (var k=0;k<3;k++){
		p=k;
		if (k==2) p=0; //resultados de band14 se toman de band0
		n[0] = numEnabledFilts(p,0);
		n[1] = numEnabledFilts(p,1);
		if (k<2){
			enabled[k] = (factory.chBandEnabled[k] && (n[0]>0)) || (factory.adjBandEnabled[k] && n[1]>0);
			if (k==0 && config.filterEnabled[1][0][1][0] && config.firstADJisFirstNet && n[0]==0 && n[1]==1) //si en banda700 sólo hay un filtro y es el 'band14' se considera que sólo hay band14 y no 700
				enabled[0]=false;
		}else{
			enabled[k] = config.filterEnabled[1][0][1][0] && config.firstADJisFirstNet;
		}
		if (enabled[k]){
			for (na=0;na<2;na++){
				var bandEnabled = (na==0?factory.chBandEnabled[p]:factory.adjBandEnabled[p]);
				pmax[na] = config.power[p][1];
				if ((factory.chBandEnabled[p] && (n[0]>0)) && (factory.adjBandEnabled[p] && n[1]>0)) pmax[na]-=3;
				if (n[na]>0 && bandEnabled){
					pmax[na]-=(10*Math.log((n[na]))/Math.LN10);
					
				}
			}
			pmaxband[k]=pmax[naComm[k]];
			gain[k] = Math.round(pmaxband[k]-rssiComm[k]+3);
			if (gain[k]>maxAllowComm[k]) gain[k]=maxAllowComm[k];
		}else{
			$('#commresb'+k).css("display","none");
		}
	}
	if (enabled[0] && enabled[2]){
		if (gain[0]>gain[2]){
			gain[2]=gain[0];
		}else{
			gain[0]=gain[2];
		}
	}
	for (var k=0;k<3;k++){
		result.enabledBand[k] = enabled[k];
		if (enabled[k]){
			p=k;
			if (k==2) p=0; //resultados de band14 se toman de band0
			$('#commresb'+k).css("display","table-cell");
			if (!signalComm[k]) showSqTip=true;
			var strTxt = rssiComm[k].toFixed(1);
			$('#rssi'+k).html(strTxt); result.rssiCch[k] = strTxt;
			$('#gain'+k).html(maxAllowComm[k].toFixed(1)); result.maxAllowGain[k] = maxAllowComm[k].toFixed(1);
			$('#dlconfgain'+k).html(monitor.configGain[p][1]);
			$('#ulconfgain'+k).html(monitor.configGain[p][0]); 
			var isol = (maxAllowComm[k]+config.gainIsolMargin[0]).toFixed(1);
			poorIsol=true;
			if (maxAllowComm[k]>=factory.gainlimit[2*p]){
				isol=">"+isol;
				poorIsol = false;
			}
			$('#isol'+k).html(isol); result.isolMeas[k] = isol;
			apow = rssiComm[k]+gain[k];
			if (apow>pmaxband[k]) apow=pmaxband[k];
			$('#poutch'+k).html(pmaxband[k].toFixed(1)); result.maxOutPow[k] = pmaxband[k].toFixed(1);
			strTxt = !signalComm[k]?'---':apow.toFixed(1);
			$('#apoutch'+k).html(strTxt); result.actMaxOutPow[k] = strTxt;
			//Messages
			if (apow>(pmaxband[k]-0.5)){
				$('#iconres'+k).prop("src","i/tick.png");
				$('#totalres'+k).html('Maximum output power is<br>achieved');
			}else if (!signalComm[k]){
				$('#iconres'+k).prop("src","i/warning.png");
				$('#totalres'+k).html('Input Level is too weak<br>to achieve squelch threshold');
			}else if ((rssiComm[k]+factory.gainlimit[2*p])>=(pmaxband[k]-0.5)){
				$('#iconres'+k).prop("src","i/wrench.png");
				$('#totalres'+k).html('Isolation is not enough<br>to achieve maximum power');
				showIsolTip=true;
			}else{
				$('#iconres'+k).prop("src","i/warning.png");
				$('#totalres'+k).html('Input Level is too weak<br>to achieve maximum power');
				showLevelTip=true;
			}
		}
	}
	localStorage.setItem("commResult",JSON.stringify(result));
	var messtip="";
	if (showIsolTip){
		messtip+='<h4 style="font-size:18px;">Isolation improvement tips</h4><br><span style="color:black">';
		messtip+=' 1. Verify correct installation and performance of all cables and passive devices.<br>';
		messtip+=' 2. Check donor antenna positioning/azimuth.  Donor antenna should be installed as close to the outer edge of the building’s rooftop as possible and pointing away from the building.<br>';
		messtip+=' 3. Increase the height of the donor antenna.  Vertical separation can help increase isolation.<br>';
		messtip+=' 4. Locate the indoor antenna(s) causing low isolation.  Attenuate or remove accordingly.<br>';
		messtip+=' 5. Replace donor antenna with a higher isolation donor antenna.<br>';
		messtip+='<br></span>';
	}
	if (showLevelTip || showSqTip){
		messtip+='<h4 style="font-size:18px;">Input level improvement tips</h4><br><span style="color:black">';
		messtip+=' 1. Check to ensure donor antenna alignment/azimuth is correct and optimized.<br>';
		messtip+=' 2. Check cables & connections between donor antenna and the BDA to ensure correct performance.<br>';
		messtip+=' 3. Replace donor antenna with a higher gain donor antenna.<br>';
		if (showSqTip) messtip+=' 4. Check DL squelch threshold setting.<br>';
		messtip+='<br></span>';
	}
	if (showIsolTip || showLevelTip || showSqTip){
		messtip+='<h4 style="font-size:16px;color:#ff8020;">	WARNING: IF DURING THIS STEP, THE DONOR ANTENNA OR RELATED PASSIVE DEVICES NEEDED TO BE MODIFIED FROM THEIR ORIGINAL INSTALLATION, THEN THE USER MUST EXECUTE STEPS 2 TO 6 AGAIN IN ORDER TO VERIFY THE CORRECT DOWNLINK POWER RECEPTION.</h4>'
	}
		
	$('#commtipt').css("display",(messtip.length>0?"table":"none"));
	$('#commtip').html(messtip);
}
