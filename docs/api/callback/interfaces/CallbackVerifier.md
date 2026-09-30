[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackVerifier

# Interface: CallbackVerifier

What checks the token of a callback: [DocumentServerJwt](../../jwt/classes/DocumentServerJwt.md) or
a verifier of your own.

## Methods

### verify()

```ts
verify(token): Promise<unknown>;
```

Answers with what the token carries, or rejects when it cannot be trusted.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `token`   | `string` |

#### Returns

`Promise`\<`unknown`\>
