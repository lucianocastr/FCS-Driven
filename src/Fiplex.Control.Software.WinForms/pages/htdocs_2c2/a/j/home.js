				  
window.onload = function() {
	load_global();
}
function load_global() {
	$.get( "/global_conf.shtml?c="+Date.now(), function( str ) {
		str = correctASCII(str);
		var srarr = str.split('\t');
		config.parse(srarr[0]);
		factory.parse(srarr[1]);
		version.parse(srarr[5]);
		NFPAcfg.parse(srarr[6]);
	});
}
function load_version(){ //funci?n para evitar que la inactividad del assisted GUI, haga saltar el timeout de password
	$.get( "/versioneth.shtml?c="+Date.now(), function( data ) {});
	setTimeout(function() { load_version(); }, 45000);
}
function load_fact(){ //allows to know license for filter modes
	$.get( "/update_fact.shtml?c="+Date.now(), function( data ) {
		factory.parse(data);
		if (!factory.chBandEnabled[0] && !factory.adjBandEnabled[0]) disableDashButton(2);
		if (!factory.chBandEnabled[1] && !factory.adjBandEnabled[1]) disableDashButton(3);
		if (!factory.adjBandEnabled[0]) disableDashButton(4);
	});
	setTimeout(function() { load_version(); }, 45000);
}
function disableDashButton(index){
	$('#dash'+index+'a').css("backgroundColor", '#808080');
	$('#dash'+index+'b').css("backgroundColor", '#c0c0c0');
}
///funciones marco
function inRange(n, nStart, nEnd)
{
    if(n>=nStart && n<=nEnd) return true;
    else return false;
}

//Temperatura Rango -20ยบ a +90ยบC, <80 verde, 80-85 amarillo, >85 rojo
function setcsstemperature (namectrl, namepgrbar, ctrlvalue)
{
try {
var vmin =-20;
var vmax =90;
var valmaxbarra = (vmax - vmin);
var valamostrar = (ctrlvalue - vmin);
var valenporcent = Math.round(valamostrar * 100 /valmaxbarra);

			if ( inRange($(namectrl).val(), -20, 79) ) 
			{	
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill  prgverde");
					$(namepgrbar).css("width", valenporcent+"%");
			}
			else 
			{
				if ( inRange($(namectrl).val(), 80, 84) ) 
				{	
					$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
					$(namepgrbar).addClass("progress-bar-fill  prgamarilllo");
						$(namepgrbar).css("width", valenporcent+"%");
				}
				else 
				{
					if ( inRange($(namectrl).val(), 84, 500) ) 
					{	
						$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
						$(namepgrbar).addClass("progress-bar-fill  prgrojo");
						if (valenporcent > 91)
						{ $(namepgrbar).css("width", "100%"); }
						else
						{$(namepgrbar).css("width", valenporcent+"%");
						}
						
					}
				}
			}
				
		} catch (e) {
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill ");
				
		}
}
///AGC     Rango 0dB a 60dB, 0-20 verde, 20-40 amarillo, >40 rojo	
function setcssagc (namectrl, namepgrbar, ctrlvalue)
{
try {
var vmin =0;
var vmax =60;
var valmaxbarra = (vmax - vmin);
var valamostrar = (ctrlvalue - vmin);
var valenporcent = Math.round(valamostrar * 100 /valmaxbarra);
			if ( inRange($(namectrl).val(), 0, 19) ) 
			{	
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill  prgverde");
					$(namepgrbar).css("width", valenporcent+"%");
			}
			else 
			{
				if ( inRange($(namectrl).val(), 20, 39) ) 
				{	
					$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
					$(namepgrbar).addClass("progress-bar-fill  prgamarilllo");
						$(namepgrbar).css("width", valenporcent+"%");
				}
				else 
				{
					if ( inRange($(namectrl).val(), 40, 200) ) 
					{	
						$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
						$(namepgrbar).addClass("progress-bar-fill  prgrojo");
						if (valenporcent> 61)
						{ $(namepgrbar).css("width", "100%"); }
						else
						{$(namepgrbar).css("width", valenporcent+"%");
						}
						
					}
				}
			}
				
		} catch (e) {
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill ");
				
		}
}

