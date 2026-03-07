package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/a-h/templ"
	"github.com/joho/godotenv"
	"myapp/assets"
	"myapp/ui/pages"
)

func main() {
	initDotEnv()

	mux := http.NewServeMux()
	setupAssetsRoutes(mux)
	mux.Handle("GET /", templ.Handler(pages.Landing()))

	fmt.Println("Server is running on http://localhost:8090")
	if err := http.ListenAndServe(":8090", mux); err != nil {
		panic(err)
	}
}

func initDotEnv() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Error loading .env file")
	}
}

func setupAssetsRoutes(mux *http.ServeMux) {
	isDevelopment := os.Getenv("GO_ENV") != "production"

	assetHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isDevelopment {
			w.Header().Set("Cache-Control", "no-store")
		}

		var fs http.Handler
		if isDevelopment {
			fs = http.FileServer(http.Dir("./assets"))
		} else {
			fs = http.FileServer(http.FS(assets.Assets))
		}

		fs.ServeHTTP(w, r)
	})

	mux.Handle("GET /assets/", http.StripPrefix("/assets/", assetHandler))
}
