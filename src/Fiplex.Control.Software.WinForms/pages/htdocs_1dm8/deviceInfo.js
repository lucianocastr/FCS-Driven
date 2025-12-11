//constructor
var MAXCHAN = 24;
function deviceInfo() {
	this.master = new deviceMaster();
	this.expansion = [];
	this.remote = [];
	for (var j=0;j<3;j++)
		this.expansion.push(new deviceExpansion(j));
	for (var j=0;j<24;j++)
		this.remote.push(new deviceRemote(j)); 
	
	this.parseStatus = function(sr) {
		var statstrs = sr.split("\t");
		//master
		this.master.parseStatus(statstrs[0]);
		for (j=1;j<statstrs.length;j++){
			if (statstrs[j].length>16){ //se descuenta última posición del array de la trama de status por longitud
				var headerE = parseInt(statstrs[j].substr(2,2),16);
				var headerR = parseInt(statstrs[j].substr(0,2),16);
				if (headerR==0 && headerE>0 && headerE<=3) this.expansion[headerE-1].parseStatus(statstrs[j]);
				if (headerE==1 && headerR>=1 && headerR<=24) this.remote[headerR-1].parseStatus(statstrs[j]);
			}
		}
	}
	this.parseConfig = function(sr) {
		var cfgstrs = sr.split("\t");
		//master
		this.master.parseConfig(cfgstrs[0]);
		for (j=1;j<cfgstrs.length;j++){
			if (cfgstrs[j].length>6){
				var headerE = parseInt(cfgstrs[j].substr(2,2),16);
				var headerR = parseInt(cfgstrs[j].substr(0,2),16);
				if (headerE==1 && headerR>=1 && headerR<=24) this.remote[headerR-1].parseConfig(cfgstrs[j]);
			}
		}		
	}
}
//constructor master
function deviceMaster(){
	this.stat = new monitorMaster();
	this.cfg = new configMaster();
	this.parseStatus = function(sr){
		this.stat.parseStatus(sr);
	}
	this.parseConfig = function(sr){
		this.cfg.parseConfig(sr);
	}	
	this.updateUI = function(){
		this.updateUIStatus();
	}
	//No se considera necesario en este punto variar el parse_config
	/*this.updateUIConfig = function(){
		setMasterMode(this.cfg.masterMode);
		hpaSwSet(0, this.cfg.pAEnabled);
		enHpaLedSet(0, this.cfg.pAEnabled ? "green" : "grey");
		filtEnableSet(0,this.cfg.filteringEnabled);
		filtSqEnSet(0, this.cfg.sqEnabled);
		simplexEnSet(0, this.cfg.simplexEnabled);
		setLinkedFreq(window.top.LinkedFreq);
	}*/
	this.updateUIStatus = function(){
		try{
			for (var i=0;i<MAXCHAN;i++){
				if (!this.cfg.chEnabled[i]) {
					chSignalLedSet(i+1, 0, "grey");
					chPowerSet(i+1, 0, this.stat.chLevel[i], "#bbbbbb");
				} else if (this.stat.chDetSignal[i]) {
					chSignalLedSet(i+1, 0, "green");
					chPowerSet(i+1, 0, this.stat.chLevel[i]);
				} else {
					chSignalLedSet(i+1, 0, "yellow");
					chPowerSet(i+1, 0, this.stat.chLevel[i], "#f1a165");
				}
				if (!this.cfg.filteringEnabled || !this.cfg.chEnabled[i]) {
					chAgcSet(i+1,0,"--", "#bbbbbb");
				} else {
					chAgcSet(i+1,0,!this.stat.chDetSignal[i]&&this.cfg.sqEnabled?0:this.stat.chAGC[i]);
				}
			}
			statHpaLedSet(0, this.stat.commError?  "red" : "grey");
			//txLowHpaLedSet(0, (bitmask & 0x80)?  "red" : "grey"); //se considera que no hay txpowerlow
			boardTempLedSet(0, this.stat.tempAlarm?  "red" : "grey");
			fpgaLedSet(0, this.stat.hwFail ?  "red" : "grey");
			var nfpaMonitor = window.top.NFPAMonitor[0];
			setDoorAlarm(0, nfpaMonitor, this.stat.commError, this.stat.doorOpenAvailable, this.stat.doorOpen);		
			ovfLedSet(0, this.stat.overload[0]==2?"red":this.stat.overload[0]==1?"yellow":"grey");	
			ovfLedSet("01", this.stat.overload[1]==2?"red":this.stat.overload[1]==1?"yellow":"grey");
			setActiveInput(this.stat.activeInput);
			if (this.cfg.masterMode == 0) 
				setPLLstate(0, 0);
			else 
				setPLLstate(this.stat.pllOn, this.stat.pllStatus);
			if (this.cfg.masterMode == 2)
				setMasterModeStatus(this.stat.masterPrimary ? "PRIMARY":"SECONDARY");
			else
				setMasterModeStatus("");
			if (this.stat.tempAlarm)
				boardTempSet(0, this.stat.temp, "#df4040");
			else
				boardTempSet(0, this.stat.temp);
			agcSet(this.stat.bandLevelOut==-128?0:this.stat.bandAGCOut,0);
			rfOutPowSet(0, this.stat.bandLevelOut);
			for (i=0;i<2;i++){
				if (this.stat.overload[i]==2)
					rfInPowSet(i==0?0:"01", this.stat.bandLevel[i], "#df4040");
				else if (this.stat.overload[i]==1)
					rfInPowSet(i==0?0:"01", this.stat.bandLevel[i], "#f1a165");
				else
					rfInPowSet(i==0?0:"01", this.stat.bandLevel[i]);
			}
			tbsFailLedSet(this.stat.rxlow ? "red" : "grey");
			paCurrentLedSet(this.stat.ulPAFail ? "red" : "grey");
			for (var i = 1; i <= window.top.expansorNr; i++)	
				expansorLinkLedSet(i, window.top.stateledExp[i]==2 ? "red" : (window.top.stateledExp[i]==1? "yellow" : "green"));
			for (var i=0;i<24;i++){
				fiberPowerSet(i+1, 0, this.stat.rxpow[i]);
				optRxLedSet(i+1, 0, this.stat.lossopt[i]? "red": "green");
				optRxCommLedSet(i+1, 0, this.stat.losscom[i]? "red": "green");
				optErrorsSet(i+1, 0, this.stat.errors[i]);
				optStatusLedSet(i+1, 0, this.stat.fotransc[i]==2? "red" : (this.stat.fotransc[i]==1? "yellow" : "green"));
			}
			gdRender(delays, fiberPorts);
		} catch (err) {}
	}
}
function monitorMaster(){
	this.activeInput = 0;
	this.bandLevel = [];
	this.overload = [];//0-no ov, 1-warn ov, 2-ov
	this.chLevel = [];
	this.chAGC = [];
	this.chDetSignal = [];
	this.rxlow = false;
	this.bandLevelOut = 0;
	this.bandAGCOut = 0;
	this.ulPAFail = false;
	this.commError = false;
	this.temp = 0;
	this.tempAlarm = 0;
	this.hwFail = false;
	this.pllOn = false;
	this.pllStatus = false;
	this.doorOpen = false;
	this.doorOpenAvailable = false;
	this.masterPrimary = true;
	//se almacenan aquí provisionalmente los 24 siguientes infos del lado master para el GUI
	this.rxpow = []; 
	this.lossopt = [];
	this.losscom = [];
	this.fotransc = [];
	this.errors = [];
	
	for (var i=0;i<24;i++){
		this.rxpow.push[0];
		this.lossopt.push(false);
		this.losscom.push(false);
		this.fotransc.push(0);
		this.errors.push(0);
	}
	for (var i=0;i<2;i++){
		this.bandLevel.push(0);
		this.overload.push(0);
	}
	for (var i=0;i<MAXCHAN;i++){
		this.chLevel.push(0);
		this.chAGC.push(0);
		this.chDetSignal.push(false);
	}	
	this.parseStatus = function(sr) {
		var shift = 4;
		this.temp = cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
		var num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.overload[0] = (num & 0x1)?2:(num & 0x8)?1:0;
		this.hwFail = (num & 0x2)!=0;
		this.tempAlarm = (num & 0x4)!=0;
		this.pllStatus = (num & 0x20)!=0;
		this.pllOn = (num & 0x10)!=0;
		this.commError = (num & 0x40)!=0;
		this.bandLevel[0] = to_float(parseInt(sr.substr(shift,4),16));shift+=4;
		this.bandLevelOut = to_float(parseInt(sr.substr(shift,4),16));shift+=4;
		this.bandAGCOut = to_float(parseInt(sr.substr(shift,4),16));shift+=4;
		
		for (var i=0;i<MAXCHAN;i++){
			num = parseInt(sr.substr(shift,2),16);shift+=2;
			this.chDetSignal[i] = (num&0x80)!=0;
			num = cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
			this.chLevel[i] = num;
			num = cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
			this.chAGC[i] = num;
		}	
		shift = 352;
		num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.overload[1] = (num & 0x1)?2:(num & 0x2)?1:0;
		this.activeInput = (num & 0x4)!=0;
		this.doorOpenAvailable = (num&0x40)!=0;
		this.doorOpen = (num&0x80)!=0;
		num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.masterPrimary = (num & 0x10)==0;
		this.rxlow = (num & 0x40)==0;
		this.ulPAFail = (num & 0x80)!=0;
		this.bandLevel[1] = to_float(parseInt(sr.substr(shift,4),16));shift+=4;
	}
}

