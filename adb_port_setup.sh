#!/bin/bash

devices=$(adb devices | grep -w 'device' | cut -f1)

for device in $devices; do
  echo "Setting up for device: $device"
  adb -s $device forward tcp:5277 tcp:5277
  adb -s $device reverse tcp:8081 tcp:8081
done