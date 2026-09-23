[@onlyoffice/docs-integration-sdk](../README.md) / [config](../modules/config.md) / DocumentServerConfig

# Class: DocumentServerConfig

The config the editor is opened with: validated, normalized and signed with the secret
the document server is configured with.

The editor takes its config in the browser, so the config travels as JSON — which is
why the `events` of the editor API are no part of it. Those are functions the browser
calls, and they are attached where the editor is constructed, on top of the config that
came from here.

Every field is the one the editor API documents, from `@onlyoffice/doceditor-types`,
where nearly all of them are optional. This class requires what the document server
requires of them, and refuses what it silently rejects.

## Constructors

### Constructor

```ts
new DocumentServerConfig(config): DocumentServerConfig;
```

#### Parameters

| Parameter | Type                                                  |
| --------- | ----------------------------------------------------- |
| `config`  | [`SignableConfig`](../types/config.SignableConfig.md) |

#### Returns

`DocumentServerConfig`

#### Throws

when `document` is missing, `documentType` is missing or empty, a
URL is not absolute, the key is too long or carries a character the server does not
accept, or the config carries the editor events.

## Properties

| Property                     | Modifier   | Type                                                                 | Description                                                              |
| ---------------------------- | ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| <a id="config"></a> `config` | `readonly` | `Readonly`\<[`StrictConfig`](../interfaces/config.StrictConfig.md)\> | The effective config: validated, with the values normalized, and frozen. |

## Methods

### forFile()

```ts
static forFile(
   file,
   formats,
   config?
): DocumentServerConfig;
```

A config for a file, with `fileType` read off its name and `documentType` looked up in
the formats the document server answered with.

Anything else — the callback URL, the user, the permissions, the customization — is
laid over the derived config, and its `document` is merged into the derived one rather
than replacing it.

#### Parameters

| Parameter | Type                                                               |
| --------- | ------------------------------------------------------------------ |
| `file`    | [`ConfigFile`](../interfaces/config.ConfigFile.md)                 |
| `formats` | [`DocumentTypeLookup`](../interfaces/config.DocumentTypeLookup.md) |
| `config?` | [`SignableConfig`](../types/config.SignableConfig.md)              |

#### Returns

`DocumentServerConfig`

#### Throws

when the name carries no extension, or no editor opens it.

---

### sign()

```ts
sign(signer): Promise<Readonly<StrictConfig>>;
```

The config with a `token` signed over it, which is what the editor is handed once the
document server has a secret.

The token covers the whole config apart from itself, so a config that already carries
one is signed anew rather than signed over its own token.

#### Parameters

| Parameter | Type                                                   |
| --------- | ------------------------------------------------------ |
| `signer`  | [`ConfigSigner`](../interfaces/config.ConfigSigner.md) |

#### Returns

`Promise`\<`Readonly`\<[`StrictConfig`](../interfaces/config.StrictConfig.md)\>\>

---

### toJSON()

```ts
toJSON(): Readonly<StrictConfig>;
```

The config itself, so that `JSON.stringify` of the instance writes it out.

#### Returns

`Readonly`\<[`StrictConfig`](../interfaces/config.StrictConfig.md)\>
