# tree-sitter-bru

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for
[Bruno](https://www.usebruno.com/) `.bru` request files, with language
injections for the embedded JSON / GraphQL / XML / JavaScript / Markdown
sections.

## Status

🚧 Early scaffold — grammar covers the common shape of `.bru` files
(meta, HTTP verb blocks, headers/query/params, auth, vars, assert,
body, scripts, tests, docs) and wires up injections. Edge cases around
deeply nested braces inside script bodies are still TODO; see
[Known limitations](#known-limitations).

## File shape

```bru
meta {
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
  auth: none
}

headers {
  Content-Type: application/json
  ~X-Debug: 1            // ~ disables this entry
}

body:json {
  {
    "hello": "world"
  }
}

script:pre-request {
  bru.setVar("token", "abc");
}

tests {
  test("status is 200", () => {
    expect(res.status).to.equal(200);
  });
}

docs {
  # Notes
  Markdown goes here.
}
```

The outer grammar is *not* JSON. Bruno uses a tiny block-based DSL
where each top-level block is either a **dictionary** (`key: value`
lines) or a **text block** (free-form content in another language).

## Block kinds

| Kind        | Blocks                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dictionary  | `meta`, `get`/`post`/`put`/`delete`/`patch`/`options`/`head`/`connect`/`trace`, `graphql`, `query`, `params:*`, `headers`, `auth:*`, `vars:*`, `assert`, `body:*` (form variants), `settings` |
| Text + injection | `body:json` → JSON, `body:graphql` → GraphQL, `body:graphql:vars` → JSON, `body:xml` → XML, `script:*` / `tests` → JavaScript, `docs` → Markdown                       |

Disabled dictionary entries are written `~key: value` and tagged with
`@comment.warning` in highlights.

## Build

```sh
npm install
npm run build      # tree-sitter generate
npm test           # tree-sitter test
```

## Use in Neovim (with `nvim-treesitter`)

While the grammar is unreleased, point `nvim-treesitter` at this repo:

```lua
local parser_config = require('nvim-treesitter.parsers').get_parser_configs()
parser_config.bru = {
  install_info = {
    url = 'https://github.com/luca-trifilio/tree-sitter-bru',
    files = { 'src/parser.c' },
    branch = 'main',
    generate_requires_npm = true,
    requires_generate_from_grammar = true,
  },
  filetype = 'bru',
}

vim.filetype.add({ extension = { bru = 'bru' } })
```

Then `:TSInstall bru`. Drop the `queries/` files into
`~/.config/nvim/queries/bru/` (or rely on nvim-treesitter to pick them
up from the repo).

## Known limitations

- `text_content` currently allows **one** level of nested braces. JS
  scripts with deeper nesting (`if (x) { while (y) { ... } }`) will
  confuse the parser. Fix is an external scanner that counts braces;
  planned for v0.2.
- Multi-line dictionary values (rare in Bruno) are not supported.
- No grammar-level validation of which keys are allowed in which
  block — that's a linter's job, not a parser's.

## License

MIT © Luca Trifilio
