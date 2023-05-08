# Rules

-   This is a library.
-   -   So only thing preprocessor should do is making the code faster by caching or baking things.
-   -   Nothing should require preprocessor.
-   No magic, no hidden, try to keep magic out of the code unless without it, things get A LOT less convient.
-   -   And example of magic we use is the `derive` signals, it detects its dependencies automatically based on sync context.
