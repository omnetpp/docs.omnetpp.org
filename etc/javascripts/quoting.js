//
// Allows including a line range of a file from HTML. Example:
//
// <pre src="../WirelessA.ned" from="network WirelessA" until="####"></pre>
//
// "from", "until" are regexes that match substring of a line; "from" is inclusive, "until" is exclusive
//
// Returns an object/dictionary/map with two values:
//   startLine - the line number where the returned snippet begins in the whole text (starting from 1 as usual...)
//   snippet   - the actual matched snippet text
var getLines = function(text, from, until) {
    let startLine = 1;
    if (from == null && until == null) {
        return { startLine: 1, snippet: text };
    } else if (from == null) {
        re = new RegExp("()(^[\\s\\S]*?)\n^.*" + until, 'm'); //TODO alert on regex syntax error!
    } else if (until == null) {
        re = new RegExp("([\\s\\S]*?)(^.*" + from + "[\\s\\S]*)", 'm'); //TODO alert on regex syntax error!
    } else {
        re = new RegExp("([\\s\\S]*?)(^.*" + from + "[\\s\\S]*?)\n^.*" + until, 'm'); //TODO alert on regex syntax error!
    }
    matches = text.match(re);

    // Group 1 is the "preface" - everything before the snippet.
    // Group 2 is the snippet itself.
    let snippet = matches ? matches[2] : "!!! No matching lines !!!";
    let preface = matches ? matches[1] : "";
    startLine = preface.split('\n').length;

    return { startLine: startLine, snippet: snippet };
}

var fileLoaded = function(file, data) {
   pres = $('pre[src="' + file + '"]');
   $.each(pres, function(i,pre) {
      excerpt = getLines(data,
                         pre.attributes.from ? pre.attributes.from.value : null,
                         pre.attributes.until ? pre.attributes.until.value : null);

      var language = file.includes(".ned") ? "ned" : file.includes(".xml") ? "xml"
          : file.includes(".ini") ? "ini" : file.includes(".py") ? "python" : "generic";

      // this new element will hold some attributes to aid Rainbow and Rainbow.linenumbers, as well as the snippet content.
      var codeElement = document.createElement('code');
      codeElement.setAttribute('display', 'none'); // so it won't appear unformatted
      codeElement.setAttribute('data-language', language); // used by Rainbow
      codeElement.setAttribute('data-line', excerpt.startLine); // used by Rainbow.linenumbers
      $(codeElement).text(excerpt.snippet); // making sure we escape it
      pre.appendChild(codeElement); // adding the <code> to the DOM

      // And then invoke the highlighter on the containing <pre>.
      // The Rainbow.linenumbers plugin will replace the <code> with a <table>.
      Rainbow.color(pre);
   });
};

document.addEventListener("DOMContentLoaded", function (event) {
   pres = $('pre[src]');
   files = new Set();
   $.each(pres, function(i,pre) {pre.textContent="Loading...\n"; files.add(pre.attributes.src.value); });


   files.forEach(function(file) {
      jQuery.ajax({url: file,
                   success: function(data) { fileLoaded(file, data); },
                   dataType: "text" });
   });
});
