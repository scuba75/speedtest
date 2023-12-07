#!/bin/bash
file1=$(head -n 1 .testregistry)
tag=$1
if [[ "$file1" ]]
then
  echo 'personal registry set'
  registry="${file1%%[[:cntrl:]]}"
else
  registry="ghcr.io"
  echo "using ghcr.io for test build"
fi
testcontainer="${registry}/${tag}:test"
echo building $testcontainer
docker buildx create --use --name multi-arch-builder
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile -t $testcontainer --push .

echo building ghcr.io/${tag}:latest
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile -t ghcr.io/${tag}:latest --push .
