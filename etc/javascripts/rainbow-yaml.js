Rainbow.extend('yaml', [
    {
        name: 'yaml',
        matches: {
            1: {
                language: 'yaml'
            }
        },
        pattern: /\$\(([\s\S]*?)\)/gm
    },
    {
        name: 'string',
        pattern: /('|")[\s\S]*?\1/gm
    },
    {
        name: 'literal',
        pattern: /true|false|yes|no|null/gm
    },
    {
        name: 'attribute',
        pattern: /[ \\-]?([ '"]?)*[a-zA-Z_][\w\-]*\1:( |$)/gm
    },
]);