//RFOUT   Rango 0dBm a 45dBm, por debajo de 37dBm verde, 37-40 amarillo, >40 rojo
function setcssrfout (namectrl, namepgrbar, ctrlvalue)
{
try {

var vmin =0;
var vmax =45;
var valmaxbarra = (vmax - vmin);
var valamostrar = (ctrlvalue - vmin);
var valenporcent = Math.round(valamostrar * 100 /valmaxbarra);
			if ( inRange($(namectrl).val(), 0, 36) ) 
			{	
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill  prgverde");
					$(namepgrbar).css("width", valenporcent+"%");
			}
			else 
			{
				if ( inRange($(namectrl).val(), 37, 40) ) 
				{	
					$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
					$(namepgrbar).addClass("progress-bar-fill  prgamarilllo");
						$(namepgrbar).css("width", valenporcent+"%");
				}
				else 
				{
					if ( inRange($(namectrl).val(), 41, 200) ) 
					{	
						$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
						$(namepgrbar).addClass("progress-bar-fill  prgrojo");
						if (valenporcent > 45)
						{ $(namepgrbar).css("width", "100%"); }
						else
						{$(namepgrbar).css("width", valenporcent+"%");
						}
						
					}
				}
			}
				
		} catch (e) {
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill ");
				
		}
}

///RFIN   Rango -80dBm a 0dBm siempre verde
function setcssrfin (namectrl, namepgrbar, ctrlvalue)
{
try {
var vmin =-80;
var vmax =0;
var valmaxbarra = (vmax - vmin);
var valamostrar = (ctrlvalue - vmin);
var valenporcent = Math.round(valamostrar * 100 /valmaxbarra);
			if ( inRange($(namectrl).val(), -80, 0) ) 
			{	
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill  prgverde");
				$(namepgrbar).css("width", valenporcent+"%");
			}
			else 
			{
				if (valenporcent>100)
				{ valenporcent = 100;
				}
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill  prgamarilllo");
				$(namepgrbar).css("width", valenporcent+"%");
			}
				
		} catch (e) {
				$(namepgrbar).removeClass("prgverde prgamarilllo prgrojo");
				$(namepgrbar).addClass("progress-bar-fill ");
				
		}
}

