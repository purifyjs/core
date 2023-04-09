# TODO

-   Template parsing can be done better and faster.
-   We cache template parsing and it happens only once per template at runtime, but we can do better, we can do it on compile time, it's easy.
-   -   Tho that would make the bundle size bigger? No, wait we can remove parser from the bundle. So it might be better.
-   The way we define and use components might cahnge maybe, or not idk.
-   Rewrite template parsers and make it resumable.
-   Preprocessor is not really great, and should be rewriten one day. Probably use TS compiler for it.
