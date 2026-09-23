[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / HandleOptions

# Interface: HandleOptions

Overrides of how [DocumentServerCallback.handle](../classes/DocumentServerCallback.md#handle) answers.

## Properties

| Property                                 | Type                         | Description                                                                        |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| <a id="property-onerror"></a> `onError?` | (`error`, `event`) => `void` | Told of the error a handler failed with, before the callback is answered with `1`. |
