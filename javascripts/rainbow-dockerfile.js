Rainbow.extend('dockerfile', [
    {
        matches: {
          1: 'dockerfile-command',
          2: 'dockerfile-command-head',
          3: 'dockerfile-command-tail',
        },
        pattern: /^([A-Z]+| +)(\s+[./a-z]\S+)?(.*)$/gm
    },
    {
        name: 'comment',
        pattern: /\#[\s\S]*?$/gm
    },
]);
