imageFullSizeZoom = function(img){
    img = $(img);
    let fullSizeSrc = img.attr('src').replace(/.thumb.jpg$/, '.png');

    $(document.body).append(
      '<div class="fullscreenimgshade" onclick="$(this).remove();">' +
        '<img src="' + fullSizeSrc + '" class="fullscreenimg"/>' +
      '</div>'
    );
};
