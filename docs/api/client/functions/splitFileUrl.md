[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / splitFileUrl

# Function: splitFileUrl()

```ts
function splitFileUrl(fileUrl, publicUrl): FileLocation;
```

Splits a file URL the document server handed out into the path and the query
[DocumentServerClient.getFile](../classes/DocumentServerClient.md#getfile) takes. Such URLs are `url` of a callback, `fileUrl` of
a conversion and `url` of the `getForgotten` command.

The URL points to the public address of the document server, while the client may reach it
at another host and path. So:

- the host is dropped: the client sends the path to its own `baseUrl`;
- the path of `publicUrl` is removed from the front of the path. A path that doesn't start
  with it is kept whole, such as one under the `localhost` of a container.

## Parameters

| Parameter   | Type              | Description                                                                    |
| ----------- | ----------------- | ------------------------------------------------------------------------------ |
| `fileUrl`   | `string` \| `URL` | The URL the document server handed out.                                        |
| `publicUrl` | `string` \| `URL` | The public address of the document server, the one editors load `api.js` from. |

## Returns

[`FileLocation`](../interfaces/FileLocation.md)

## Example

```ts
splitFileUrl(
  "https://docs.example.com/office/cache/files/key/output.pdf?md5=Zm9v&expires=1735689600",
  "https://docs.example.com/office",
);
// { path: "/cache/files/key/output.pdf", query: { md5: "Zm9v", expires: "1735689600" } }
```

## Throws

when `fileUrl` or `publicUrl` is not an absolute URL.

## See

[Downloading files](https://github.com/ONLYOFFICE/docs-integration-sdk-typescript/blob/master/docs/guides/files.md)
