/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * tree-sitter-bru
 *
 * Grammar for Bruno's `.bru` request files.
 *
 * Key design notes (informed by Scalamando/tree-sitter-bruno and
 * pedrobarco/tree-sitter-bru):
 *
 * 1. Each top-level block type is an explicit named rule (not generated
 *    dynamically) so injection queries can target precise node types.
 *
 * 2. Nested braces inside text blocks (JS scripts, JSON bodies, …) are
 *    handled with recursive grammar rules — no external C scanner needed:
 *
 *      text_content  = repeat1(nested_braces | text_chunk)
 *      nested_braces = "{" repeat(nested_braces | text_chunk) "}"
 *      text_chunk    = /[^{}]+/
 *
 * 3. `value` uses token.immediate() so it is tried *before* extras (newlines)
 *    are consumed.  Without this, empty-value entries like `profileName:` or
 *    `~starting_after:` would incorrectly consume the next line as the value.
 */

module.exports = grammar({
  name: 'bru',

  extras: $ => [/[ \t\r\n]/, $.comment],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._block),

    comment: _ => token(seq('//', /[^\n]*/)),

    // -----------------------------------------------------------------------
    // Top-level blocks
    // -----------------------------------------------------------------------
    _block: $ => choice(
      $.meta,
      $.http,
      $.query,
      $.params_query,
      $.params_path,
      $.headers,
      $.auth,
      $.auth_awsv4,
      $.auth_basic,
      $.auth_bearer,
      $.auth_digest,
      $.auth_oauth2,
      $.auth_ntlm,
      $.auth_wsse,
      $.auth_apikey,
      $.vars,
      $.vars_pre_request,
      $.vars_post_response,
      $.vars_secret,
      $.assert,
      $.body,
      $.body_json,
      $.body_text,
      $.body_xml,
      $.body_sparql,
      $.body_graphql,
      $.body_graphql_vars,
      $.body_form_urlencoded,
      $.body_multipart_form,
      $.settings,
      $.script_pre_request,
      $.script_post_response,
      $.tests,
      $.docs,
    ),

    // -----------------------------------------------------------------------
    // Meta
    // -----------------------------------------------------------------------
    meta: $ => seq(alias('meta', $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // HTTP verbs
    // -----------------------------------------------------------------------
    http: $ => seq(alias($._http_verb, $.keyword), $.dictionary),
    _http_verb: _ => choice(
      'get', 'post', 'put', 'delete', 'patch',
      'options', 'head', 'connect', 'trace',
    ),

    // -----------------------------------------------------------------------
    // GraphQL query block (key-value, distinct from body:graphql text block)
    // -----------------------------------------------------------------------
    query: $ => seq(alias('query', $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Params
    // -----------------------------------------------------------------------
    params_query: $ => seq(alias('params:query', $.keyword), $.dictionary),
    params_path:  $ => seq(alias('params:path',  $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Headers
    // -----------------------------------------------------------------------
    headers: $ => seq(alias('headers', $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Auth  (standalone auth block sets mode; typed variants hold credentials)
    // -----------------------------------------------------------------------
    auth:         $ => seq(alias('auth',         $.keyword), $.dictionary),
    auth_awsv4:   $ => seq(alias('auth:awsv4',   $.keyword), $.dictionary),
    auth_basic:   $ => seq(alias('auth:basic',   $.keyword), $.dictionary),
    auth_bearer:  $ => seq(alias('auth:bearer',  $.keyword), $.dictionary),
    auth_digest:  $ => seq(alias('auth:digest',  $.keyword), $.dictionary),
    auth_oauth2:  $ => seq(alias('auth:oauth2',  $.keyword), $.dictionary),
    auth_ntlm:    $ => seq(alias('auth:ntlm',    $.keyword), $.dictionary),
    auth_wsse:    $ => seq(alias('auth:wsse',    $.keyword), $.dictionary),
    auth_apikey:  $ => seq(alias('auth:apikey',  $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Vars
    // -----------------------------------------------------------------------
    vars:               $ => seq(alias('vars',               $.keyword), $.dictionary),
    vars_pre_request:   $ => seq(alias('vars:pre-request',   $.keyword), $.dictionary),
    vars_post_response: $ => seq(alias('vars:post-response', $.keyword), $.dictionary),
    // vars:secret holds an array (e.g. ["MY_SECRET"])
    vars_secret: $ => seq(alias('vars:secret', $.keyword), $.array),

    // -----------------------------------------------------------------------
    // Assert
    // -----------------------------------------------------------------------
    assert: $ => seq(alias('assert', $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Body blocks
    // -----------------------------------------------------------------------
    body:                $ => seq(alias('body',                 $.keyword), $.text_block),
    body_json:           $ => seq(alias('body:json',            $.keyword), $.text_block),
    body_text:           $ => seq(alias('body:text',            $.keyword), $.text_block),
    body_xml:            $ => seq(alias('body:xml',             $.keyword), $.text_block),
    body_sparql:         $ => seq(alias('body:sparql',          $.keyword), $.text_block),
    body_graphql:        $ => seq(alias('body:graphql',         $.keyword), $.text_block),
    body_graphql_vars:   $ => seq(alias('body:graphql:vars',    $.keyword), $.text_block),
    body_form_urlencoded:$ => seq(alias('body:form-urlencoded', $.keyword), $.dictionary),
    body_multipart_form: $ => seq(alias('body:multipart-form',  $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Settings
    // -----------------------------------------------------------------------
    settings: $ => seq(alias('settings', $.keyword), $.dictionary),

    // -----------------------------------------------------------------------
    // Scripts, tests, docs
    // -----------------------------------------------------------------------
    script_pre_request:   $ => seq(alias('script:pre-request',   $.keyword), $.text_block),
    script_post_response: $ => seq(alias('script:post-response',  $.keyword), $.text_block),
    tests: $ => seq(alias('tests', $.keyword), $.text_block),
    docs:  $ => seq(alias('docs',  $.keyword), $.text_block),

    // -----------------------------------------------------------------------
    // Dictionary  (key: value lines, optionally disabled with ~)
    // -----------------------------------------------------------------------
    dictionary: $ => seq('{', repeat($.pair), '}'),

    pair: $ => seq(
      optional(field('disabled', alias('~', $.disabled_marker))),
      field('key',   $.key),
      ':',
      optional(field('value', $.value)),
    ),

    // Keys: any non-whitespace, non-colon sequence (covers Content-Type,
    // accessKeyId, starting_after, x-api-key, …).  Explicitly excludes
    // tilde (disabled marker) and braces so those are never swallowed.
    key: _ => /[^\s\r\n:~{}]+/,

    // value uses token.immediate() so it is matched BEFORE extras (including
    // '\n') are consumed.  This is the only way to correctly handle empty-
    // value entries like `profileName:` or `~starting_after:` — when nothing
    // but a newline follows the colon, the regex fails and value is absent.
    // The leading [ \t]* captures the space that typically follows the colon.
    value: _ => token.immediate(prec(1, /[ \t]*[^\r\n]+/)),

    // -----------------------------------------------------------------------
    // Array  (used by vars:secret)
    // -----------------------------------------------------------------------
    array: $ => seq('[', repeat(seq($.array_value, optional(','))), ']'),
    array_value: _ => /[^\r\n\s\t\[\],]+/,

    // -----------------------------------------------------------------------
    // Text block  (free-form content: JS, JSON, GraphQL, XML, Markdown, …)
    //
    // Recursive rules handle arbitrarily-nested braces without an external
    // scanner.  Pattern from pedrobarco/tree-sitter-bru.
    //
    //   text_block    = "{" text_content? "}"
    //   text_content  = (nested_braces | text_chunk)+
    //   nested_braces = "{" (nested_braces | text_chunk)* "}"
    //   text_chunk    = /[^{}]+/
    // -----------------------------------------------------------------------
    text_block: $ => seq('{', optional($.text_content), '}'),

    text_content: $ => repeat1(choice(
      $.nested_braces,
      $.text_chunk,
    )),

    nested_braces: $ => seq(
      '{',
      repeat(choice($.nested_braces, $.text_chunk)),
      '}',
    ),

    // Matches any run of characters that are not braces (includes newlines,
    // spaces, punctuation — everything legal inside a script / JSON body).
    text_chunk: _ => /[^{}]+/,

    // Used as the grammar's 'word' rule (identifier-like atoms).
    identifier: _ => /[A-Za-z_][A-Za-z0-9_\-]*/,
  },
});
