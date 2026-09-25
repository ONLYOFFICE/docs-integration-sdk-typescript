[@onlyoffice/docs-integration-sdk](../../README.md) / [callback](../README.md) / CallbackHandlers

# Interface: CallbackHandlers

What is done with each event. A kind with no handler is taken as it is.

## Properties

| Property                                                 | Type                                       |
| -------------------------------------------------------- | ------------------------------------------ |
| <a id="property-closed"></a> `closed?`                   | (`event`) => `void` \| `Promise`\<`void`\> |
| <a id="property-editing"></a> `editing?`                 | (`event`) => `void` \| `Promise`\<`void`\> |
| <a id="property-forcesave"></a> `forcesave?`             | (`event`) => `void` \| `Promise`\<`void`\> |
| <a id="property-forcesave-error"></a> `forcesave-error?` | (`event`) => `void` \| `Promise`\<`void`\> |
| <a id="property-save"></a> `save`                        | (`event`) => `void` \| `Promise`\<`void`\> |
| <a id="property-save-error"></a> `save-error?`           | (`event`) => `void` \| `Promise`\<`void`\> |
| <a id="property-unknown"></a> `unknown?`                 | (`event`) => `void` \| `Promise`\<`void`\> |