function buildGUI(arg){
	console.log('buildGUI '+arg);
	dash = false;
	if (arg<=0){
		locurl = 0;
		dash = true;
		try {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
				clearTimeout(tmrIdStat);
			}
		} catch(err) {}
	}	
	else
		locurl = arg;

	$('#dash').css("display",dash?"block":"none");
	$('#container').css("width",(dash?"960px":"1120px"));
	
	$('#div700').hide();
	$('#divspectrum').hide();
	$('#spectrumsettingstab').html('');
	$('#divcomm').hide(); 
	$('#divul').hide(); 
	//$('#divcommw').hide();
	$('#divAlarmStatus').hide();
	$('#divAlarmStatusTab').html('');
	$('#divAlarmSetup').hide();
	$('#divAlarmConfigTab1').html('');
	$('#divAlarmConfigTab2').html('');
	$('#divAlarmConfigTab3').html('');
	$('#divAlarmConfigTab4').html('');
	$('#divAlarmConfigTab5').html('');
	$('#divproyrelated').hide();
	$('#divreports').hide();
	$('#div700b').hide();
	$('#div700b').hide();
	$('#nbinfo').hide();
	$('#div700c').hide();
	$('#stpYes').hide();
	$('#stpNo').hide();
	$('#setupband1').html('Would you like to use Narrow Band or Adj.BW filters?');
	$('#btnA').val('Narrow Band');
	$('#btnB').val('Adj.BW');
	$('#warnpowertr').hide();
	$('#classnotlic').hide();
	$('#warnmess').html('');
	$('#confirmClass').show();
	$('#progcommbs').html('');
	$('#poutlow0').hide();
	$('#poutlow1').hide();
	$('#poutlow2').hide();
	$('#bsApplyButton').hide();
	$('#poutBand14warning').hide();
	$('#commbs2').css("color","black");
	$('#commbs3').css("color","black");
	$('#smartwizard_al').smartWizard("reset");
	$('#band14warn').hide();
	
	firstnet=false;
	wtGui.monitoring = false;
	initAlarmConfig = false;
	
	for (var k=1;k<=6;k++)
		showResultIcon(ERR_NONE,k);

	
	firstnet=false;
	
	if (locurl==2){ //700
		bandGUI=0;
		$('#titleband').html('700 BAND');
		$('#div700').show("swing");
		if(!factory.chBandEnabled[0] && !factory.adjBandEnabled[0]){
			$('#div700a').hide();
			$('#div700b').show();
			$('#setupband').hide();
			$('#confirmClass').hide();
			$('#licmess').html('A license upgrade is required to unlock 700MHz Band');
			$('#nbinfo').hide();
			$('#classnotlic').show("swing");
		}else{
			$('#div700a').show();
			$('#smartwizard').smartWizard("reset");
			$('#setupband').html('Setup 700 MHz Band?');
			$('#setupband').show();
		}
	}
	if (locurl==3){ //800
		bandGUI=1;
		$('#titleband').html('800 BAND');
		$('#div700').show("swing");
		if(!factory.chBandEnabled[1] && !factory.adjBandEnabled[1]){
			$('#div700a').hide();
			$('#div700b').show();
			$('#setupband').hide();
			$('#confirmClass').hide();
			$('#licmess').html('A license upgrade is required to unlock 800MHz Band');
			$('#nbinfo').hide();
			$('#classnotlic').show("swing");
		}else{
			$('#div700a').show();
			$('#smartwizard').smartWizard("reset");
			$('#setupband').html('Setup 800 MHz Band?');
			$('#setupband').show();
		}
	}
	if (locurl==4){ //band14
		bandGUI=0;
		firstnet=true;
		$('#titleband').html('BAND 14');
		$('#div700').show("swing");
		if (!factory.adjBandEnabled[0]){
			$('#div700a').hide();
			$('#div700b').show();
			$('#setupband').hide();
			$('#confirmClass').hide();
			$('#licmess').html('A license upgrade is required to unlock BAND14');
			$('#nbinfo').hide();
			$('#classnotlic').show("swing");
		}else{
			$('#div700a').show();
			$('#smartwizard').smartWizard("reset");
			$('#setupband').html('Setup Band 14?');
			$('#setupband').show();
		}
	}	
	if (locurl==9){ //spectrum
		$('#divspectrum').show("swing");
		
	}
	if (locurl==10){ //reports
		$('#divreports').show("swing");
	}
	if (locurl==6){ //ul adjustment
		$('#divul').show();
		$('#smartwizardul').smartWizard("reset");
		$('#cellUlResult2').html('<img src="/i/blank.gif" width="45" height="45" id="cmdResult">');
		waitIcon = new MovingIcon(document.getElementById("cmdResult"));
		$('.toolbar-bottom').hide();
	}
	if (locurl==7){ //commissioning
		
		$('#divcomm').show();
		//$('#divcommw').show("swing");
		$('#smartwizardc').smartWizard("reset");
	}
	if (locurl==1){ //project related
		$('#divproyrelated').show("swing");
	}
	if (locurl==8){ //alarmstat
		$('#divAlarmStatus').show("swing");
		$('#divAlarmStatusTab').append(pageAst.createAlarmStatusTable());
	}
	if (locurl==5){ //alarmconfig
		pageAst.redrawAlarmConfig();
		$('#divAlarmConfigTab1').append(pageAst.createRelayConfigTable());
		$('#divAlarmConfigTab3').append(pageAst.createOscDetectionTable());
		$('#divAlarmConfigTab4').append(pageAst.createAutoUlPaOffTable());
		$('#divAlarmConfigTab5').append(pageAst.createExtremeTempTable());
		$('#divAlarmSetup').show("swing");
	}

	//antiguo codigo de window.onload()
	indexHome = 0;
	loadpage();
	initSpectrum();
	
	$("#btnsaveproyr").click(function() {
		if (waitAns) return;
		waitAns = true;
		var strToSend = '';
		var spaces = '';
		var k;
		for (k=0;k<100;k++) spaces+=' ';
		for (k=0;k<7;k++){
			strToSend += ($("#prjinfo_"+k).val()+spaces).substr(0,95);
		}
		strToSend += ($("#prjinfo_"+7).val()+spaces).substr(0,35);
		strToSend += ($("#prjinfo_"+8).val()+spaces).substr(0,30);
		strToSend = formatProjConfig(strToSend);
		showResultIcon(ERR_PENDING,indexHome);
		$("#proj_str").val(strToSend);
		$.post( "home.html", { proj_str: strToSend}).done(function( data ) {
			n_retry=0;
			if (!dash) setTimeout(function() { check_result(); }, 100);
		});
	});

	$('#smartwizard').smartWizard({
	  selected: 0, // Initial selected step, 0 = first step
	  theme: 'arrows', // theme for the wizard, related css need to include for other than default theme
	  justified: true, // Nav menu justification. true/false
	  autoAdjustHeight: true, // Automatically adjust content height
	  cycleSteps: false, // Allows to cycle the navigation of steps
	  backButtonSupport: true, // Enable the back button support
	  enableURLhash: false, // Enable selection of the step based on url hash
	  transition: {
		  animation: 'none', // Effect on navigation, none/fade/slide-horizontal/slide-vertical/slide-swing
		  speed: '400', // Transion animation speed
		  easing:'' // Transition animation easing. Not supported without a jQuery easing plugin
	  },
	   keyboardSettings: {
		  keyNavigation: true, // Enable/Disable keyboard navigation(left and right keys are used if enabled)
		  keyLeft: [37], // Left key code
		  keyRight: [39] // Right key code
	  },
	  lang: { // Language variables for button
		  next: 'Next',
		  previous: 'Previous'
	  },
	  disabledSteps: [], // Array Steps disabled
	  errorSteps: [], // Highlight step with errors
	  hiddenSteps: [] // Hidden steps

	});
	$('#smartwizardc').smartWizard({
	  selected: 0, // Initial selected step, 0 = first step
	  theme: 'arrows', // theme for the wizard, related css need to include for other than default theme
	  justified: true, // Nav menu justification. true/false
	  autoAdjustHeight: true, // Automatically adjust content height
	  cycleSteps: false, // Allows to cycle the navigation of steps
	  backButtonSupport: true, // Enable the back button support
	  enableURLhash: false, // Enable selection of the step based on url hash
	  transition: {
		  animation: 'none', // Effect on navigation, none/fade/slide-horizontal/slide-vertical/slide-swing
		  speed: '400', // Transion animation speed
		  easing:'' // Transition animation easing. Not supported without a jQuery easing plugin
	  },
	   keyboardSettings: {
		  keyNavigation: true, // Enable/Disable keyboard navigation(left and right keys are used if enabled)
		  keyLeft: [37], // Left key code
		  keyRight: [39] // Right key code
	  },
	  lang: { // Language variables for button
		  next: 'Next',
		  previous: 'Previous'
	  },
	  disabledSteps: [], // Array Steps disabled
	  errorSteps: [], // Highlight step with errors
	  hiddenSteps: [] // Hidden steps

	});
	
	$('#smartwizard_al').smartWizard({
	  selected: 0, // Initial selected step, 0 = first step
	  theme: 'arrows', // theme for the wizard, related css need to include for other than default theme
	  justified: true, // Nav menu justification. true/false
	  autoAdjustHeight: true, // Automatically adjust content height
	  cycleSteps: false, // Allows to cycle the navigation of steps
	  backButtonSupport: true, // Enable the back button support
	  enableURLhash: false, // Enable selection of the step based on url hash
	  transition: {
		  animation: 'none', // Effect on navigation, none/fade/slide-horizontal/slide-vertical/slide-swing
		  speed: '400', // Transion animation speed
		  easing:'' // Transition animation easing. Not supported without a jQuery easing plugin
	  },
	   keyboardSettings: {
		  keyNavigation: true, // Enable/Disable keyboard navigation(left and right keys are used if enabled)
		  keyLeft: [37], // Left key code
		  keyRight: [39] // Right key code
	  },
	  lang: { // Language variables for button
		  next: 'Next',
		  previous: 'Previous'
	  },
	  disabledSteps: [], // Array Steps disabled
	  errorSteps: [], // Highlight step with errors
	  hiddenSteps: [] // Hidden steps

	});
	$('#smartwizardul').smartWizard({
	  selected: 0, // Initial selected step, 0 = first step
	  theme: 'arrows', // theme for the wizard, related css need to include for other than default theme
	  justified: true, // Nav menu justification. true/false
	  autoAdjustHeight: true, // Automatically adjust content height
	  cycleSteps: false, // Allows to cycle the navigation of steps
	  backButtonSupport: true, // Enable the back button support
	  enableURLhash: false, // Enable selection of the step based on url hash
	  transition: {
		  animation: 'none', // Effect on navigation, none/fade/slide-horizontal/slide-vertical/slide-swing
		  speed: '400', // Transion animation speed
		  easing:'' // Transition animation easing. Not supported without a jQuery easing plugin
	  },
	   keyboardSettings: {
		  keyNavigation: true, // Enable/Disable keyboard navigation(left and right keys are used if enabled)
		  keyLeft: [37], // Left key code
		  keyRight: [39] // Right key code
	  },
	  lang: { // Language variables for button
		  next: 'Next',
		  previous: 'Previous'
	  },
	  disabledSteps: [], // Array Steps disabled
	  errorSteps: [], // Highlight step with errors
	  hiddenSteps: [] // Hidden steps

	});
}

