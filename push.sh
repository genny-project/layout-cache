#!/bin/bash

if [ -z "${1}" ]; then
   version="latest"
else
   version="${1}"
fi


docker push gennyproject/layout-cache:${version}
docker tag  gennyproject/layout-cache:${version} gennyproject/layout-cache:latest
docker push gennyproject/layout-cache:latest
