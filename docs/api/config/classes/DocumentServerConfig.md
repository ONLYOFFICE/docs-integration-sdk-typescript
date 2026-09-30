[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / DocumentServerConfig

# Class: DocumentServerConfig

The config an editor is opened with. Build it on your server, where the JWT secret is, and
pass the result to `DocsAPI.DocEditor` in the browser.

The constructor validates the input and completes it from the format of the file:

- `document.fileType` is set to the extension of `title`, in lower case;
- `documentType` is set to the editor that opens the format;
- a permission the format doesn't allow is set to `false`: `edit` needs the action `edit` or
  `lossy-edit`, `review` needs `review`, `comment` needs `comment`, `fillForms` needs `fill`,
  `modifyFilter` needs `customfilter`. Other permissions are kept as given;
- `editorConfig.callbackUrl` is kept only in `edit` mode, the default, for a user who can
  change the document: one whose `edit`, `review`, `comment` or `fillForms` is `true` after
  the step above. There it is required. Otherwise it is removed, and
  `editorConfig.customization.forcesave` with it.

`editorConfig.mode` is kept as given. The config has no `events`: they are functions, so add
them in the browser.

## Example

```ts
const config = new DocumentServerConfig(
  {
    document: {
      key: await buildDocumentKey(file.id, file.version),
      title: "Report.docx",
      url: "https://storage.example.com/report.docx",
      permissions: { edit: true },
    },
    editorConfig: {
      callbackUrl: "https://app.example.com/callback?fileId=17",
      user: { id: "u-17", name: "Anna Schmidt" },
    },
  },
  formats,
);

const signed = await config.sign(jwt);
```

## See

[Opening an editor](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/editor.md)

## Constructors

### Constructor

```ts
new DocumentServerConfig(input, formats): DocumentServerConfig;
```

Validates the input and builds the config. The input is copied, so later changes to it have
no effect.

#### Parameters

| Parameter | Type                                            | Description                                                                                                                                                       |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`   | [`ConfigInput`](../type-aliases/ConfigInput.md) | The file, the permissions on it and the whole `editorConfig`.                                                                                                     |
| `formats` | [`FormatLookup`](../interfaces/FormatLookup.md) | The formats of the document server: [DocumentServerFormats](../../formats/classes/DocumentServerFormats.md) or any [FormatLookup](../interfaces/FormatLookup.md). |

#### Returns

`DocumentServerConfig`

#### Throws

[ConfigError](ConfigError.md) of kind `"unsupported"`, with `field` `"document.title"`, when
the document server doesn't know the format of the file or opens it in no editor, such as
`png`.

#### Throws

[ConfigError](ConfigError.md) of kind `"invalid"`, with `field` naming the path, when:

- the input can't be copied with `structuredClone`, such as one holding a function
  (`field` is `"config"`);
- the input, `document`, `document.permissions`, `editorConfig` or `editorConfig.user` is
  not an object;
- `document.key` is not a string, is empty, is longer than 128 characters, or has
  characters other than `0-9`, `a-z`, `A-Z`, `-`, `.`, `_` and `=`;
- `document.title` is not a string or has no extension;
- `document.permissions.edit` is not a boolean, or `comment`, `fillForms`, `modifyFilter`
  or `review` is given and is not a boolean;
- `editorConfig.mode` is given and is neither `"edit"` nor `"view"`;
- `editorConfig.callbackUrl` is missing where it is kept;
- `editorConfig.user.id` is not a string, is empty or is longer than 128 characters;
- a URL is not a string holding an absolute `http` or `https` URL. Checked are
  `document.url` and the kept `editorConfig.callbackUrl`, and, when given, `createUrl`,
  `mergeFolderUrl`, `saveAsUrl`, `sharingSettingsUrl`, the `url` of each item of `recent`
  and `templates`, `customization.feedback.url`, `customization.goback.url`,
  `customization.logo.url`, and `embedUrl`, `fullscreenUrl`, `saveUrl` and `shareUrl` of
  `embedded`. An empty or `null` `customization.logo.url` is allowed: it makes the logo
  not clickable.

## Properties

| Property                              | Modifier   | Type                                                          | Description                                                               |
| ------------------------------------- | ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <a id="property-config"></a> `config` | `readonly` | `Readonly`\<[`StrictConfig`](../interfaces/StrictConfig.md)\> | The config the constructor built: validated, completed and deeply frozen. |

## Methods

### sign()

```ts
sign(signer): Promise<Readonly<StrictConfig>>;
```

Returns a copy of the config with a `token` field. The editor needs it once the document
server has a JWT secret.

The token covers the whole config except `token`, so a config that already has a token is
signed again from scratch.

#### Parameters

| Parameter | Type                                            | Description                                                                                                       |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `signer`  | [`ConfigSigner`](../interfaces/ConfigSigner.md) | [DocumentServerJwt](../../jwt/classes/DocumentServerJwt.md) or any [ConfigSigner](../interfaces/ConfigSigner.md). |

#### Returns

`Promise`\<`Readonly`\<[`StrictConfig`](../interfaces/StrictConfig.md)\>\>

The signed config, frozen.

---

### toJSON()

```ts
toJSON(): Readonly<StrictConfig>;
```

Returns [DocumentServerConfig.config](#property-config), so `JSON.stringify(instance)` writes the config.

#### Returns

`Readonly`\<[`StrictConfig`](../interfaces/StrictConfig.md)\>