$(document).ready(function(){
	buildGUI(0);
});
$("#smartwizard").on("leaveStep", function(e, anchorObject, stepNumber, stepDirection) {
	if (stepNumber==2 && stepDirection.search("forward")>=0){
		waitAns = true;
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(config.frm); 
		var ret = pageAst.readFreqs(cnfToSend,bandGUI,nbadjGUI);
		if (ret.length>0){
			var t,c,r;
			var y0 =$("#warningTable").height();
			var y1 = $("#tb2").height();
			$('#warningTable').html('');
			t = $('<table/>').css("width","100%");
			r = $('<tr/>');t.append(r);
			c = $('<td/>',{class:"contentcell"});r.append(c);
			e = $('<i/>').prop("src","/i/warning.png").css("margin","5px");c.append(e);
			c = $('<td/>',{class:"contentcell"});r.append(c);
			c.html(ret);
			$('#warningTable').append(t);
			var y2 =$("#warningTable").height();
			$("#tb2").css("height", y1+y2-y0);
		}
		return ret.length==0;
	}else{
		return true;
	}
});
$("#smartwizardc").on("leaveStep", function(e, anchorObject, stepNumber, stepDirection) {
	if ((stepNumber<=2) && stepDirection.search("forward")>=0){
		waitAns = true;
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(config.frm); 
		var ret = pageAst.readControlChannel(cnfToSend,stepNumber==1?0:1);
		$('.toolbar-bottom').hide();
		return true;
	}
});
function m700setp1(resultstep)
{
	if (firstnet && resultstep=='Y'){
		$('#div700a').hide();
		$('#div700b').show();
		$('#confirmClass').hide();
		m700setp2('A'); //go directly to band 14 configuration
		return;
	}
	if (firstnet && resultstep=='N' && !config.firstADJisFirstNet){
		mode2ndq = false;
		m700setp2('A'); //simulate click on retain button
		return;
	}
	mode2ndq = true;
	if (resultstep=='N')
	{
		mode2ndq = false;
		$('#setupband1').html('Do you want to retain the current configuration or shut down this band?');
		$('#btnA').val('Retain');
		$('#btnB').val('Shut down');
	}else
		$('#nbinfo').show();
	$('#div700b').show();
	$('#div700a').hide();
}
function m700setp2(resultstep){
	mode2ndq?filtconf(resultstep):filtexit(resultstep);
}
function filtexit(resultstep){
	if (resultstep=='B'){
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(config.frm);
		if (firstnet){
			cnfToSend.firstADJisFirstNet = false;
			cnfToSend.filterEnabled[1][0][0][0] = false;
			cnfToSend.filterEnabled[1][0][1][0] = false;
			if (numEnabledFilts(0,0)==0 && !config.filterEnabled[1][0][0][1]){
				cnfToSend.paEnabled[0][0] = false;
				cnfToSend.paEnabled[0][1] = false;
				cnfToSend.forcePaOff[0][0] = true;
				cnfToSend.forcePaOff[0][1] = true;
			}
		}else{
			for (var i=0;i<config.CHNR;i++){
				cnfToSend.filterEnabled[0][bandGUI][0][i] = false;
				cnfToSend.filterEnabled[0][bandGUI][1][i] = false;
			}
			var ini = 0;
			if (bandGUI==0 && config.firstADJisFirstNet) ini=1;
			for (var i=ini;i<factory.numADJFilters;i++){
				cnfToSend.filterEnabled[1][bandGUI][0][i] = false;
				cnfToSend.filterEnabled[1][bandGUI][1][i] = false;
			}
			if (bandGUI==1){
				cnfToSend.paEnabled[1][0] = false;
				cnfToSend.paEnabled[1][1] = false;
				cnfToSend.forcePaOff[1][0] = true;
				cnfToSend.forcePaOff[1][1] = true;
			}else{
				if (!(config.firstADJisFirstNet && config.filterEnabled[1][0][0][0])){
					cnfToSend.paEnabled[0][0] = false;
					cnfToSend.paEnabled[0][1] = false;
					cnfToSend.forcePaOff[0][0] = true;
					cnfToSend.forcePaOff[0][1] = true;
				}
			}
		}
		$("#ctl_conf_str").val(cnfToSend.getFrm());
		$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
		n_retry=0;
		if (!dash) setTimeout(function() { check_result(WAITINGACKCONF); }, 1000);
		});
	}
	buildGUI(0);
}
function filtconf(resultstep)
{
	if (firstnet){
		var enableFn = (resultstep=='A');
		nbadjGUI = 1;
		if (!factory.adjBandEnabled[bandGUI]){
			$('#confirmClass').hide();
			$('#licmess').html('A license upgrade is required to unlock Adj.BW filter for '+(bandGUI==0?'700':'800')+' Band');
			$('#nbinfo').hide();
			$('#classnotlic').show("swing");
			return;
		}
		waitAns = true;
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(config.frm);
		var ret = pageAst.readFreqs(cnfToSend,bandGUI,nbadjGUI,enableFn);
		if (ret.length==0){
			if (enableFn){
				$('#smartwizard').smartWizard("reset");
				$('#div700b').hide();
				$('#div700c').show();
			}
			t = $('#step-4t');
			t.html('');
			r = $('<tr/>');t.append(r);
			c = $('<td/>',{class:"contentcell"}).css("minHeight","50px");r.append(c);
			c.append($(pageAst.createRSSIFilterTables(bandGUI,nbadjGUI,1)));
			$('#step-4h').html('Programming filters ...');
			pageAst.clearFreqs(bandGUI,nbadjGUI);
			$('.toolbar-bottom').hide();
			if (config.compare(cnfToSend)>=0){
				$("#ctl_conf_str").val(cnfToSend.getFrm());
				$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
				n_retry=0;
				if (!dash) setTimeout(function() { check_result(WAITINGACKCONF); }, 1000);
				});
			}else{
				showStep4();
			}

		}else{
			var t,c,r,e;
			$('#warnmess').html('');
			t = $('<table/>').css("width","100%");
			r = $('<tr/>');t.append(r);
			c = $('<td/>',{class:"contentcell"});r.append(c);
			e = $('<i/>').prop("src","/i/warning.png").css("margin","5px");c.append(e);
			c = $('<td/>',{class:"contentcell"});r.append(c);
			c.html(ret);
			$('#warnmess').html(t);
			return;
		}
		if (!enableFn){
			buildGUI(0);
			return;
		}
	}else{
		if (resultstep=='A'){
			nbadjGUI = 0;
			if (!factory.chBandEnabled[bandGUI]){
				$('#confirmClass').hide();
				$('#licmess').html('A license upgrade is required to unlock Narrow Band filter for '+(bandGUI==0?'700':'800')+' Band');
				$('#nbinfo').hide();
				$('#classnotlic').show("swing");
				return;
			}
		}
		if (resultstep=='B'){
			nbadjGUI = 1;
			if (!factory.adjBandEnabled[bandGUI]){
				$('#confirmClass').hide();
				$('#licmess').html('A license upgrade is required to unlock Adj.BW filter for '+(bandGUI==0?'700':'800')+' Band');
				$('#nbinfo').hide();
				$('#classnotlic').show("swing");
				return;
			}
		}
	}
	pageAst.refreshSquelch(bandGUI,nbadjGUI);
	initNumChSel(bandGUI,nbadjGUI);
	redrawSmartWizard(nbadjGUI,firstnet,bandGUI);
	if (!firstnet){
		$('#div700b').hide();
		$('#div700c').show();
		$('#smartwizard').smartWizard("reset");
	}
	$('.toolbar-bottom').show("swing");
	
}
function redrawSmartWizardC(){
	var nA,nB;
	nA = numEnabledFilts(0,0);
	nB = numEnabledFilts(0,1);
	if((!factory.chBandEnabled[0] && !factory.adjBandEnabled[0]) || ((nA==0)&&(nB==0)))
		$('#smartwizardc').smartWizard("stepState", [1], "disable");
	nA = numEnabledFilts(1,0);
	nB = numEnabledFilts(1,1);
	if((!factory.chBandEnabled[1] && !factory.adjBandEnabled[1]) || ((nA==0)&&(nB==0)))
		$('#smartwizardc').smartWizard("stepState", [2], "disable");	
}
function redrawSmartWizard(na,fn,bandGUI){
	//na: 0-user chose narrow band configuration, 1- user chose adj.bw
	//fn: if true user clicked the BAND 14 button
	//band GUI: 0-700 (user clicked on 700MHz button) 1-800 (user clicked on 800MHz button)
	if (fn){ //band14
		for (var k=1;k<=3;k++){
			$('#navs'+k).hide();
			$('#smartwizard').smartWizard("stepState", [k-1], "hide");
			$('#smartwizard').smartWizard("stepState", [k], "enable");
		}
		$("#smartwizard").smartWizard("goToStep",3);
		for (var k=4;k<=7;k++)
			$('#stp'+k).html('Step '+(k-3));
	} else {
		for (var k=1;k<=3;k++){
			$('#navs'+k).show();
			$('#smartwizard').smartWizard("stepState", [k-1], "show");
		}
		for (var k=1;k<=7;k++){
			$('#stp'+k).html('Step '+k);
		}
		if (na==1){
			if (bandGUI==0 && config.firstADJisFirstNet && config.filterEnabled[1][0][0][0] && !config.filterEnabled[1][0][0][1]) $('#band14warn').show();
			$('#navs2').hide();
			$('#smartwizard').smartWizard("stepState", [1], "hide");
			for (var k=3;k<=7;k++){
				$('#stp'+k).html('Step '+(k-1));
			}
		}
	}
}
 function active_step(idquanitych)
 {		
		$('#idcuantoch').val(idquanitych);
		$('.toolbar-bottom').show("swing");
 }
