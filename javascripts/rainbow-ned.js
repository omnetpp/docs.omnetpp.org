/**
 * Shell patterns
 *
 * @author Matthew King
 * @author Craig Campbell
 */
Rainbow.extend('ned', [
    /**
     * This handles the case where subshells contain quotes.
     * For example: `"$(resolve_link "$name" || true)"`.
     *
     * Caveat: This really should match balanced parentheses, but cannot.
     * @see http://stackoverflow.com/questions/133601/can-regular-expressions-be-used-to-match-nested-patterns
     */
    {
        name: 'ned',
        matches: {
            1: {
                language: 'ned'
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
        name: 'constant.symbol',
        pattern: /@[a-zA-Z0-9_]+/g
    },
    {
        name: 'comment',
        pattern: /\/\/[\s\S]*?$/gm
    },
    {
        matches: {
            1: 'keyword'
        },
        pattern: /\b(allowunconnected|bool|channel|channelinterface|connections|const|default|double|extends|false|for|gates|if|import|index|inout|input|int|like|module|moduleinterface|network|output|package|parameters|property|simple|sizeof|string|submodules|this|true|typename|types|volatile|xml|xmldoc)(?=\b)/g
    }
]);