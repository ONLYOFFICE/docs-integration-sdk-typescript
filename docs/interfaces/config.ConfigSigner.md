[@onlyoffice/docs-integration-sdk](../README.md) / [config](../modules/config.md) / ConfigSigner

# Interface: ConfigSigner

What signs a config: [DocumentServerJwt](../classes/jwt.DocumentServerJwt.md) or any signer of your
own.

## Methods

### sign()

```ts
sign(payload): Promise<string>;
```

Signs the payload into a token.

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `payload` | `object` |

#### Returns

`Promise`\<`string`\>
