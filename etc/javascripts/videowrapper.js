// iterates on every video element in the document, wraps each of them in a div
// of class stretchy-video wrapper, with a custom tailored style attribute,
// so the controls are not covering the video. only tested in Chrome.
// if the video metadata is available on DOMContentLoaded, this is done
// right away, otherwise an event handler for the onmetadataloaded
// event is added, and the wrapping is done once that event fires.

const controlsHeight = 39; // in pixels

function wrapVideoElement(element) {

  let videoWidthPercent = 95; // percent if the viewportr, does not stretch, only makes smaller

  let styleString =  "margin-top: -" + controlsHeight + "px; width: 100%;"
    + "padding-bottom: calc(" + element.videoHeight + " / " + element.videoWidth + " * 100% + " + (2 * controlsHeight) + "px);";

  // console.log("wrapping with size " + element.videoWidth + "x" + element.videoHeight);

  // this div is to enforce a video size with a fixed aspect ratio, and to make the controls appear below the video - not covering it
  $(element).wrap("<div class='stretchy-video-wrapper' style='" + styleString + "'></div>");

  // this div is to prevent displaying the video in a larger size than it really is, and to constrain it to remain in the viewport
  $(element).parent().wrap("<div style='margin:auto; overflow:hidden; max-width:" + element.videoWidth + "px; width:" + videoWidthPercent + "%;'></div>");

  element.play();
}

document.addEventListener("DOMContentLoaded", function(event) {

  $("video").each(function() { // TODO filter for a special class?
    if (this.videoWidth > 0 && this.videoHeight > 0) {
      // console.log("could wrap right away, with size " + this.videoWidth + "x" + this.videoHeight);
      wrapVideoElement(this); // 'this' is the video element
    } else {
      // console.log('added event handler to wrap');
      this.onloadedmetadata = function(event) { wrapVideoElement(event.target); };
    }
  });

});
