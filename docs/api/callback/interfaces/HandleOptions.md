[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / HandleOptions

# Interface: HandleOptions

Options of [DocumentServerCallback.handle](../classes/DocumentServerCallback.md#handle).

## Properties

| Property                                 | Type                         | Description                                                                                                                                                   |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-onerror"></a> `onError?` | (`error`, `event`) => `void` | Called with the error a handler failed with, before the reply `fail` is returned. An error `onError` throws itself is ignored, and the reply is still `fail`. |
