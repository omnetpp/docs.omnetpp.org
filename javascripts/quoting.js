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
var getLines = function(text, after, from, until, upto, comment) {

    let startPattern = from == null ? after : from;
    let isStartInclusive = from != null;

    let endPattern = until == null ? upto : until;
    let isEndInclusive = upto != null;

    if (startPattern == null) {
        startPattern = "";
        isStartInclusive = true;
    }

    if (endPattern == null) {
        endPattern = "[\\s\\S]*";
        isEndInclusive = true;
    }

    let re = new RegExp("([\\s\\S]*?)(^.*" + startPattern + ".*$\\n)([\\s\\S]*?)(^.*" + endPattern + ".*$)", "m");

    let matches = text.match(re);

    // Group 1 is the "preface" - everything before the snippet.
    // Group 2 is the lines enclosing the start marker
    // Group 3 is the snippet "body"
    // Group 4 is the lines enclosing the end marker
    if (matches == null)
        return { startLine: 0, snippet: "!!! No matching lines !!!" };

    let preface = isStartInclusive ? matches[1] + matches[2] : matches[1];
    let snippet = (isStartInclusive ? matches[2] : "")
                    + matches[3]
                    + (isEndInclusive ? matches[4] : "");

    startLine = preface.split('\n').length;

    // trimming trailing whitespace (empty lines)
    snippet = snippet.replace(/\s+$/, '');

    if (comment) // [^\S\n] character class is a "double-negative": matches any whitespace, except a newline
        snippet = snippet.replace(new RegExp("[^\\S\\n]*" + comment + ".*$", "mg"), '');

    return { startLine: startLine, snippet: snippet };
}

var fileLoaded = function(file, data) {
   pres = $('pre[src="' + file + '"]');
   $.each(pres, function(i,pre) {
      excerpt = getLines(data,
                         pre.attributes.after ? pre.attributes.after.value : null,
                         pre.attributes.from ? pre.attributes.from.value : null,
                         pre.attributes.until ? pre.attributes.until.value : null,
                         pre.attributes.upto ? pre.attributes.upto.value : null,
                         pre.attributes.comment ? pre.attributes.comment.value : null);

      var language = file.endsWith(".ned") ? "ned" : file.endsWith(".xml") ? "xml"
          : file.endsWith(".ini") ? "ini" : file.endsWith(".py") ? "python"
          : file.endsWith("Dockerfile") ? "dockerfile" : "generic";

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