function configMaster(){
	this.chEnabled = [];
	this.sqEnabled = false;
	this.simplexEnabled = false;
	this.filteringEnabled = false;
	this.masterMode = 0;
	this.pAEnabled = false;
	
	for (var i=0;i<MAXCHAN;i++)
		this.chEnabled.push(false);

	this.parseConfig = function(sr){
		var shift = 14;
		var num = parseInt(sr.substr(shift,2),16);
		this.filteringEnabled = (num & 0x2)==0;
		this.sqEnabled = (num & 0x10)!=0;
		this.simplexEnabled = (num & 0x04)!=0;
		this.pAEnabled = (num & 0x1)==0;
		this.masterMode = (num & 0x08) ? 2 : (num & 0x20) ? 1 : 0;
		shift = 168;
		num = parseInt(sr.substr(shift,6),16);
		for (var i=0;i<MAXCHAN;i++){			
			this.chEnabled[i] = (num & (1<<i))==0;
		}	
	}
}
function deviceExpansion(ne){
	this.ne = ne;
	this.stat = new monitorExpansion();
	this.parseStatus = function(sr){
		this.stat.parseStatus(sr);
	}
	this.updateUI = function(){
		this.updateUIStatus();
	}
	this.updateUIStatus = function(){
		
	}
}

