[@onlyoffice/docs-integration-sdk](../../README.md) / [config](../README.md) / ConfigSigner

# Interface: ConfigSigner

Signs a config. [DocumentServerJwt](../../jwt/classes/DocumentServerJwt.md) implements it; any object
with `sign()` works, such as a signer backed by a key vault.

## Methods

### sign()

```ts
sign(payload): Promise<string>;
```

Signs the payload and resolves to the token.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `payload` | `object` |

#### Returns

`Promise`\<`string`\>