function runcomm(){
	$('#commt').css("display","table");
	$('#progcomm').html('');
	showResultIcon(ERR_PENDING,indexHome);
	$('#comm1').css("color","red");
	cnfToSend = new ConfigBDA();
	cnfToSend.parse(config.frm); 
	cnfToSend.runIsolationMeas[0]=true;
	cnfToSend.forceDLMaxGain=false;
	$("#ctl_conf_str").val(cnfToSend.getFrm());
	$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
		n_retry=0;
		if (!dash) setTimeout(function() { check_result(COMMISSIONING); }, 1000);
	});
}
 function runcomm2(){
	$('#comm2').css("color","red");
	commissioning = true;
	statCount = 0;
	rssiComm = [-140,-140,-140];
	signalComm = [false,false,false];
	$('#progcomm').html('(0/'+NUMCOMMMEAS+' measures)');
	load_status();
 }
 function runcomm3(){
	setGainAndDisplayCommResults();
	showResultIcon(ERR_OK,indexHome);
	if (!dash) setTimeout(function() {
		showResultIcon(ERR_NONE,indexHome);
		$("#smartwizardc").smartWizard("goToStep",4);
	}, 2000);
 }
 function active_step2(idbw)
 {
	$('#classBnot').css("display",idbw>75?"table-cell":"none");
	var num = $('#idcuantoch').val();
	var t,c,r;
	t = $('#step-3t');
	t.html('');
	r = $('<tr/>');t.append(r);
	c = $('<td/>',{class:"contentcell"}).css("minHeight","50px");r.append(c);
	c.append($(pageAst.createFilterTables(bandGUI,nbadjGUI,num,true)));
	t = $('#step-4t');
	t.html('');
	r = $('<tr/>');t.append(r);
	c = $('<td/>',{class:"contentcell"}).css("minHeight","50px");r.append(c);
	c.append($(pageAst.createRSSIFilterTables(bandGUI,nbadjGUI,num)));
	$('.sw-btn-next').removeClass('disabled');
 }
