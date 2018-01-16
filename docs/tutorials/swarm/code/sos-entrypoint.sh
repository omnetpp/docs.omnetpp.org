#!/bin/bash

blob-server -store /root/sos-data -host 0.0.0.0 &
sos-server -blob-server http://0.0.0.0:3001
