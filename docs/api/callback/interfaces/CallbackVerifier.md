[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackVerifier

# Interface: CallbackVerifier

Finds and checks the token of a callback. [DocumentServerJwt](../../jwt/classes/DocumentServerJwt.md)
implements it; any object with `verify()` and `readHeader()` works.

## Methods

### readHeader()

```ts
readHeader(headers): string | undefined;
```

Reads the token from the headers of the callback, without checking it. Returns `undefined`
when the headers carry no token.

#### Parameters

| Parameter | Type                                                    |
| --------- | ------------------------------------------------------- |
| `headers` | [`CallbackHeaders`](../type-aliases/CallbackHeaders.md) |

#### Returns

`string` \| `undefined`

---

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
