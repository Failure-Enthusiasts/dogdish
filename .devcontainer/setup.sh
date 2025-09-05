#! /bin/bash

echo "Setting up devcontainer..."

echo "Installing sqlc manually since there is no devcontainer feature for it ..."
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest > /dev/null 2>&1

echo "sqlc version: $(sqlc version)"

echo "Installing air manually since there is no devcontainer feature for it ..."
go install github.com/air-verse/air@latest > /dev/null 2>&1

echo "air version: $(air -v)"