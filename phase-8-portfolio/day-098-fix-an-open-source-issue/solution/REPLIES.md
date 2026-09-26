## #21

Thanks for the report! This one is working as intended: `lowercase: false` is the option that keeps capitals ([README, options](README.md#api)). It was added in 2.2.0 for sites that want them (#3). Leave the option out, or set `lowercase: true`, and you'll get `unicode-party`. Closing, but shout if the docs could say it more clearly.

## #24

Thanks! This is the same bug as #12: a symbol between two spaces left two dashes behind. It's fixed in the pull request for #12, which closes this one too. Closing as a duplicate of #12, so the discussion stays in one place.
