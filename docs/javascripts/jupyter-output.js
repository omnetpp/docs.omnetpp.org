    // Add class="dataframe" to <div> elements enclosing the <table class="dataframe"> elements,
    // so that we can add horizontal scrollbar to it using an "overflow-x: auto" CSS rule.
    document.addEventListener("DOMContentLoaded", function (event) {
        $( "div:has(>table.dataframe)" ).addClass("dataframe");
    });