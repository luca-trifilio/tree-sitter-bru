/**
 * tree-sitter-bru
 *
 * Grammar for Bruno's `.bru` request files.
 *
 * A .bru file is a flat sequence of named blocks:
 *
 *   blockname { ... }
 *   blockname:subtype { ... }
 *
 * Each block is either:
 *   - a "dictionary" block: lines of `key: value` (optionally prefixed
 *     with `~` to mark the entry as disabled),
 *   - or a "text" block: arbitrary content (JSON, JS, GraphQL, XML,
 *     markdown, ...) which is highlighted via tree-sitter language
 *     injections (see queries/injections.scm).
 *
 * The split between dictionary and text blocks is decided here, by
 * matching the block header against known names.
 */

const DICT_BLOCKS = [
  'meta',
  'get', 'post', 'put', 'delete', 'patch',
  'options', 'head', 'connect', 'trace',
  'graphql',
  'query',
  'params', // params:query, params:path, ...
  'headers',
  'auth',   // auth:basic, auth:bearer, auth:apikey, auth:digest, auth:oauth2, auth:awsv4, auth:wsse, auth:ntlm
  'vars',   // vars:pre-request, vars:post-response
  'assert',
  'body',   // body:form-urlencoded, body:multipart-form, body:file (dictionary forms)
  'settings',
];

const TEXT_BLOCKS = [
  'script',  // script:pre-request, script:post-response
  'tests',
  'docs',
  // body text variants are handled by a more specific rule below
];

module.exports = grammar({
  name: 'bru',

  extras: $ => [/[ \t\r\n]/, $.comment],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._block),

    comment: _ => token(seq('//', /[^\n]*/)),

    _block: $ => choice(
      $.text_block,
      $.dictionary_block,
    ),

    // ---------------------------------------------------------------
    // Dictionary blocks
    // ---------------------------------------------------------------
    dictionary_block: $ => seq(
      field('name', $._dict_block_name),
      '{',
      repeat($.entry),
      '}',
    ),

    _dict_block_name: $ => choice(
      ...DICT_BLOCKS.map(name =>
        alias(
          token(prec(2, seq(name, optional(seq(':', /[A-Za-z0-9_\-]+/))))),
          $.block_name,
        ),
      ),
    ),

    entry: $ => seq(
      optional(field('disabled', alias('~', $.disabled_marker))),
      field('key', $.key),
      ':',
      optional(field('value', $.value)),
      /\r?\n|$/,
    ),

    key: _ => token(prec(1, /[A-Za-z_][A-Za-z0-9_\-\.\$]*/)),

    // Value runs to end of line. Multi-line values are not supported
    // inside dictionary blocks (Bruno doesn't use them there).
    value: _ => token(prec(-1, /[^\r\n]+/)),

    // ---------------------------------------------------------------
    // Text blocks (free-form body, scripts, docs)
    // ---------------------------------------------------------------
    text_block: $ => seq(
      field('name', $._text_block_name),
      '{',
      optional(field('content', $.text_content)),
      '}',
    ),

    _text_block_name: $ => choice(
      // body:json, body:text, body:xml, body:sparql, body:graphql, body:graphql:vars
      alias(
        token(prec(3, seq(
          'body',
          ':',
          choice('json', 'text', 'xml', 'sparql', 'graphql'),
          optional(seq(':', /[A-Za-z0-9_\-]+/)),
        ))),
        $.block_name,
      ),
      ...TEXT_BLOCKS.map(name =>
        alias(
          token(prec(3, seq(name, optional(seq(':', /[A-Za-z0-9_\-]+/))))),
          $.block_name,
        ),
      ),
    ),

    // Greedy content that stops at the *final* matching `}`.
    // We match the whole inner body as a single token, balancing braces.
    // Tree-sitter doesn't have lookahead to "the closing brace at column 0",
    // so we use an external-free heuristic: consume any character that is
    // not `}` OR a `}` that is followed by more non-whitespace on its line.
    //
    // Simpler and good enough in practice: balanced-brace scanner.
    text_content: _ => token(prec(-2, repeat1(choice(
      /[^{}]+/,
      /\{[^{}]*\}/, // one level of nested braces (covers inline JSON objects)
    )))),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_\-]*/,
  },
});
