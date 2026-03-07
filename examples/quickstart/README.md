# templUI Quickstart

This is a ready-to-run quickstart project for templUI.

## Run

```sh
cp .env.example .env
go mod tidy
task dev
```

Open `http://localhost:7331` for templ live preview or `http://localhost:8090` for the app.

If you want your own module path later, run:

```sh
go mod edit -module your/module/path
```
