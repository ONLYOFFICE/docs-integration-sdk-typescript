[@onlyoffice/docs-integration-sdk](../../README.md) / [client](../README.md) / splitFileUrl

# Function: splitFileUrl()

```ts
function splitFileUrl(fileUrl, publicUrl): FileLocation;
```

Splits a location the document server handed out — `url` in a callback, `fileUrl` in a
conversion response, `url` in the answer to `getForgotten` — into the path and the query
[DocumentServerClient.getFile](../classes/DocumentServerClient.md#getfile) takes.

The document server writes these locations against the address it is published at,
`publicUrl`, while the client may reach it at another one, with another host and another
path. So the path of `publicUrl` is taken off the front of the location, and what is left
is relative to the server itself, whichever address the client is configured with. The
host of the location is dropped: it is the public one, or one only the server can reach,
such as the `localhost` of a container. A location whose path does not start with that of
`publicUrl` is kept whole.

## Parameters

| Parameter   | Type              |
| ----------- | ----------------- |
| `fileUrl`   | `string` \| `URL` |
| `publicUrl` | `string` \| `URL` |

## Returns

[`FileLocation`](../interfaces/FileLocation.md)

## Throws

when `fileUrl` or `publicUrl` is not an absolute URL.
