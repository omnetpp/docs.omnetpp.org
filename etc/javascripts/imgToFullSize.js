imageFullSizeZoom = function(img){
img = $(img);

$(document.body).append('<div style="cursor:zoom-out;position:fixed;left:0;right:0;top:0;bottom:0;z-index:6969;background:rgba(0,0,0,.5);text-align:center" onclick="$(this).remove();"><img src="' + img.attr('src') + '" style="max-width:100%;max-height:100%" />');

};
