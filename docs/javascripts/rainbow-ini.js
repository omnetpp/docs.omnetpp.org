Rainbow.extend('ini', [
    {
        name: 'ini',
        matches: {
            1: {
                language: 'ini'
            }
        },
        pattern: /\$\(([\s\S]*?)\)/gm
    },
    {
        matches: {
            2: 'string'
        },
        pattern: /(\(|\s|\[|\=)(('|")[\s\S]*?(\3))/gm
    },
    {
        name: 'comment',
        pattern: /\#[\s\S]*?$/gm
    },
    {
        name: 'config',
        pattern: /\[Config.*?\]/gm
    },
    {
        name: 'config',
        pattern: /\[General\]/gm
    },
    {
        matches: {
            1: 'keyword'
        },
        pattern: /\b(include)(?=\b)/g
    }
]);