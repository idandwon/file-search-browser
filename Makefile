SHELL := /bin/sh

STORE ?=
EXPORT_OUT ?= .generated/file-search/documents.csv
EXTRACT_IN ?= $(EXPORT_OUT)
EXTRACT_OUT ?= .generated/file-search/document-item-ids.csv

.PHONY: help export export-documents extract extract-item-ids refresh

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make export STORE="<display-name-or-store-id>"' \
		'  make extract' \
		'  make refresh STORE="<display-name-or-store-id>"' \
		'' \
		'Optional overrides:' \
		'  EXPORT_OUT=.generated/file-search/documents.csv' \
		'  EXTRACT_IN=.generated/file-search/documents.csv' \
		'  EXTRACT_OUT=.generated/file-search/document-item-ids.csv'

export:
	@if [ -z "$(STORE)" ]; then \
		printf '%s\n' 'STORE is required. Example: make export STORE="bankhapoalim-documents-512-64-cleaned"' >&2; \
		exit 1; \
	fi
	node scripts/export-store-documents.mjs --store "$(STORE)" --out "$(EXPORT_OUT)"

export-documents: export

extract:
	node scripts/extract-document-item-ids.mjs --in "$(EXTRACT_IN)" --out "$(EXTRACT_OUT)"

extract-item-ids: extract

refresh: export extract
