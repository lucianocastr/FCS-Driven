 function Factory(factoryFrame) {
	this.MAX_PWR_DELTA = 7;
	
	//PARÁMETROS GENERALES
	this.numADJFilters 			= 0;
	this.fmodulo				= 0;
	this.fstep					= 0;
	this.fmoduloadj				= 0;
	this.fstepAdj 				= 0;
	this.oscFeatureEnable		= false;
	this.testModeEnable			= false;
	this.extremeTempActionEnable= false;
	this.commonUl				= false;
	this.fiberLoopTestMode		= false;
	this.limitTo32CH			= false;
	this.masterRxLowAlarm		= false;
	this.testPowerLoopMode		= false;
	this.ethernetModuleNotInstalled = false;
	this.ULlowGainMode		= false;
	
	//PARÁMETROS BAND0/1
	this.chBandEnabled			= [true,true]; //read only, activación sección NB band0/1
	this.adjBandEnabled			= [true,true]; //read only, activación sección ADJ band0/1
	this.singleBandEnabled		= [false,false]; //read only, inidica que se está utilizando FW single Band y para qué banda (no pueden estar los 2 activos)
	this.Simplex 				= [false,false];	//Band0/1
	this.agcModeUSA				= [true,true];	//Band0/1
	this.gainBandCorrection		= [0,0,0,0]; //siguiendo mismo orden que levelOffset: B0UL, B0DL, B1UL, B1DL
	this.powerBandCorrection	= [0,0,0,0]; //B0UL, B0DL, B1UL, B1DL
	
	//PARÁMETROS UL/DL
	this.spectrumNormal			= [false,false];	//DAC UL/DL
	this.DACFTW					= [0,0];	//DAC UL/DL
	this.DCOFFSETI				= [0,0];	//Ajuste DC I DAC UL/DL. Renombrar a DCOFFSETI
	this.DCOFFSETQ				= [0,0];	//Ajuste DC Q DAC UL/DL
	this.fdummy					= [0,0];	//UL/DL
	
	//PARAMETERS UL/DL BAND0/1
	this.levelOffset			= [0,0,0,0];
	this.sQOffset				= [0,0,0,0];
	this.gainOffset				= [0,0,0,0];
	this.powerOffset			= [0,0,0,0];
	this.paCurrentMin			= [0,0,0,0];
	this.paCurrentMax			= [0,0,0,0];
	this.attout					= [0,0,0,0];
	this.gainlimit				= [0,0,0,0];
	this.powerlimit				= [0,0,0,0]; 
	this.NCO_Rx					= [0,0,0,0]; 
	this.NCO_Tx					= [0,0,0,0]; 
	this.fstart					= [0,0,0,0]; 
	this.fstop					= [0,0,0,0]; 
	this.fref					= [0,0,0,0]; 
	this.rfoutSpecOffset		= [0,0,0,0]; 
	
	this.uldlFreqSplit			= [0,0]; //fstartDL-fstartUL
	this.frm					= "";
	this.bandNames				=['700MHz Band','800MHz Band'];
	this.BANDNAMELEN = 15;
	
	//PARAMETERS UL/DL BAND0/1
	this.agcThresholdUp		= [0, 0, 0, 0];
	this.agcThresholdDown		= [0, 0, 0, 0];
	this.previsionThresholdUp	= [0, 0];
	this.attInMin	= [0, 0];

	this.POWERTYPE = 0;
	this.CURRENTTYPE = 1;
	
	this.calDlPowerDetector			= [new calDetectorObject(this.POWERTYPE), new calDetectorObject(this.POWERTYPE)];
	this.calPaCurrentDetector		= new calDetectorObject(this.CURRENTTYPE);
	this.calBoardCurrentDetector	= new calDetectorObject(this.CURRENTTYPE);
	this.unusedCoefUlPower 			= 0;
	this.unusedCoefPaCurrentDetector 	= 0;
	this.unusedCoefBoardCurrentDetector 	= 0;
	
	this.relayInstalled				= 0;
	this.relayModeConfiguration 	= 0;
	
	this.parse = function(s) {
		if (s.length<482) return -1; //cambiar longitud
		var i;
		var temp;
		var ind = 0;
		this.frm = s;

		temp= parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (i=0;i<2;i++){
			this.chBandEnabled[i] = (temp & (1<<(2*i)))!=0;
			this.adjBandEnabled[i] = (temp & (1<<(2*i+1)))!=0;
		}
		this.oscFeatureEnable = (temp & 0x10)!=0;
		this.testModeEnable = (temp & 0x80) != 0;
		this.numADJFilters = ((temp & 0x60)>>5)+1;
		
		temp= parseInt(s.substring(ind,ind+2), 16); ind+=2;
		for (i=0;i<2;i++){
			this.spectrumNormal[i] = (temp & (1<<i))!=0;
			this.Simplex[i] = (temp & (1<<(i+2)))!=0;
			this.agcModeUSA[i] = (temp & (1<<(i+4)))!=0;
		}
		this.extremeTempActionEnable = ( temp & 0x40 ) != 0;
		this.commonUl = ( temp & 0x80 ) != 0;
		
		for (i=0;i<2;i++){this.DACFTW[i] = parseInt(s.substring(ind,ind+8), 16); ind+=8;}
		for (i=0;i<2;i++){this.DCOFFSETI[i] = cSignedInt(parseInt(s.substring(ind,ind+4), 16)); ind+=4;}
		for (i=0;i<2;i++){this.DCOFFSETQ[i] = cSignedInt(parseInt(s.substring(ind,ind+4), 16)); ind+=4;}
		for (i=0;i<2;i++){this.fdummy[i] = parseInt(s.substring(ind,ind+4), 16); ind+=4;}
		
		this.fmodulo = parseInt(s.substring(ind,ind+4), 16);  ind+=4;
		this.fstep = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.fmoduloadj = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		this.fstepAdj = parseInt(s.substring(ind,ind+4), 16); ind+=4;
		
		ind=60;
		for (b=0;b<2;b++){
			for (i=0;i<2;i++){this.levelOffset[2*b+i] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;}
			for (i=0;i<2;i++){this.sQOffset[2*b+i] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;}
			for (i=0;i<2;i++){this.gainOffset[2*b+i] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;}
			for (i=0;i<2;i++){this.powerOffset[2*b+i] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;}
			temp= parseInt(s.substring(ind,ind+2), 16); ind+=2;
			this.singleBandEnabled[b] = (temp & 0x1)!=0;
			if (b==0) {
				this.fiberLoopTestMode = (temp & 0x2)!=0;
				this.limitTo32CH = (temp & 0x8)!=0;
				this.testPowerLoopMode = (temp & 0x10)!=0;
				this.ULlowGainMode = (temp & 0x40)!=0;
				this.ethernetModuleNotInstalled = (temp & 0x80)!=0;
			} else {
				this.masterRxLowAlarm = (temp & 0x02) != 0;
			}
			ind+=2;	// byte sin uso provisionalmente
			this.gainBandCorrection[2*b] =  to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
			for (i=0;i<2;i++){this.paCurrentMin[2*b+i] = 10.0*parseInt(s.substring(ind, ind+2), 16); ind+=2;}
			for (i=0;i<2;i++){this.paCurrentMax[2*b+i] = 10.0*parseInt(s.substring(ind, ind+2), 16); ind+=2;}
			for (i=0;i<2;i++){this.attout[2*b+i] = cSignedByte(parseInt(s.substring(ind, ind+2), 16)); ind+=2;}
			for (i=0;i<2;i++){this.powerlimit[2*b+i] = cSignedByte(parseInt(s.substring(ind, ind+2), 16)); ind+=2;}
			for (i=0;i<2;i++){this.gainlimit[2*b+i] = parseInt(s.substring(ind, ind+2), 16); ind+=2;}
			for (i=0;i<2;i++){this.NCO_Rx[2*b+i] = parseInt(s.substring(ind, ind+4), 16); ind+=4;}
			for (i=0;i<2;i++){this.NCO_Tx[2*b+i] = parseInt(s.substring(ind, ind+4), 16); ind+=4;}
			for (i=0;i<2;i++){this.fstart[2*b+i] = parseInt(s.substring(ind, ind+8), 16); ind+=8;}
			for (i=0;i<2;i++){this.fstop[2*b+i] = parseInt(s.substring(ind, ind+8), 16); ind+=8;}
			for (i=0;i<2;i++){this.fref[2*b+i] = parseInt(s.substring(ind, ind+8), 16); ind+=8;}
			for (i=0;i<2;i++){this.rfoutSpecOffset[2*b+i] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;}
		}
		for (b=0;b<2;b++){
			for (var i=0;i<2;i++){
				this.agcThresholdUp[2*b+i] = parseInt(s.substring(ind, ind+2), 16); ind += 2;
				this.agcThresholdDown[2*b+i] = parseInt(s.substring(ind, ind+2), 16); ind += 2;
			}
		}
		for (var i=0;i<2;i++){
			this.previsionThresholdUp[i] = parseInt(s.substring(ind, ind+2), 16); ind += 2;
			this.attInMin[i] = parseInt(s.substring(ind, ind+2), 16); ind += 2;
		}
		this.uldlFreqSplit[0] = this.fstart[1] - this.fstart[0];
		this.uldlFreqSplit[1] = this.fstart[3] - this.fstart[2];
		
		for (var b = 0; b < 2; b++, ind += this.BANDNAMELEN) {
			var name = s.substr(ind, this.BANDNAMELEN);
			this.bandNames[b] = name.trim();
		}

		//calibración nfpa
		for (var b=0;b<2;b++){
			this.calDlPowerDetector[b].parse(s.substr(ind,16)); ind += 16;
			this.powerBandCorrection[2*b] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		}
		for (var b=0;b<2;b++){
			this.gainBandCorrection[2*b+1] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		}
		for (var b=0;b<2;b++){
			this.powerBandCorrection[2*b+1] = to_float(parseInt(s.substring(ind,ind+4),16)); ind+=4;
		}
		this.unusedCoefUlPower = parseInt(s.substr(ind,4), 16); ind+=4;
		this.calPaCurrentDetector.parse(s.substr(ind,16)); ind += 16;
		this.unusedCoefPaCurrentDetector = parseInt(s.substr(ind,4), 16); ind+=4;
		this.calBoardCurrentDetector.parse(s.substr(ind,16)); ind += 16;
		this.unusedCoefBoardCurrentDetector = parseInt(s.substr(ind,4), 16); ind+=4;

		this.relayInstalled = parseInt(s.substr(ind, 2), 16); ind += 2;
		this.relayModeConfiguration = parseInt(s.substr(ind, 2), 16); ind += 2;
		
		//se evita que haya 2 single Bands a true
		if (this.singleBandEnabled[0] && this.singleBandEnabled[1]) this.singleBandEnabled[1] = false;
		//se desactivan las opciones de la single band "inactiva"
		for (var i=0;i<2;i++){
			if (this.singleBandEnabled[i]){
				this.chBandEnabled[1-i] = false;
				this.adjBandEnabled[1-i] = false;
			}
		}
		return 0;
	}
	this.getFrm = function(){
		var cal = "";
		var i,res,mask = 0;

		for (i=0;i<2;i++){
			if (this.chBandEnabled[i]) mask |= 1<<(2*i);
			if (this.adjBandEnabled[i]) mask |= 1<<(2*i+1);
		}
		if (this.oscFeatureEnable) mask |= 0x10;
		if (this.testModeEnable) mask |= 0x80;
		mask |= ((this.numADJFilters-1)<<5)&0x60;
		cal+=hexformat(mask,2);	
		
		mask=0;
		for (i=0;i<2;i++){
			if (this.spectrumNormal[i]) mask |= (1<<i);
			if (this.Simplex[i]) mask |= (1<<(i+2));
			if (this.agcModeUSA[i]) mask |= (1<<(i+4));
		}
		if ( this.extremeTempActionEnable ) {
			mask |= 0x40;
		}
		if (this.commonUl) mask |= 0x80;
		cal+=hexformat(mask,2);	
		
		for (i=0;i<2;i++) cal += hexformat(this.DACFTW[i],8);
		for (i=0;i<2;i++) cal += hexformat(rSignedInt(this.DCOFFSETI[i]),4);
		for (i=0;i<2;i++) cal += hexformat(rSignedInt(this.DCOFFSETQ[i]),4);
		for (i=0;i<2;i++) cal += hexformat(this.fdummy[i],4);
		
		cal += hexformat(this.fmodulo,4);
		cal += hexformat(this.fstep,4);
		cal += hexformat(this.fmoduloadj,4);
		cal += hexformat(this.fstepAdj,4);
		
		for (var b=0;b<2;b++){
			for (i=0;i<2;i++) cal += hexformat(double_to_uint(this.levelOffset[2*b+i]),4);
			for (i=0;i<2;i++) cal += hexformat(double_to_uint(this.sQOffset[2*b+i]),4);
			for (i=0;i<2;i++) cal += hexformat(double_to_uint(this.gainOffset[2*b+i]),4);
			for (i=0;i<2;i++) cal += hexformat(double_to_uint(this.powerOffset[2*b+i]),4);
			mask = 0;
			if (this.singleBandEnabled[b]) mask=0x1;
			if (b==0) {
				if (this.fiberLoopTestMode) mask |= 0x2;
				if (this.limitTo32CH) mask |=0x8;
				if (this.testPowerLoopMode) mask |=0x10;
				if (this.ethernetModuleNotInstalled) mask|=0x80;
				
				if (this.ULlowGainMode) mask|=0x40;
			} else {
				if (this.masterRxLowAlarm) mask |= 0x02;
			}
			cal+=hexformat(mask,2);
			cal+="00";	// byte sin uso provisionalmente
			cal += hexformat(double_to_uint(this.gainBandCorrection[2*b]),4);
			for (i=0;i<2;i++) cal += hexformat((this.paCurrentMin[2*b+i]/10.0),2);
			for (i=0;i<2;i++) cal += hexformat((this.paCurrentMax[2*b+i]/10.0),2);
			for (i=0;i<2;i++) cal += hexformat(rSignedByte(this.attout[2*b+i]),2);	
			for (i=0;i<2;i++) cal += hexformat(rSignedByte(this.powerlimit[2*b+i]),2);
			for (i=0;i<2;i++) cal += hexformat(this.gainlimit[2*b+i],2);
			for (i=0;i<2;i++) cal += hexformat(this.NCO_Rx[2*b+i],4);	
			for (i=0;i<2;i++) cal += hexformat(this.NCO_Tx[2*b+i],4);	
			for (i=0;i<2;i++) cal += hexformat(this.fstart[2*b+i],8);		
			for (i=0;i<2;i++) cal += hexformat(this.fstop[2*b+i],8);	
			for (i=0;i<2;i++) cal += hexformat(this.fref[2*b+i],8);
			for (i=0;i<2;i++) cal += hexformat(double_to_uint(this.rfoutSpecOffset[2*b+i]),4);
		}
		for (var b=0;b<2;b++){
			for (var i=0;i<2;i++) {
				cal += hexformat(this.agcThresholdUp[2*b+i],2);
				cal += hexformat(this.agcThresholdDown[2*b+i],2);
			}
		}
		for (var i=0;i<2;i++) {
			cal += hexformat(this.previsionThresholdUp[i],2);
			cal += hexformat(this.attInMin[i],2);
		}
		for (var b = 0; b < 2; b++) {
			var name = this.bandNames[b];
			for (var i = name.length; i < this.BANDNAMELEN; i++) {
				name += " ";
			}
			cal += name;
		}
		for (var b=0;b<2;b++){
			cal += this.calDlPowerDetector[b].getFrm();
			cal += hexformat(double_to_uint(this.powerBandCorrection[2*b]),4);
		}
		for (var b=0;b<2;b++){
			cal += hexformat(double_to_uint(this.gainBandCorrection[2*b+1]),4);
		}
		for (var b=0;b<2;b++){
			cal += hexformat(double_to_uint(this.powerBandCorrection[2*b+1]),4);
		}
		cal += hexformat(double_to_uint(this.unusedCoefUlPower),4);
		cal += this.calPaCurrentDetector.getFrm();
		cal += hexformat(double_to_uint(this.unusedCoefPaCurrentDetector),4);
		cal += this.calBoardCurrentDetector.getFrm();
		cal += hexformat(double_to_uint(this.unusedCoefBoardCurrentDetector),4);
		
		cal += hexformat(this.relayInstalled,2);
		cal += hexformat(this.relayModeConfiguration,2);
		
		return cal;
	}
	
	if (typeof(factoryFrame) !== 'undefined') {
		this.parse(factoryFrame);
	}
}

function calDetectorObject(type){
	this.type = 0; //0-power,1-current
	this.x = [0,0,0,0]; //lectura a/d (2values) + magnitud (2values)
	
	this.parse = function(s) {
		if (s.length<16) return -1;
		var ind = 0
		var i;
		for (i=0;i<2;i++) { this.x[i] = parseInt(s.substr(ind,4), 16); ind+=4; }
		for (i=0;i<2;i++) {
			if (type==0){
				this.x[i+2] = cSignedInt(parseInt(s.substr(ind,4), 16))/100; ind+=4;
			}else{
				this.x[i+2] = parseInt(s.substr(ind,4), 16); ind+=4;
			}
		}
	}
	this.getFrm = function(){
		var cal = "";
		var i,res,mask = 0;
		for (i=0;i<2;i++) cal += hexformat(this.x[i],4);
		for (i=0;i<2;i++){
			if (type==0){
				res = ~~Math.round(100*this.x[i+2]);
			}else{
				res = this.x[i+2]
			}
			if (res<0) res+=65536;
			cal += hexformat(res,4);
		}
		return cal;
	}
}