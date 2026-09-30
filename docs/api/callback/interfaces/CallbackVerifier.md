[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackVerifier

# Interface: CallbackVerifier

Checks the token of a callback. [DocumentServerJwt](../../jwt/classes/DocumentServerJwt.md) implements
it; any object with `verify()` works.

## Methods

### verify()

```ts
verify(token): Promise<unknown>;
```

Resolves to the claims of the token, or rejects when the token can't be trusted.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `token`   | `string` |

#### Returns

`Promise`\<`unknown`\>
