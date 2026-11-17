(function(){
 var panel=document.getElementById('startup-status'),message=document.getElementById('startup-message'),failed=false;
 function hide(){if(window.__XIYUAN_READY__&&panel)panel.hidden=true;}
 function problem(){if(window.__XIYUAN_READY__||failed)return;failed=true;if(panel){panel.hidden=false;message.textContent='暂时未能进入，请重新加载。原来的文明进度不会被清除。';document.getElementById('startup-retry').hidden=false;}}
 document.getElementById('startup-retry').onclick=function(){var url=new URL(location.href);url.searchParams.set('reload',String(Date.now()));location.replace(url.href);};
 window.addEventListener('error',function(event){if(event.error||event.target&&event.target.tagName==='SCRIPT')problem();},true);
 window.addEventListener('unhandledrejection',problem);window.addEventListener('xiyuan-ready',hide);window.addEventListener('load',hide);setTimeout(function(){if(!window.__XIYUAN_READY__)problem();},12000);
})();
