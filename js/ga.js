var gaProperty = 'UA-58803827-1';

var disableStr = 'ga-disable-' + gaProperty;

// read cookie
if (document.cookie.indexOf(disableStr + '=true') > -1) {
  window[disableStr] = true;
}

// read setting
function hasOptedOut() {
	return window[disableStr] == true;
}


(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', gaProperty, 'auto');
ga('send', 'pageview');


$(document).ready(function() {
   function OptOut() {
      this._optOut = $('#optOut');
      // detect if page has ga-controls
      this._isUsed = this._optOut.html() != null;
      if (this._isUsed == false) {
         return;
      }
      this._tmplIn = $('#optInTemplate').html().trim();
      this._tmplOut = $('#optOutTemplate').html().trim();
   }
   OptOut.prototype.update = function() {
      if (this._isUsed == false) {
         return;
      } 
      if (hasOptedOut()) {
         this._optOut.html(this._tmplOut);
      } else {
         this._optOut.html(this._tmplIn);
      }
   }
	OptOut.prototype.toggle = function() {
	   if (this._isUsed == false) {
         return;
      }
		if (hasOptedOut()) {
			this._optOut.html(this._tmplOut);
			document.cookie = disableStr + '=false; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/';
			window[disableStr] = false;	
   		ga('send', 'event', 'button', 'click', 'optIn');
		} else {
			ga('send', 'event', 'button', 'click', 'optOut');
			this._optOut.html(this._tmplIn);
			document.cookie = disableStr + '=true; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/';
			window[disableStr] = true;
		}
		OptOut.prototype.update.call(this);
	}	
	
	var o = new OptOut();
	o.update();
	$('#optOut').on('click', 'a', function(e){
	   e.preventDefault();
	   console.log(">ga click: " + this);
	   o.toggle();
	});
	
})