function active_comm_step12(band){
	var t,c,r,k;
	var n;
	for (k=0;k<2;k++){
		n = numEnabledFilts(band,k);
		if (n>0){
			t = $('#step-'+(band+2)+'ct'+k);
			t.html('');
			r = $('<tr/>');t.append(r);
			c = $('<td/>',{class:"contentcell"}).css("minHeight","50px");r.append(c);
			c.append($(pageAst.createFilterTables(band,k,n,false)));
		}
	}
	$('.toolbar-bottom').show();
}

$("#smartwizardc").on("stepContent",function(e, anchorObject, stepIndex, stepDirection) {
	console.log(stepIndex);
	stepc = stepIndex;
	if (stepIndex == 1){
		active_comm_step12(0);
		active_comm_step12(1);//se deja lista la tabla del siguiente step
	}
	if (stepIndex == 2 || stepIndex == 3){
		if(stepDirection.search("forward")>=0 && config.compare(cnfToSend)>=0){
			$("#ctl_conf_str").val(cnfToSend.getFrm());
			$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
				n_retry=0;
				if (!dash) setTimeout(function() { check_result(WAITINGACKCCH); }, 1000);
			});
			$('#btnrun').hide();
	
		}else{
			active_comm_step12(0);
			active_comm_step12(1);
		}
	}
	if (stepIndex == 3){
		$('.sw-btn-next').addClass('disabled');
		$('.toolbar-bottom').hide();
		$('#commt').css("display","none");
		$('#comm1').css("color","black");
		$('#comm2').css("color","black");
		$('#comm3').css("color","black");
	}
		
	
	if (stepIndex == 4){
		$('.toolbar-bottom').show();
	}
});
$("#smartwizardul").on("leaveStep", function(e, anchorObject, stepNumber, stepDirection) {
	if (stepNumber==1 && stepDirection.search("backward")>=0){
		redrawBSTable(false);
		wtGui.monitoring = false;
	}
});
 $("#smartwizardul").on("stepContent",function(e, anchorObject, stepIndex, stepDirection) 
 {		$('#cellUlResult2').html('');
		$('#cellUlResult3').html('');
  		if (stepIndex == 0){
			$('#cellUlResult2').html('<img src="/i/blank.gif" width="45" height="45" id="cmdResult">');
			waitIcon = new MovingIcon(document.getElementById("cmdResult"));
			redrawBSTable(false);
			if (stepDirection.search("forward")>=0){
				$('.toolbar-bottom').hide();
			}
		}
		if (stepIndex == 1){
			$('#cellUlResult3').html('<img src="/i/blank.gif" width="45" height="45" id="cmdResult">');
			waitIcon = new MovingIcon(document.getElementById("cmdResult"));
			wtGui.monitoring = true;
			wtGui.create();
		}
 });
 $("#smartwizard_al").on("stepContent",function(e, anchorObject, stepIndex, stepDirection) {
		$('#cellResult2').html('');
		$('#cellResult3').html('');
		$('#cellResult6').html('');
 		if (stepIndex == 1){
			$('#cellResult2').html('<img src="/i/blank.gif" width="45" height="45" id="cmdResult4">');
			waitIcon = new MovingIcon(document.getElementById("cmdResult4"));
			if(stepDirection.search("forward")>=0){
				$('.toolbar-bottom').hide();
			}
		}
		if (stepIndex == 2){
			$('#cellResult3').html('<img src="/i/blank.gif" width="45" height="45" id="cmdResult4">');
			waitIcon = new MovingIcon(document.getElementById("cmdResult4"));
		}
		if (stepIndex == 5){
			$('#cellResult6').html('<img src="/i/blank.gif" width="45" height="45" id="cmdResult4">');
			waitIcon = new MovingIcon(document.getElementById("cmdResult4"));
		}
		
});
 $("#smartwizard").on("stepContent",function(e, anchorObject, stepIndex, stepDirection) {
 	$('#smartwizard').smartWizard("stepState", [2], "disable");
	$('#smartwizard').smartWizard("stepState", [3], "disable");
	$('#smartwizard').smartWizard("stepState", [4], "disable");
	$('#smartwizard').smartWizard("stepState", [5], "disable");
	$('#smartwizard').smartWizard("stepState", [6], "disable");
	clearTimeout(tmrIdStat);

		$('#smartwizard').smartWizard("stepState", [2], "enable");
		if (firstnet) $('#smartwizard').smartWizard("stepState", [3], "enable");
		$('.sw-btn-next').removeClass('disabled');

		console.log('stepIndex='+stepIndex);

		if (stepIndex == 2){
			$('#smartwizard').smartWizard("stepState", [2], "enable");
			$('#smartwizard').smartWizard("stepState", [3], "enable");
			$('.sw-btn-next').removeClass('disabled');
			active_step2($('#idbw').val());
			$('#warningTable').html('');
		}
		
		if (stepIndex == 3)
		{
			if(stepDirection.search("forward")>=0 && config.compare(cnfToSend)>=0){
				if (!firstnet){
					$("#ctl_conf_str").val(cnfToSend.getFrm());
					$.post( "home.html", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
						n_retry=0;
						if (!dash) setTimeout(function() { check_result(WAITINGACKCONF); }, 1000);
					});
					$('#step-3t').html('');
					$('#step-4h').html('Programming filters ...');
					pageAst.clearFreqs(bandGUI,nbadjGUI);
					$('.toolbar-bottom').hide();
				}
			}else{
				showStep4();
			}
		}
		if (stepIndex == 4)
		{
			$('#smartwizard').smartWizard("stepState", [3], "enable");
			$('#smartwizard').smartWizard("stepState", [4], "enable");
			$('#smartwizard').smartWizard("stepState", [5], "enable");
			$('.sw-btn-next').removeClass('disabled');
		}
		if (stepIndex == 5)
		{
			$('#smartwizard').smartWizard("stepState", [3], "enable");
			$('#smartwizard').smartWizard("stepState", [4], "enable");
			$('#smartwizard').smartWizard("stepState", [5], "enable");
			$('#smartwizard').smartWizard("stepState", [6], "enable");
			$('.sw-btn-next').removeClass('disabled');
			if (bandGUI==0 && pageAst.checkFirstNetAndFilters()){
				$('#warnpowertr').show("swing");
				if (firstnet){
					$('#warnpower').html("There are enabled narrow band filters. Take into account that output power " +
					"will be shared between Band 14 Filter and these narrow band filters (one half for Band 14 Filter and the other half for narrow band filters)," +
					"because both bands are sharing the power amplifier");
				}
			}
		}
		if (stepIndex == 6)
		{
			$('#smartwizard').smartWizard("stepState", [3], "enable");
			$('#smartwizard').smartWizard("stepState", [4], "enable");
			$('#smartwizard').smartWizard("stepState", [5], "enable");
			$('#smartwizard').smartWizard("stepState", [6], "enable");
			$('#smartwizard').smartWizard("stepState", [7], "enable");
			$('.sw-btn-next').removeClass('disabled');
		}		
		
		
});


function showStep4(){
	pageAst.refreshFreqs(bandGUI,nbadjGUI);
	$('#step-4h').html('Filter frequencies has been programmed. Check RSSI');
	$('#smartwizard').smartWizard("stepState", [3], "enable");
	$('#smartwizard').smartWizard("stepState", [4], "enable");
	$('.toolbar-bottom').show("swing");
	$('.sw-btn-next').removeClass('disabled');
	load_status();
	
}
function redrawBSTable(show){
	var y1 = $("#bs700params").height();
	var y2 = $("#bsComputeTable").height();
	$("#tb3").css("height", y1+y2);
	if (show) $('.toolbar-bottom').show();
}
function redrawWTTable(){
	var y = $("#bswarning2").height();
	y += $("#wtButtonsTable").height();
	y += $("#walkthroughparams").height();
	y += $("#wtWarningTable").height();
	y += $("#wtApplyTable").height();
	$("#tb3").css("height", y);
}