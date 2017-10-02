Rainbow.extend('dockerfile', [
    {
        matches: {
          1: 'command',
          2: 'command-head',
          3: 'command-tail',
        },
        pattern: /^([A-Z]+| +)(\s+[./a-z]\S+)?(.*)$/gm
    },
    {
        name: 'comment',
        pattern: /\#[\s\S]*?$/gm
    },
]);
