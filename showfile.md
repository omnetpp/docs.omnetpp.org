---
layout: page
title: File listing
---
<script>
function onSuccess(data) { 
      let pre = $('pre#content')[0];
      // this new element will hold some attributes to aid Rainbow, as well as the snippet content.
      var codeElement = document.createElement('code');
      codeElement.setAttribute('display', 'none'); // so it won't appear unformatted
      codeElement.setAttribute('data-language', this.language); // used by Rainbow
      $(codeElement).text(data); // making sure we escape it
      pre.appendChild(codeElement); // adding the <code> to the DOM


      // And then invoke the highlighter on the containing <pre>.
      // The Rainbow.linenumbers plugin will replace the <code> with a <table>.
      Rainbow.color(pre);
}

document.addEventListener("DOMContentLoaded", function (event) {
    var location = new URL(window.location);
    var url = location.searchParams.get("url");
    var name = url.replace(/.*\//g, ""); // keep only the name part (the one after the last / ) 

    $('h1.page-title').text(name);
    let pre = $('pre#content');
    var language = url.includes(".ned") ? "ned" : url.includes(".xml") ? "xml" : url.includes(".ini") ? "ini" : "generic";
    jQuery.ajax({url: url,
                   language: language, // this is an additonal "parameter" for the onSuccess callback
                   success: onSuccess,
                   error: function() { pre.text('Failed to load '+url)},
                   dataType: "text" });   
});
</script>

<pre id="content" class="snippet">Loading...</pre>
