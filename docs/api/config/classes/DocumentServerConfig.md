[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / DocumentServerConfig

# Class: DocumentServerConfig

The config the editor is opened with, built out of what your system knows of the file
and the formats of the document server: validated, completed and signed with the secret
the document server is configured with.

What your system knows goes in — the file, the permissions it grants, the whole
`editorConfig`. What the document server decides is derived, over whatever was given:

- `document.fileType` is the extension `title` ends in;
- `documentType` is the editor the server opens that format in;
- a permission the format does not allow — `edit`, `review`, `comment`, `fillForms`,
  `modifyFilter` — is lowered to `false`;
- `callbackUrl` is kept only in `edit` mode for a user who may change the document, and
  required there; anywhere else it is cut, `customization.forcesave` along with it.

`mode` is left as it was given. The editor takes its config in the browser, so the
config travels as JSON — which is why the `events` of the editor API are no part of it.

## Constructors

### Constructor

```ts
new DocumentServerConfig(input, formats): DocumentServerConfig;
```

#### Parameters

| Parameter | Type                                            | Description                                                  |
| --------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `input`   | [`ConfigInput`](../type-aliases/ConfigInput.md) | What your system knows of the editor it opens.               |
| `formats` | [`FormatLookup`](../interfaces/FormatLookup.md) | The formats of the document server, or a lookup of your own. |

#### Returns

`DocumentServerConfig`

#### Throws

[ConfigError](ConfigError.md) `unsupported` when no editor of the server opens the format
of the file, and `invalid` when a field is missing or would be rejected by the server.

## Properties

| Property                              | Modifier   | Type                                                          | Description                                                                 |
| ------------------------------------- | ---------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| <a id="property-config"></a> `config` | `readonly` | `Readonly`\<[`StrictConfig`](../interfaces/StrictConfig.md)\> | The effective config: validated, completed, and frozen through and through. |

## Methods

### sign()

```ts
sign(signer): Promise<Readonly<StrictConfig>>;
```

The config with a `token` signed over it, which is what the editor is handed once the
document server has a secret.

The token covers the whole config apart from itself, so a config that already carries
one is signed anew rather than signed over its own token.

#### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `signer`  | [`ConfigSigner`](../interfaces/ConfigSigner.md) |

#### Returns

`Promise`\<`Readonly`\<[`StrictConfig`](../interfaces/StrictConfig.md)\>\>

---

### toJSON()

```ts
toJSON(): Readonly<StrictConfig>;
```

The config itself, so that `JSON.stringify` of the instance writes it out.

#### Returns

`Readonly`\<[`StrictConfig`](../interfaces/StrictConfig.md)\>
