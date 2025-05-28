# Dev Tools
templ:
	templ generate --watch --proxy="http://localhost:8090" --open-browser=false

docs:
	air \
	--build.cmd "go build -o tmp/bin/main ./cmd/docs" \
	--build.bin "tmp/bin/main" \
	--build.delay "100" \
	--build.exclude_dir "node_modules" \
	--build.include_ext "go" \
	--build.stop_on_error "false" \
	--misc.clean_on_exit true

shiki-highlighter:
	cd shiki && npm start

tailwind-clean:
	tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --clean

tailwind-watch:
	tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch

dev:
	make tailwind-clean
	make -j4 tailwind-watch templ docs shiki-highlighter

debug:
	make -j3 templ tailwind-app tailwind
	
generate-sitemap:
	go run ./cmd/sitemap/main.go --baseurl="https://templui.io" --routes="./cmd/docs/main.go" --output="./static/sitemap.xml" --robots="./static/robots.txt"

generate-icons:
	go run cmd/icongen/main.go

install-compinstall:
	go install ./cmd/compinstall
	
# Validate generated HTML files against Eslint plugins
# Step 1: Compile templ files into Go
templ-generate:
	templ generate

# Step 2: Render showcase components into out/showcase/
render-showcases:
	go run ./cmd/render-showcases

# Step 3: Combined task
build-html: templ-generate render-showcases
	@echo "✅ Static showcase HTML rendered to ./out"

# Step 4: Lint HTML output using ESLint
lint-html:
	npx eslint --fix "out/**/*.html" --ext .html

# Step 6: Run full pipeline (build + lint)
validate-html: build-html lint-html

minify-js:
	npx esbuild \
		internal/components/avatar/avatar.js \
		internal/components/calendar/calendar.js \
		internal/components/carousel/carousel.js \
		internal/components/chart/chart.js \
		internal/components/code/code.js \
		internal/components/datepicker/date_picker.js \
		internal/components/drawer/drawer.js \
		internal/components/dropdown/dropdown.js \
		internal/components/input/input.js \
		internal/components/inputotp/input_otp.js \
		internal/components/label/label.js \
		internal/components/modal/modal.js \
		internal/components/popover/popover.js \
		internal/components/progress/progress.js \
		internal/components/rating/rating.js \
		internal/components/selectbox/select_box.js \
		internal/components/slider/slider.js \
		internal/components/tabs/tabs.js \
		internal/components/textarea/textarea.js \
		internal/components/toast/toast.js \
		--minify \
		--bundle \
		--outdir=internal/component_scripts \
		--out-extension:.js=.min.js \
		--entry-names=[name]