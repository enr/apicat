# apicat

Create a single OpenAPI file from a directory.

Source directory expected stucture:

- `_defaults.json`: a minimal OpenAPI definition operating as fallback values
- `_base.json`: an OpenAPI definition used for cross-cutting data
- a list of OpenAPI json files (their name must not be start with `_`)

Usage:

```
node index.js path/to/specs
```

## License

Apache 2.0 - see LICENSE file.

Copyright 2020-TODAY apicat contributors