function deviceRemote(nr){
	this.nr = nr;
	this.stat = new monitorRemote();
	this.cfg = new configRemote();
	this.parseStatus = function(sr){
		this.stat.parseStatus(sr);
	}
	this.parseConfig = function(sr){
		this.cfg.parseConfig(sr);
	}	
	this.updateUI = function(){
		this.updateUIStatus();
	}
	this.updateUIStatus = function(r){
		try{
			DLOutputPowerLedSet(r,this.stat.dlPowAlarm ?"red":"grey");
			ovfLedSet(r, this.stat.overload ? "red" : "grey");
			boardTempLedSet(r, this.stat.tempAlarm ?  "red" : "grey");
			if (this.stat.overload)
				rfInPowSet(r, this.stat.bandLevel, "#df4040");
			else
				rfInPowSet(r, this.stat.bandLevel);		
			agcSet(this.stat.bandLevelOut==-128?0:this.stat.bandAGCOut,r);
			for (var i=0;i<MAXCHAN;i++){
				if (this.stat.chDetSignal[i]!=0 && this.cfg.chEnabled[i]) {
					chSignalLedSet(i+1, r, this.stat.chDetSignal[i]==2 ? "red" : "green");
					chPowerSet(i+1, r, this.stat.chLevel[i]);
				}else{
					chSignalLedSet(i+1, r, "grey");
					chPowerSet(i+1, r, this.stat.chLevel[i], "#bbbbbb");
				}
				if (!this.cfg.filteringEnabled || !this.cfg.chEnabled[i]) 
					chAgcSet(i+1,r,"--", "#bbbbbb");
				else
					chAgcSet(i+1,r,this.stat.chDetSignal[i]==0 && this.cfg.sqEnabled?0:this.stat.chAGC[i]);
			}		
			enHpaLedSet(r, this.stat.pAEnabled? "green" : "red");
			ovfHpaLedSet(r, this.stat.agcFail?  "red" : "grey");
			vswrHpaLedSet(r, this.stat.vswr?  "red" : "grey");
			statHpaLedSet(r, this.stat.commError?  "red" : "grey"); 
			statPAFailLedSet(r, this.stat.dlPAFail?  "red" : "grey"); 
			txLowHpaLedSet(r, this.stat.txLow?  "red" : "grey");
			if (this.stat.tempAlarm)
				boardTempSet(r, this.stat.temp, "#df4040");
			else
				boardTempSet(r, this.stat.temp);
			if (this.stat.dlPowAlarm)
				rfOutPowSet(r, this.stat.bandLevelOut,"#df4040");
			else
				rfOutPowSet(r, this.stat.bandLevelOut);
			setDoorAlarm(r, window.top.NFPAMonitor[r], this.stat.commError, this.stat.doorOpenAvailable, this.stat.doorOpen);			
			plaTimeSet(r,this.stat.plaTime);
			for (var i=0;i<2;i++)
				plaSet(r, i, this.stat.plaLev[i], this.stat.plaAlarm[i]);
			fiberLinkLedSet(r, window.top.stateled[r]==2 ? "red" : (window.top.stateled[r]==1? "yellow" : "green"));
			setFiberNum(r,window.top.NumFiberRemote[this.nr+1]);
			if (this.stat.activeLink1) 
				optActiveLinkSet(r,"green","grey");
			else 
				optActiveLinkSet(r,"grey","green");
			for (i=0;i<2;i++){
				fiberPowerSet(r, i+1, this.stat.rxpow[i]);	
				optRxLedSet(r, i+1, this.stat.lossopt[i]? "red": "green");
				optRxCommLedSet(r, i+1, this.stat.losscom[i]? "red": "green");
				optStatusLedSet(r, i+1, this.stat.fotransc[i]==2? "red" : (this.stat.fotransc[i]==1? "yellow" : "green"));
				if (window.top.master_rx_loss_alarm[r])
					optErrorsSet(r, i+1,"invalid");
				else
					optErrorsSet(r, i+1, this.stat.errors[i]);
			}
		} catch (err) {}
	}
}
function monitorRemote(){
	this.bandLevel = 0;
	this.overload = false;
	this.chLevel = [];
	this.chAGC = [];
	this.chDetSignal = []; //0-no signal, 1-signal, 2-abnormal squelch
	this.bandLevelOut = 0;
	this.bandAGCOut = 0;
	this.dlPAFail = false;
	this.commError = false;
	this.dlPowAlarm = false;
	this.vswr = false;
	this.txLow = false;
	this.agcFail = false;
	this.pAEnabled = false;
	this.temp = 0;
	this.tempAlarm = 0;
	this.doorOpen = false;
	this.doorOpenAvailable = false;
	this.plaLev = [];
	this.plaAlarm = [];
	this.plaTime = 0;
	this.activeLink1 = true;
	this.rxpow=[];
	this.lossopt = [];
	this.losscom = [];
	this.fotransc = [];
	this.errors = [];
	
	for (var i=0;i<2;i++){
		this.plaAlarm.push(false);
		this.plaLev.push(0);
		this.rxpow.push(0);
		this.lossopt.push(false);
		this.losscom.push(false);
		this.fotransc.push(0);	
		this.errors.push(0);	
	}
	for (var i=0;i<MAXCHAN;i++){
		this.chLevel.push(0);
		this.chAGC.push(0);
		this.chDetSignal.push(0);
	}	
	
	this.parseStatus = function(sr) {
		var shift = 4;
		var num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.agcFail = (num & 0x1)!=0;
		this.vswr = (num & 0x4)!=0;
		this.txLow = (num & 0x8)!=0;
		this.commError = (num & 0x10)!=0;
		this.pAEnabled = (num & 0x20)!=0;
		this.dlPAFail = (num & 0x80)!=0;
		this.temp = to_float(parseInt(sr.substr(shift,4),16));shift+=4;
		this.bandLevelOut = to_float(parseInt(sr.substr(shift,4),16));shift+=6;
		num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.doorOpen = (num & 0x4)!=0;
		this.doorOpenAvailable = (num & 0x8)!=0;
		shift=74;
		num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.overload = (num & 0x1)!=0;
		this.tempAlarm = (num & 0x4)!=0;
		this.dlPowAlarm = (num & 0x8)!=0;
		this.plaAlarm[0] = (num & 0x40)!=0;
		this.plaAlarm[1] = (num & 0x80)!=0;
		this.bandLevel = cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
		this.bandAGCOut = cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
		for (var i=0;i<MAXCHAN;i++){
			num = parseInt(sr.substr(shift,2),16);shift+=2;
			this.chDetSignal[i] = (num&0xc0)==0xc0?2:(num&0x80)==0x80?1:0
			this.chLevel[i] = cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
			this.chAGC[i] =  cSignedByte(parseInt(sr.substr(shift,2),16));shift+=2;
		}	
		shift=224;
		this.plaLev[0]=to_float(parseInt(sr.substr(shift,4),16));shift+=4;
		this.plaLev[1]=to_float(parseInt(sr.substr(shift,4),16));shift+=4;
		this.plaTime=(parseInt(sr.substr(shift,4),16));shift+=4;
		num = parseInt(sr.substr(16,2),16) & 0x01;
		this.activeLink1 = num==0;
	}
}
function configRemote(){
	this.pAEnabled = false;
	this.filteringEnabled = false;
	this.sqEnabled = false;
	this.simplexEnabled = false;
	this.chEnabled = [];
	for (var i=0;i<MAXCHAN;i++)
		this.chEnabled.push(false);
	
	this.parseConfig = function(sr) {
		var shift = 6;
		var num = parseInt(sr.substr(shift,2),16);shift+=2;
		this.pAEnabled = (num & 0x1)==0;
		var num = parseInt(sr.substr(shift,2),16);
		this.filteringEnabled = (num & 0x2)==0;
		this.sqEnabled = (num & 0x10)!=0;
		this.simplexEnabled = (num & 0x04)!=0;
		shift = 160;
		num = parseInt(sr.substr(shift,6),16);
		for (var i=0;i<MAXCHAN;i++){			
			this.chEnabled[i] = (num & (1<<i))==0;
		}
	}
}
function monitorExpansion(){
	this.parseStatus = function(sr) {
	}
}
